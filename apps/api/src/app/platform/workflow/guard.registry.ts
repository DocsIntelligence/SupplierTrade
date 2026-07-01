import { Injectable } from '@nestjs/common';
import type { DomainConfig } from '../domains/domain.types';

export interface GuardContext {
  domain: DomainConfig;
  instance: {
    currentState: string;
    contextJson: Record<string, unknown>;
  };
  event: string;
  payload?: Record<string, unknown>;
}

export type GuardFn = (ctx: GuardContext) => boolean;

/**
 * Named transition guards (DOMAIN-ARCHITECTURE.md §4/§5). The `feature.<flag>`
 * pseudo-guard is handled by the engine directly (reads domain.feature_flags),
 * so it does not need to be registered here. Fail-fast on unknown/duplicate.
 */
@Injectable()
export class GuardRegistry {
  private readonly map = new Map<string, GuardFn>();

  constructor() {
    this.registerBuiltins();
  }

  register(key: string, fn: GuardFn): void {
    if (this.map.has(key)) {
      throw new Error(`Duplicate guard key: "${key}"`);
    }
    this.map.set(key, fn);
  }

  /** `feature.*` is engine-handled; treat as always-known. */
  has(key: string): boolean {
    return key.startsWith('feature.') || this.map.has(key);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }

  resolve(key: string): GuardFn {
    const fn = this.map.get(key);
    if (!fn) {
      throw new Error(
        `Unregistered guard: "${key}". Registered: [${this.keys().join(', ')}]`,
      );
    }
    return fn;
  }

  private registerBuiltins(): void {
    // All required fields present on the subject (set by the calling service
    // into context as `requiredFieldsPresent`).
    this.register(
      'required_fields_present',
      (ctx) => ctx.instance.contextJson['requiredFieldsPresent'] !== false,
    );

    // Verification signals met the domain threshold. The verification engine
    // writes `signalsPassed` into context; threshold comes from domain config.
    this.register('signals_meet_threshold', (ctx) =>
      this.meetsThreshold(ctx),
    );
    this.register(
      'signals_below_threshold',
      (ctx) => !this.meetsThreshold(ctx),
    );

    // QC outcome (qc engine writes `qcPassed` into context).
    this.register(
      'qc_score_pass',
      (ctx) => ctx.instance.contextJson['qcPassed'] === true,
    );
    this.register(
      'qc_score_fail',
      (ctx) => ctx.instance.contextJson['qcPassed'] === false,
    );
  }

  private meetsThreshold(ctx: GuardContext): boolean {
    const passed = Number(ctx.instance.contextJson['signalsPassed'] ?? 0);
    const min =
      ctx.domain.verification_profile?.thresholds
        ?.min_signals_for_verified ?? 1;
    return passed >= min;
  }
}
