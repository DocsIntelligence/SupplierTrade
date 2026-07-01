import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JsonSchemaService } from '../schema/json-schema.service';
import { VerificationAdapterRegistry } from '../registries/verification-adapter.registry';
import { QcScorerRegistry } from '../registries/qc-scorer.registry';
import { WorkflowEngine } from '../workflow/workflow.engine';
import type { DomainConfig, SignalRef } from './domain.types';

/**
 * Fail-fast config validation (DOMAIN-ARCHITECTURE.md §2 rules + §5).
 * Validates a DomainConfig against the committed meta-schema AND asserts every
 * referenced plugin key (verification adapter, QC scorer, workflow guard/action)
 * is registered. Throws an aggregated error — at load, never at runtime.
 */
@Injectable()
export class DomainConfigValidator {
  constructor(
    private readonly schema: JsonSchemaService,
    private readonly verificationRegistry: VerificationAdapterRegistry,
    private readonly qcRegistry: QcScorerRegistry,
    private readonly workflow: WorkflowEngine,
  ) {}

  /** Throws if invalid; otherwise returns the config unchanged. */
  validateOrThrow(domain: DomainConfig): DomainConfig {
    const errors = this.collectErrors(domain);
    if (errors.length) {
      throw new Error(
        `Invalid domain config "${domain.key}":\n  - ${errors.join('\n  - ')}`,
      );
    }
    return domain;
  }

  collectErrors(domain: DomainConfig): string[] {
    const errors: string[] = [];

    // 1. Meta-schema shape.
    const meta = this.loadMetaSchema();
    const metaResult = this.schema.validate(meta, domain, 'domain.meta');
    if (!metaResult.valid) {
      errors.push(...metaResult.errors.map((e) => `meta-schema: ${e}`));
    }

    // 2. Verification signals (domain-level + per supplier_type) registered.
    for (const sig of this.allSignals(domain)) {
      if (!this.verificationRegistry.has(sig.key)) {
        errors.push(`verification adapter "${sig.key}" is not registered`);
      }
    }

    // 3. QC scorer registered.
    const scorer = domain.qc_profile?.scorer;
    if (scorer && !this.qcRegistry.has(scorer)) {
      errors.push(`QC scorer "${scorer}" is not registered`);
    }

    // 4. Workflow guards/actions registered + structurally sound.
    errors.push(
      ...this.workflow.validateWorkflow(domain.workflow).map((e) => `workflow: ${e}`),
    );

    return errors;
  }

  private allSignals(domain: DomainConfig): SignalRef[] {
    const out: SignalRef[] = [
      ...(domain.verification_profile?.required_signals ?? []),
    ];
    for (const type of domain.supplier_types ?? []) {
      out.push(...(type.verification_signals ?? []));
    }
    return out;
  }

  private loadMetaSchema(): Record<string, unknown> | undefined {
    const fromEnv = process.env['DOMAIN_CONFIG_DIR'];
    const base = fromEnv
      ? resolve(fromEnv)
      : resolve(process.cwd(), 'config', 'domains');
    // meta schema sits one level up: config/domain.meta.schema.json
    const path = join(base, '..', 'domain.meta.schema.json');
    if (!existsSync(path)) return undefined;
    return JSON.parse(readFileSync(path, 'utf8'));
  }
}
