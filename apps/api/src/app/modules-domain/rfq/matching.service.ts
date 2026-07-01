import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * Deterministic RFQ → supplier/listing matching (Phase 2A, plan §4). NO AI —
 * transparent, explainable scoring so buyers can see *why* a supplier ranked.
 * Each factor contributes a bounded number of points and a human-readable
 * reason; the total is normalised to 0–100.
 *
 * Factors: commodity match, verification grade, QC grade, geography,
 * quantity fit, recency. A commodity mismatch is disqualifying (score 0).
 */

export interface MatchReason {
  factor: string;
  points: number;
  detail: string;
}

export interface MatchCandidate {
  supplierId: string;
  listingId: string | null;
  score: number; // 0–100
  reasons: MatchReason[];
}

const WEIGHTS = {
  verification: 30,
  qc: 25,
  geography: 15,
  quantity: 20,
  recency: 10,
} as const;

@Injectable()
export class MatchingService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Generate ranked candidates for an RFQ across all its commodity lines.
   * Returns at most one candidate per (supplier, listing), best score kept.
   */
  async generate(rfqId: string): Promise<MatchCandidate[]> {
    const rfq = await this.db.rfq.findUnique({
      where: { id: rfqId },
      include: { lines: true },
    });
    if (!rfq) return [];

    const commodities = new Set(rfq.lines.map((l) => l.commodityKey));

    // Candidate listings in this domain whose commodity is requested.
    const listings = await this.db.listing.findMany({
      where: { domainKey: rfq.domainKey },
      include: { supplier: true },
    });

    const candidates: MatchCandidate[] = [];
    for (const listing of listings) {
      const attrs = (listing.attributes as Record<string, unknown>) ?? {};
      const commodity = String(attrs['commodity'] ?? '').toLowerCase();
      if (!commodity || !commodities.has(commodity)) continue; // disqualify

      const line = rfq.lines.find((l) => l.commodityKey === commodity);
      const scored = await this.score(rfq, line, listing, attrs);
      candidates.push(scored);
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private async score(
    rfq: { deliveryState: string | null; targetDate: Date | null },
    line: { quantity: number; unit: string } | undefined,
    listing: {
      id: string;
      supplierId: string;
      createdAt: Date;
      supplier: {
        id: string;
        status: string;
        attributes: unknown;
      };
    },
    attrs: Record<string, unknown>,
  ): Promise<MatchCandidate> {
    const reasons: MatchReason[] = [];
    let score = 0;

    reasons.push({
      factor: 'commodity',
      points: 0,
      detail: `Matches requested commodity "${String(attrs['commodity'])}"`,
    });

    // Verification grade — latest report for the supplier.
    const report = await this.db.verificationReport.findFirst({
      where: { supplierId: listing.supplierId },
      orderBy: { createdAt: 'desc' },
    });
    const vPts =
      report?.status === 'verified'
        ? WEIGHTS.verification
        : report?.status === 'flagged'
          ? 0
          : Math.round(WEIGHTS.verification * 0.4);
    score += vPts;
    reasons.push({
      factor: 'verification',
      points: vPts,
      detail: report
        ? `Verification: ${report.status}`
        : 'Not verified yet',
    });

    // QC grade — latest scored QC job for this listing.
    const qc = await this.db.qcJob.findFirst({
      where: { listingId: listing.id },
      orderBy: { createdAt: 'desc' },
    });
    const qcPts = !qc
      ? Math.round(WEIGHTS.qc * 0.3)
      : qc.status === 'scored'
        ? WEIGHTS.qc
        : 0;
    score += qcPts;
    reasons.push({
      factor: 'qc',
      points: qcPts,
      detail: qc ? `QC grade: ${qc.grade ?? qc.status}` : 'No QC yet',
    });

    // Geography — supplier state vs RFQ delivery state.
    const sAttrs = (listing.supplier.attributes as Record<string, unknown>) ?? {};
    const supplierState = String(sAttrs['state'] ?? '').toLowerCase();
    const wantState = String(rfq.deliveryState ?? '').toLowerCase();
    const geoMatch = wantState && supplierState === wantState;
    const geoPts = !wantState
      ? Math.round(WEIGHTS.geography * 0.5)
      : geoMatch
        ? WEIGHTS.geography
        : 0;
    score += geoPts;
    reasons.push({
      factor: 'geography',
      points: geoPts,
      detail: !wantState
        ? 'No delivery state specified'
        : geoMatch
          ? `Same state (${supplierState})`
          : `Different state (has ${supplierState || 'unknown'})`,
    });

    // Quantity fit — listing quantity vs requested line quantity.
    const listingQty = Number(attrs['quantity_mt'] ?? 0);
    const wantQty = line?.quantity ?? 0;
    let qtyPts = 0;
    let qtyDetail = 'Quantity unknown';
    if (listingQty > 0 && wantQty > 0) {
      const ratio = listingQty / wantQty;
      qtyPts =
        ratio >= 1
          ? WEIGHTS.quantity
          : Math.round(WEIGHTS.quantity * Math.max(0, ratio));
      qtyDetail =
        ratio >= 1
          ? `Can fulfil (${listingQty} ${line?.unit ?? 'MT'} available)`
          : `Partial (${listingQty} of ${wantQty} ${line?.unit ?? 'MT'})`;
    }
    score += qtyPts;
    reasons.push({ factor: 'quantity', points: qtyPts, detail: qtyDetail });

    // Recency — newer listings score higher (up to 30 days).
    const ageDays =
      (Date.now() - new Date(listing.createdAt).getTime()) / 86_400_000;
    const recPts = Math.round(
      WEIGHTS.recency * Math.max(0, 1 - ageDays / 30),
    );
    score += recPts;
    reasons.push({
      factor: 'recency',
      points: recPts,
      detail: `Listed ${Math.floor(ageDays)} day(s) ago`,
    });

    return {
      supplierId: listing.supplierId,
      listingId: listing.id,
      score: Math.min(100, Math.round(score)),
      reasons,
    };
  }
}
