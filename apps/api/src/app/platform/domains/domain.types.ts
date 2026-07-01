import type { WorkflowDef } from '../workflow/workflow.types';

/**
 * In-memory shape of a domain config (DOMAIN-ARCHITECTURE.md §2).
 * This is the parsed, $ref-resolved form: entity_schemas and workflow are
 * inlined, not file references.
 */

export interface SignalRef {
  key: string;
  required?: boolean;
  required_if?: string; // expression evaluated by ExprEvaluator
}

export interface DocRequirement {
  key: string;
  accepts?: string[];
  required?: boolean;
  required_if?: string;
}

export interface MediaRequirement {
  key: string;
  type: 'image' | 'video';
  min?: number;
  geotag?: boolean;
  required?: boolean;
  required_if?: string;
}

export interface SupplierTypeConfig {
  key: string;
  label: string;
  kyc_profile?: string;
  required_documents?: DocRequirement[];
  media_capture?: MediaRequirement[];
  verification_signals?: SignalRef[];
}

export interface VerificationProfile {
  required_signals: SignalRef[];
  thresholds?: { min_signals_for_verified?: number };
}

export interface QcCriterion {
  key: string;
  type: string;
  max?: number;
  min?: number;
}

export interface QcProfile {
  scorer: string;
  grading_scale?: string[];
  criteria?: QcCriterion[];
  sampling?: Record<string, unknown>;
}

export interface EntitySchemas {
  supplier?: Record<string, unknown>;
  listing?: Record<string, unknown>;
}

export interface DomainConfig {
  key: string;
  name: string;
  status: string;
  version: number;
  locale_defaults?: Record<string, string>;
  entity_schemas?: EntitySchemas;
  supplier_types?: SupplierTypeConfig[];
  verification_profile?: VerificationProfile;
  qc_profile?: QcProfile;
  workflow?: WorkflowDef;
  fees?: Record<string, number>;
  feature_flags?: Record<string, boolean>;
  terminology?: Record<string, string>;
}

/** Find a supplier_type config by key, or undefined. */
export function findSupplierType(
  domain: DomainConfig,
  key: string,
): SupplierTypeConfig | undefined {
  return domain.supplier_types?.find((t) => t.key === key);
}
