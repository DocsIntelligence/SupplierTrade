import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DomainsService } from '../../platform/domains/domains.service';
import {
  findSupplierType,
  type DomainConfig,
  type SignalRef,
} from '../../platform/domains/domain.types';
import { VerificationAdapterRegistry } from '../../platform/registries/verification-adapter.registry';
import type { VerificationSignalResult } from '../../platform/registries/verification-adapter.interface';
import { WorkflowEngine } from '../../platform/workflow/workflow.engine';
import { ExprEvaluator } from '../../platform/expression/expr.evaluator';
import {
  SignalStatus,
  VerificationStatus,
  WorkflowSubject,
} from '@org/utils';

/**
 * Assembles a GRADED VerificationReport (PLANNING GUARDRAIL #3 — never binary).
 *
 * It iterates the domain's `required_signals` AND the selected supplier_type's
 * `verification_signals` (DOMAIN-ARCHITECTURE.md §2b/§5), evaluating each
 * `required_if` via the shared ExprEvaluator, resolves each adapter by key from
 * the registry, runs it, and grades the aggregate against the domain threshold.
 * Then it drives the workflow `verification_done` transition.
 */
@Injectable()
export class VerificationEngineService {
  private readonly logger = new Logger(VerificationEngineService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly domains: DomainsService,
    private readonly registry: VerificationAdapterRegistry,
    private readonly workflow: WorkflowEngine,
    private readonly expr: ExprEvaluator,
  ) {}

  /** Graded verification reports for a supplier, newest first. */
  reports(supplierId: string) {
    return this.db.verificationReport.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async run(supplierId: string) {
    const supplier = await this.db.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const domain = await this.domains.getConfig(supplier.domainKey);
    const attributes =
      (supplier.attributes as Record<string, unknown>) ?? {};
    const exprCtx = { supplier_type: supplier.supplierType, ...attributes };

    const signals = this.applicableSignals(domain, supplier.supplierType, exprCtx);

    const results: Record<string, VerificationSignalResult> = {};
    let passed = 0;
    let flagged = 0;
    for (const sig of signals) {
      const adapter = this.registry.resolve(sig.key);
      const result = await adapter.run({
        supplier: {
          id: supplier.id,
          domainKey: supplier.domainKey,
          supplierType: supplier.supplierType,
          gstin: supplier.gstin,
          legalName: supplier.legalName,
          attributes,
        },
        domain,
      });
      results[sig.key] = result;
      if (result.status === SignalStatus.PASS) passed++;
      if (result.status === SignalStatus.FLAG) flagged++;
    }

    const threshold =
      domain.verification_profile?.thresholds?.min_signals_for_verified ?? 1;
    const status =
      passed >= threshold
        ? VerificationStatus.VERIFIED
        : flagged > 0
          ? VerificationStatus.FLAGGED
          : VerificationStatus.INSUFFICIENT;

    const report = await this.db.verificationReport.create({
      data: {
        domainKey: supplier.domainKey,
        supplierId: supplier.id,
        status,
        signalsJson: results as object,
        summary: `${passed}/${signals.length} signals passed (threshold ${threshold}); ${flagged} flagged.`,
      },
    });

    await this.driveWorkflow(supplier.id, domain, passed);
    this.logger.log(
      `Verification ${supplier.id}: ${status} (${passed} passed, ${flagged} flagged)`,
    );
    return report;
  }

  /** Union of domain-level + supplier_type signals whose `required_if` holds. */
  private applicableSignals(
    domain: DomainConfig,
    supplierType: string,
    exprCtx: Record<string, unknown>,
  ): SignalRef[] {
    const all: SignalRef[] = [
      ...(domain.verification_profile?.required_signals ?? []),
      ...(findSupplierType(domain, supplierType)?.verification_signals ?? []),
    ];
    // De-dupe by key (a type may repeat a domain-level signal) + apply required_if.
    const seen = new Set<string>();
    return all.filter((s) => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return s.required || this.expr.evaluate(s.required_if, exprCtx);
    });
  }

  /** Persist `signalsPassed` into the workflow context, then advance state. */
  private async driveWorkflow(
    supplierId: string,
    domain: DomainConfig,
    passed: number,
  ) {
    const instance = await this.db.workflowInstance.findUnique({
      where: {
        subjectType_subjectId: {
          subjectType: WorkflowSubject.SUPPLIER,
          subjectId: supplierId,
        },
      },
    });
    if (!instance) return;

    if (instance.currentState === 'submitted') {
      await this.workflow.send(
        WorkflowSubject.SUPPLIER,
        supplierId,
        'start_verification',
        { domain },
      );
    }

    const ctx = (instance.contextJson as Record<string, unknown>) ?? {};
    await this.db.workflowInstance.update({
      where: { id: instance.id },
      data: { contextJson: { ...ctx, signalsPassed: passed } as object },
    });

    await this.workflow.send(
      WorkflowSubject.SUPPLIER,
      supplierId,
      'verification_done',
      { domain },
    );

    const after = await this.db.workflowInstance.findUnique({
      where: { id: instance.id },
    });
    if (after) {
      await this.db.supplier.update({
        where: { id: supplierId },
        data: { status: after.currentState },
      });
    }
  }
}
