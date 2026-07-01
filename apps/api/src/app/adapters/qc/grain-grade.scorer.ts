import { Injectable } from '@nestjs/common';
import {
  QcCriterionOutcome,
  QcScorer,
  QcScorerInput,
  QcScoreResult,
} from '../../platform/registries/qc-scorer.interface';

/**
 * Grain grading scorer (DOMAIN-ARCHITECTURE.md §5 / §8 — agri-output).
 *
 * Each criterion in the domain's qc_profile carries a `max` (and/or `min`).
 * A measured value within bounds passes. The grade is derived from how close
 * the worst breach is — config supplies the grading_scale; this scorer maps
 * "all within spec" → best grade and any breach → "Reject" by default, with
 * a margin-based bucketing for the in-between grades.
 */
@Injectable()
export class GrainGradeScorer implements QcScorer {
  readonly key = 'grain_grade';

  score(input: QcScorerInput): QcScoreResult {
    const { criteria, profile } = input;
    const scale = profile.grading_scale ?? ['Pass', 'Reject'];
    const reject = scale[scale.length - 1];

    const details: Record<string, QcCriterionOutcome> = {};
    let worstRatio = 0; // 0 = comfortably within spec; >1 = breach
    let anyBreach = false;

    for (const c of profile.criteria ?? []) {
      const value = criteria[c.key];
      if (value === undefined || value === null || Number.isNaN(value)) {
        // Missing measurement is treated as a breach — cannot grade blind.
        details[c.key] = { value: NaN, ok: false, limit: c.max ?? c.min };
        anyBreach = true;
        worstRatio = Math.max(worstRatio, 1.5);
        continue;
      }

      let ok = true;
      let ratio = 0;
      if (c.max !== undefined) {
        ok = value <= c.max;
        ratio = c.max > 0 ? value / c.max : value > 0 ? Infinity : 0;
      }
      if (ok && c.min !== undefined) {
        ok = value >= c.min;
      }
      if (!ok) anyBreach = true;
      worstRatio = Math.max(worstRatio, ratio);
      details[c.key] = { value, ok, limit: c.max ?? c.min };
    }

    const grade = this.bucket(scale, reject, anyBreach, worstRatio);
    const passed = grade !== reject;

    return {
      grade,
      passed,
      details,
      summary: passed
        ? `Graded ${grade} (worst criterion at ${(worstRatio * 100).toFixed(0)}% of its limit).`
        : `Rejected — one or more criteria out of spec.`,
    };
  }

  /**
   * Map the worst in-spec ratio onto the non-reject grades. Lower ratio (more
   * headroom under the limit) → better grade. Any breach → reject.
   */
  private bucket(
    scale: string[],
    reject: string,
    anyBreach: boolean,
    worstRatio: number,
  ): string {
    if (anyBreach) return reject;
    const passGrades = scale.slice(0, -1); // exclude reject bucket
    if (passGrades.length === 0) return reject;
    // worstRatio in [0,1]; split that band evenly across pass grades.
    const idx = Math.min(
      passGrades.length - 1,
      Math.floor(worstRatio * passGrades.length),
    );
    return passGrades[idx];
  }
}
