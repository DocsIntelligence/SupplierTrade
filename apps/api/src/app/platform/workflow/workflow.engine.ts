import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import type { DomainConfig } from '../domains/domain.types';
import type { Transition, WorkflowDef } from './workflow.types';
import { GuardRegistry, type GuardContext } from './guard.registry';
import { ActionRegistry, type ActionContext } from './action.registry';

export interface SendOptions {
  domain: DomainConfig;
  actor?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * The single generic state-machine interpreter (DOMAIN-ARCHITECTURE.md §4).
 * It never references a specific domain. Guards/actions resolve by key via the
 * registries; `feature.<flag>` guards read the domain's feature_flags. Every
 * transition writes a WorkflowEvent and an AuditLog entry.
 */
@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly guards: GuardRegistry,
    private readonly actions: ActionRegistry,
  ) {}

  /**
   * Static validation used at config load (fail-fast, DOMAIN-ARCHITECTURE §4).
   * Returns a list of human-readable errors (empty = valid).
   */
  validateWorkflow(def: WorkflowDef | undefined): string[] {
    if (!def) return ['workflow is missing'];
    const errors: string[] = [];
    const states = new Set(def.states);

    if (!states.has(def.initial)) {
      errors.push(`initial state "${def.initial}" is not in states[]`);
    }
    for (const t of def.transitions) {
      if (t.from !== '*' && !states.has(t.from)) {
        errors.push(`transition.from "${t.from}" is not a known state`);
      }
      if (!states.has(t.to)) {
        errors.push(`transition.to "${t.to}" is not a known state`);
      }
      if (t.guard && !this.guards.has(t.guard)) {
        errors.push(`transition references unregistered guard "${t.guard}"`);
      }
      if (t.action && !this.actions.has(t.action)) {
        errors.push(`transition references unregistered action "${t.action}"`);
      }
    }
    return errors;
  }

  /** Create a new instance in the workflow's initial state. */
  createInstance(args: {
    domainKey: string;
    workflowVersion: number;
    subjectType: string;
    subjectId: string;
    def: WorkflowDef;
    context?: Record<string, unknown>;
  }) {
    return this.db.workflowInstance.create({
      data: {
        domainKey: args.domainKey,
        workflowVersion: args.workflowVersion,
        subjectType: args.subjectType,
        subjectId: args.subjectId,
        currentState: args.def.initial,
        contextJson: (args.context ?? {}) as object,
      },
    });
  }

  /**
   * Fire `event` against the instance for `subject`. Resolves the first
   * matching transition whose guard passes, runs its action, advances state,
   * and records WorkflowEvent + AuditLog.
   */
  async send(
    subjectType: string,
    subjectId: string,
    event: string,
    opts: SendOptions,
  ) {
    const instance = await this.db.workflowInstance.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
    });
    if (!instance) {
      throw new BadRequestException(
        `No workflow instance for ${subjectType}:${subjectId}`,
      );
    }

    const def = opts.domain.workflow;
    if (!def) {
      throw new BadRequestException(
        `Domain "${opts.domain.key}" has no workflow`,
      );
    }

    const ctx: GuardContext = {
      domain: opts.domain,
      instance: {
        currentState: instance.currentState,
        contextJson: (instance.contextJson as Record<string, unknown>) ?? {},
      },
      event,
      payload: opts.payload,
    };

    const transition = this.pickTransition(def.transitions, ctx);
    if (!transition) {
      throw new BadRequestException(
        `Event "${event}" is not allowed from state "${instance.currentState}"`,
      );
    }

    // Run the action (if any), collecting a context patch.
    const patch: Record<string, unknown> = {};
    if (transition.action) {
      const actionCtx: ActionContext = { ...ctx, patch };
      await this.actions.resolve(transition.action)(actionCtx);
    }

    const mergedContext = { ...ctx.instance.contextJson, ...patch };
    const updated = await this.db.workflowInstance.update({
      where: { id: instance.id },
      data: { currentState: transition.to, contextJson: mergedContext as object },
    });

    await this.db.workflowEvent.create({
      data: {
        instanceId: instance.id,
        fromState: instance.currentState,
        toState: transition.to,
        event,
        actor: opts.actor ?? null,
      },
    });

    await this.audit.record({
      actorId: opts.actor ?? null,
      action: `workflow.${event}`,
      targetType: subjectType,
      targetId: subjectId,
      before: { state: instance.currentState },
      after: { state: transition.to },
    });

    this.logger.debug(
      `${subjectType}:${subjectId} ${instance.currentState} --${event}--> ${transition.to}`,
    );
    return updated;
  }

  private pickTransition(
    transitions: Transition[],
    ctx: GuardContext,
  ): Transition | undefined {
    const candidates = transitions.filter(
      (t) =>
        t.on === ctx.event &&
        (t.from === '*' || t.from === ctx.instance.currentState),
    );
    return candidates.find((t) => this.guardPasses(t.guard, ctx));
  }

  private guardPasses(guard: string | undefined, ctx: GuardContext): boolean {
    if (!guard) return true;
    if (guard.startsWith('feature.')) {
      const flag = guard.slice('feature.'.length);
      return ctx.domain.feature_flags?.[flag] === true;
    }
    return this.guards.resolve(guard)(ctx);
  }
}
