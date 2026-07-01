import { Inject, Injectable } from '@nestjs/common';
import { QC_SCORERS, QcScorer } from './qc-scorer.interface';

/**
 * Resolves QC scorers by key. Fail-fast on unknown/duplicate keys
 * (DOMAIN-ARCHITECTURE.md §5).
 */
@Injectable()
export class QcScorerRegistry {
  private readonly map = new Map<string, QcScorer>();

  constructor(@Inject(QC_SCORERS) scorers: QcScorer[]) {
    for (const scorer of scorers) {
      if (this.map.has(scorer.key)) {
        throw new Error(`Duplicate QC scorer key: "${scorer.key}"`);
      }
      this.map.set(scorer.key, scorer);
    }
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }

  resolve(key: string): QcScorer {
    const scorer = this.map.get(key);
    if (!scorer) {
      throw new Error(
        `Unregistered QC scorer: "${key}". Registered: [${this.keys().join(', ')}]`,
      );
    }
    return scorer;
  }
}
