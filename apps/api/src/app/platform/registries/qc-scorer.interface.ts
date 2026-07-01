import type { QcProfile } from '../domains/domain.types';

/**
 * A QC scorer turns a config-driven inspection checklist into a graded result
 * (DOMAIN-ARCHITECTURE.md §5). Pure function of (measured criteria, profile).
 */

export interface QcScorerInput {
  /** measured values keyed by criterion key, e.g. { moisture_pct: 12.5 } */
  criteria: Record<string, number>;
  profile: QcProfile;
}

export interface QcCriterionOutcome {
  value: number;
  ok: boolean;
  limit?: number;
}

export interface QcScoreResult {
  grade: string; // a value from profile.grading_scale
  passed: boolean;
  details: Record<string, QcCriterionOutcome>;
  summary: string;
}

export interface QcScorer {
  readonly key: string;
  score(input: QcScorerInput): QcScoreResult;
}

/** DI token: the array of all registered QC scorers. */
export const QC_SCORERS = Symbol('QC_SCORERS');
