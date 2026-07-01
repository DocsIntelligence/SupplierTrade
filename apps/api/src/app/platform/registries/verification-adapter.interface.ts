import type { SignalStatus } from '@org/utils';
import type { DomainConfig } from '../domains/domain.types';

/**
 * One shape for every verification signal (DOMAIN-ARCHITECTURE.md §5).
 * An adapter NEVER returns a binary "safe" — it returns a graded per-signal
 * result with evidence (PLANNING GUARDRAIL #3). Adapters MUST NOT move or
 * custody funds, nor make lending/credit decisions (GUARDRAILS #1, #2).
 */

export interface VerificationAdapterInput {
  supplier: {
    id: string;
    domainKey: string;
    supplierType: string;
    gstin?: string | null;
    legalName: string;
    attributes: Record<string, unknown>;
  };
  domain: DomainConfig;
}

export interface VerificationSignalResult {
  status: SignalStatus; // 'pass' | 'flag' | 'na'
  evidence: Record<string, unknown>;
  summary: string;
}

export interface VerificationAdapter {
  readonly key: string;
  run(input: VerificationAdapterInput): Promise<VerificationSignalResult>;
}

/** DI token: the array of all registered verification adapters. */
export const VERIFICATION_ADAPTERS = Symbol('VERIFICATION_ADAPTERS');
