import type { PrismaClient } from '@prisma/client';

/**
 * Idempotent SupplierTrade demo data for the agriculture domain: a few
 * suppliers across trust states, listings, a graded verification report, QC
 * jobs, and RFQs with generated-style matches. Safe to re-run — keyed by stable
 * legalName / RFQ title. Attribute shapes match the agriculture JSON Schemas.
 *
 * Note: `domainKey` is a plain string on these models (the Domain row is
 * published at API boot), so seeding here does not require the platform running.
 */
export async function seedSupplierTradeDemo(prisma: PrismaClient) {
  const DOMAIN = 'agriculture';

  const suppliers: Array<{
    legalName: string;
    supplierType: string;
    gstin: string;
    status: string;
    state: string;
    deals: string[];
    verified?: 'verified' | 'flagged';
  }> = [
    { legalName: 'Deccan Farmers Collective', supplierType: 'fpo', gstin: '27AAPFU0939F1ZV', status: 'verified', state: 'maharashtra', deals: ['grains', 'pulses'], verified: 'verified' },
    { legalName: 'Malwa Grain Traders', supplierType: 'trader', gstin: '23AAPFU0939F1ZV', status: 'verified', state: 'madhya-pradesh', deals: ['grains'], verified: 'verified' },
    { legalName: 'Krishna Oils Pvt Ltd', supplierType: 'processor', gstin: '36AAPFU0939F1ZV', status: 'submitted', state: 'telangana', deals: ['oilseeds'] },
    { legalName: 'Punjab Basmati Exports', supplierType: 'trader', gstin: '03AAPFU0939F1ZV', status: 'draft', state: 'punjab', deals: ['grains'] },
  ];

  const supplierIds: Record<string, string> = {};
  for (const s of suppliers) {
    const existing = await prisma.supplier.findFirst({
      where: { domainKey: DOMAIN, legalName: s.legalName },
    });
    const row =
      existing ??
      (await prisma.supplier.create({
        data: {
          domainKey: DOMAIN,
          supplierType: s.supplierType,
          legalName: s.legalName,
          gstin: s.gstin,
          status: s.status,
          consentAt: new Date(),
          attributes: { deals_in: s.deals, state: s.state },
        },
      }));
    supplierIds[s.legalName] = row.id;

    if (s.verified && !existing) {
      await prisma.verificationReport.create({
        data: {
          domainKey: DOMAIN,
          supplierId: row.id,
          status: s.verified,
          summary:
            s.verified === 'verified'
              ? '2/2 signals passed (threshold 1); 0 flagged.'
              : '0/2 signals passed; 1 flagged.',
          signalsJson: {
            gst: { status: 'pass', evidence: { gstin: s.gstin }, summary: 'GSTIN well-formed.' },
            litigation: { status: 'na', evidence: {}, summary: 'No source connected.' },
          },
        },
      });
    }
  }

  // Listings + QC for the two verified suppliers.
  const listingSpecs = [
    { supplier: 'Deccan Farmers Collective', commodity: 'grains', qty: 40, grade: 'FAQ', qcStatus: 'scored' },
    { supplier: 'Deccan Farmers Collective', commodity: 'pulses', qty: 15, grade: 'Grade B', qcStatus: 'scored' },
    { supplier: 'Malwa Grain Traders', commodity: 'grains', qty: 60, grade: null, qcStatus: null },
  ];
  for (const l of listingSpecs) {
    const supplierId = supplierIds[l.supplier];
    if (!supplierId) continue;
    const existing = await prisma.listing.findFirst({
      where: { domainKey: DOMAIN, supplierId, attributes: { path: '$.commodity', equals: l.commodity } as never },
    });
    const listing =
      existing ??
      (await prisma.listing.create({
        data: {
          domainKey: DOMAIN,
          supplierId,
          attributes: { commodity: l.commodity, quantity_mt: l.qty },
        },
      }));
    if (l.grade && !existing) {
      await prisma.qcJob.create({
        data: {
          domainKey: DOMAIN,
          listingId: listing.id,
          scorer: 'grain_grade',
          status: l.qcStatus ?? 'pending',
          grade: l.grade,
          criteriaResultsJson: {},
        },
      });
    }
  }

  // RFQs with lines. Matches are generated at runtime via the API, not seeded.
  const rfqs = [
    { title: 'Wheat procurement Q3', state: 'maharashtra', status: 'open', lines: [{ commodityKey: 'grains', quantity: 30, unit: 'MT', targetGrade: 'Grade A' }] },
    { title: 'Pulses lot — Madhya Pradesh', state: 'madhya-pradesh', status: 'open', lines: [{ commodityKey: 'pulses', quantity: 15, unit: 'MT' }] },
    { title: 'Oilseeds bulk buy', state: 'telangana', status: 'draft', lines: [{ commodityKey: 'oilseeds', quantity: 50, unit: 'MT', targetGrade: 'FAQ' }] },
  ];
  for (const r of rfqs) {
    const existing = await prisma.rfq.findFirst({
      where: { domainKey: DOMAIN, title: r.title },
    });
    if (existing) continue;
    await prisma.rfq.create({
      data: {
        domainKey: DOMAIN,
        title: r.title,
        status: r.status,
        deliveryState: r.state,
        metadataJson: {},
        lines: {
          create: r.lines.map((line) => ({
            commodityKey: line.commodityKey,
            quantity: line.quantity,
            unit: line.unit,
            targetGrade: line.targetGrade ?? null,
            attributesJson: {},
          })),
        },
      },
    });
  }

  const supplierCount = await prisma.supplier.count({ where: { domainKey: DOMAIN } });
  const rfqCount = await prisma.rfq.count({ where: { domainKey: DOMAIN } });
  console.log(`  ✓ SupplierTrade demo: ${supplierCount} suppliers, ${rfqCount} RFQs`);
}
