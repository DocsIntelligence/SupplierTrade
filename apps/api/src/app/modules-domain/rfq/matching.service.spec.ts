import { MatchingService } from './matching.service';

/**
 * Locks in the deterministic RFQ matching contract (Phase 2A). The service
 * depends only on DatabaseService, so we hand it a hand-rolled fake with just
 * the query methods it calls. Scores must stay explainable and stable.
 */

interface FakeData {
  rfq: {
    domainKey: string;
    deliveryState: string | null;
    targetDate: Date | null;
    lines: { commodityKey: string; quantity: number; unit: string }[];
  } | null;
  listings: Array<{
    id: string;
    supplierId: string;
    domainKey: string;
    createdAt: Date;
    attributes: Record<string, unknown>;
    supplier: { id: string; status: string; attributes: Record<string, unknown> };
  }>;
  reports: Record<string, { status: string } | null>;
  qc: Record<string, { status: string; grade: string | null } | null>;
}

function fakeDb(data: FakeData) {
  return {
    rfq: {
      findUnique: async () => data.rfq,
    },
    listing: {
      findMany: async () => data.listings,
    },
    verificationReport: {
      findFirst: async ({ where }: { where: { supplierId: string } }) =>
        data.reports[where.supplierId] ?? null,
    },
    qcJob: {
      findFirst: async ({ where }: { where: { listingId: string } }) =>
        data.qc[where.listingId] ?? null,
    },
  } as never;
}

const NOW = Date.now();

function baseData(overrides: Partial<FakeData> = {}): FakeData {
  return {
    rfq: {
      domainKey: 'agriculture',
      deliveryState: 'maharashtra',
      targetDate: null,
      lines: [{ commodityKey: 'grains', quantity: 30, unit: 'MT' }],
    },
    listings: [
      {
        id: 'L1',
        supplierId: 'S1',
        domainKey: 'agriculture',
        createdAt: new Date(NOW), // listed today
        attributes: { commodity: 'grains', quantity_mt: 40 },
        supplier: { id: 'S1', status: 'verified', attributes: { state: 'maharashtra' } },
      },
    ],
    reports: { S1: { status: 'verified' } },
    qc: { L1: { status: 'scored', grade: 'FAQ' } },
    ...overrides,
  };
}

describe('MatchingService', () => {
  it('scores a fully-matching verified+QC+local+in-stock listing at 100', async () => {
    const svc = new MatchingService(fakeDb(baseData()));
    const [top] = await svc.generate('rfq1');
    expect(top.supplierId).toBe('S1');
    expect(top.listingId).toBe('L1');
    expect(top.score).toBe(100); // 30 verif + 25 qc + 15 geo + 20 qty + 10 recency
  });

  it('disqualifies listings whose commodity is not requested', async () => {
    const data = baseData();
    data.listings[0].attributes = { commodity: 'spices', quantity_mt: 40 };
    const svc = new MatchingService(fakeDb(data));
    expect(await svc.generate('rfq1')).toHaveLength(0);
  });

  it('drops verification points when the supplier is flagged', async () => {
    const data = baseData();
    data.reports['S1'] = { status: 'flagged' };
    const svc = new MatchingService(fakeDb(data));
    const [top] = await svc.generate('rfq1');
    // loses the full 30 verification points → 70
    expect(top.score).toBe(70);
    const verif = top.reasons.find((r) => r.factor === 'verification');
    expect(verif?.points).toBe(0);
  });

  it('scales quantity points down for a partial listing', async () => {
    const data = baseData();
    data.listings[0].attributes = { commodity: 'grains', quantity_mt: 15 }; // half of 30
    const svc = new MatchingService(fakeDb(data));
    const [top] = await svc.generate('rfq1');
    const qty = top.reasons.find((r) => r.factor === 'quantity');
    expect(qty?.points).toBe(10); // 20 * (15/30)
    expect(qty?.detail).toContain('Partial');
  });

  it('penalises a different delivery state', async () => {
    const data = baseData();
    data.listings[0].supplier.attributes = { state: 'punjab' };
    const svc = new MatchingService(fakeDb(data));
    const [top] = await svc.generate('rfq1');
    const geo = top.reasons.find((r) => r.factor === 'geography');
    expect(geo?.points).toBe(0);
  });

  it('always includes an explainable reason per factor', async () => {
    const svc = new MatchingService(fakeDb(baseData()));
    const [top] = await svc.generate('rfq1');
    const factors = top.reasons.map((r) => r.factor).sort();
    expect(factors).toEqual([
      'commodity',
      'geography',
      'qc',
      'quantity',
      'recency',
      'verification',
    ]);
  });

  it('ranks a verified+scored listing above an unverified one', async () => {
    const data = baseData();
    data.listings.push({
      id: 'L2',
      supplierId: 'S2',
      domainKey: 'agriculture',
      createdAt: new Date(NOW),
      attributes: { commodity: 'grains', quantity_mt: 40 },
      supplier: { id: 'S2', status: 'draft', attributes: { state: 'maharashtra' } },
    });
    data.reports['S2'] = null; // never verified
    data.qc['L2'] = null; // no QC
    const svc = new MatchingService(fakeDb(data));
    const results = await svc.generate('rfq1');
    expect(results[0].supplierId).toBe('S1');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
