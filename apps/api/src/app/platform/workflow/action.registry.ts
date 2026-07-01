import { Injectable, Logger } from '@nestjs/common';
import type { GuardContext } from './guard.registry';

/** Actions share the guard context plus a mutable patch they can write back. */
export interface ActionContext extends GuardContext {
  /** Patch merged into WorkflowInstance.contextJson after the action runs. */
  patch: Record<string, unknown>;
}

export type ActionFn = (ctx: ActionContext) => Promise<void> | void;

/**
 * Named transition actions (DOMAIN-ARCHITECTURE.md §4/§5).
 *
 * GUARDRAILS #1/#2: actions here record state and hand off to partners — they
 * NEVER move/custody funds or make lending decisions. The escrow actions are
 * Phase-1 stubs that only mark intent; the escrow feature flag is off until a
 * licensed PSP is wired in Phase 3.
 */
@Injectable()
export class ActionRegistry {
  private readonly map = new Map<string, ActionFn>();
  private readonly logger = new Logger(ActionRegistry.name);

  constructor() {
    this.registerBuiltins();
  }

  register(key: string, fn: ActionFn): void {
    if (this.map.has(key)) {
      throw new Error(`Duplicate action key: "${key}"`);
    }
    this.map.set(key, fn);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }

  resolve(key: string): ActionFn {
    const fn = this.map.get(key);
    if (!fn) {
      throw new Error(
        `Unregistered action: "${key}". Registered: [${this.keys().join(', ')}]`,
      );
    }
    return fn;
  }

  private registerBuiltins(): void {
    // Phase-1 stubs: record intent only. No funds move here (GUARDRAIL #1).
    this.register('create_escrow_order', (ctx) => {
      this.logger.warn(
        `create_escrow_order is a stub — no PSP wired yet. domain=${ctx.domain.key}`,
      );
      ctx.patch['escrowOrderRequestedAt'] = new Date().toISOString();
    });

    this.register('release_milestone', (ctx) => {
      this.logger.warn(
        `release_milestone is a stub — release is performed by the PSP partner, not the platform.`,
      );
      ctx.patch['milestoneReleaseRequestedAt'] = new Date().toISOString();
    });

    this.register('open_dispute_case', (ctx) => {
      ctx.patch['disputeOpenedAt'] = new Date().toISOString();
      ctx.patch['disputeReason'] = ctx.payload?.['reason'] ?? null;
    });
  }
}
