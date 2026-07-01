# SupplierTrade India market analysis + next-phase plan

Date: 2026-07-01

This plan converts the Phase-0 market question into a buildable Phase-2 path. It updates, but does not replace,
`PLANNING.md`, `DOMAIN-ARCHITECTURE.md`, and `SUPPLIERTRADE-PLAN.md`.

## 1. Market read: India agri-output / produce

### Demand is large, but not enough by itself

India has very large commodity flow:

- Foodgrain production for 2025-26 is estimated around **376 million tonnes**, according to press coverage citing
  the agriculture ministry's latest estimates.
- Horticulture production for 2025-26 is estimated around **3708.46 lakh tonnes**.
- Agriculture exports reached about **USD 52.55 billion in 2025-26**, according to press coverage citing commerce
  ministry data.

Implication: the opportunity is not "more listings". India already has enough produce and enough trade intent. The
commercial gap is trust, compliance, quality evidence, and reliable execution across fragmented sellers.

### Public rails exist, but trust/commercial workflow remains fragmented

e-NAM shows the state is pushing digital market infrastructure. Its public site notes ongoing mandi expansion, with
recent notices saying Tamil Nadu additions took e-NAM to **1466 mandis** and Rajasthan additions to **1473 mandis**.
The same e-NAM resource menu exposes **QC Labs Guidelines**, **Assaying Equipments**, logistics, warehouse/e-NWR
trade, FPO, and advance demand/supply surfaces.

Implication: SupplierTrade should not compete with public mandi rails as a generic exchange. It should be the
private buyer workflow around supplier trust, lot evidence, QC, and matched procurement.

### Competitive field

| Player type                 | Examples                       | Strength                                                    | Gap SupplierTrade can occupy                                                                   |
| --------------------------- | ------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Full-stack agritech         | DeHaat                         | Inputs, advisory, output linkage, finance, physical network | Heavy network model; buyers still need portable supplier/QC evidence outside one closed stack. |
| B2B agri trade networks     | Bijak                          | Grain trading, mandi linkages, global/agri trade            | Transaction/trade focus; trust-grade + QC evidence can be a workflow layer.                    |
| Public / network rails      | e-NAM, ONDC                    | Reach, standardization, policy backing                      | Not a buyer-specific operating console for verification, RFQs, QC, and audit trail.            |
| General B2B directories     | IndiaMART and similar listings | Discovery and lead volume                                   | Weak structured lot-level quality, supplier compliance evidence, and workflow accountability.  |
| Labs / inspection providers | Local assayers, QC labs        | Physical inspection capability                              | Fragmented UX; can become SupplierTrade's field execution network instead of competitors.      |

Positioning: **"Verified supplier and lot-quality workflow for serious produce buyers"**, not "another agri bazaar".

## 2. Buyer segments and wedge

### Best first ICP

Start with buyers who already lose money from bad suppliers or inconsistent quality:

1. **Regional processors / millers / packers** buying grains, pulses, spices, or oilseeds in recurring lots.
2. **Export-oriented aggregators** who need documentation, photos, and traceable quality evidence.
3. **Modern retail / HoReCa aggregators** for perishables where rejection and spoilage costs are visible.

Avoid in Phase 2:

- Small one-off buyers.
- Farmer-only acquisition without a committed buyer.
- Full logistics, escrow, or credit underwriting.

### Launch commodities

Pick two commodity lanes, not all agriculture:

1. **Wheat / rice / maize / pulses**: easier QC model, moisture/foreign matter/broken/admixture already fits current
   `grain_grade` scorer.
2. **Onion / potato / banana / grapes** as a second lane only after one buyer commits, because perishables need more
   inspection and logistics nuance.

## 3. Pricing hypothesis to validate

Phase 0 open question should become a concrete test, not a generic survey.

Recommended starting price card:

| Item                           | Who pays | Price hypothesis            | Notes                                                                 |
| ------------------------------ | -------- | --------------------------- | --------------------------------------------------------------------- |
| Supplier verification          | Buyer    | `verification_fee = ₹1,500` | Annual/profile-level. Includes GST/PAN/docs/media review and grading. |
| Assisted supplier verification | Buyer    | ₹2,500                      | Adds manual calling/document chasing.                                 |
| Lot QC report                  | Buyer    | `qc_fee = ₹1,200`           | Per lot for grain-style desk/field-assisted inspection.               |
| Field QC / sample collection   | Buyer    | ₹2,500-₹5,000               | Only where a local partner physically samples/assays.                 |
| Matched RFQ success fee        | Buyer    | 0.25%-0.75% of GMV          | Introduce only after paid verification/QC shows pull.                 |

Validation threshold:

- 5 buyer interviews with live procurement responsibility.
- 3 buyers agree to pay at least one of: ₹1,500 verification, ₹1,200 QC, or a paid pilot retainer.
- 20 suppliers onboarded only if attached to buyer demand.
- 10 real lots scored, with at least 3 buyer decisions influenced by the report.

If buyers refuse to pay for verification but pay for QC, reposition around **lot QC and supplier history**. If they
refuse both and only want free discovery, do not build Phase 2.

## 4. Strategic decision

Build **Phase 2A: RFQ + verified matching + paid QC pilot** before escrow, ONDC/e-NAM integrations, or more verticals.

Why:

- It tests buyer willingness to pay directly.
- It uses the Phase-1 platform already built: suppliers, listings, documents, verification reports, QC jobs, workflow.
- It avoids regulated money movement.
- It creates data assets: supplier trust history, lot grade history, buyer RFQ patterns.

## 5. Phase 2A product scope

### Ships

1. `rfq` API module:
   - Buyer creates requirement: commodity, state/district, quantity, delivery window, target grade, documents needed.
   - RFQ status: `draft | open | matched | sampling | awarded | closed | cancelled`.
   - RFQ line items for one or more commodities/lots.
   - Match suggestions from verified suppliers/listings.

2. Buyer RFQ console:
   - Create RFQ.
   - Review matched suppliers with graded verification and documents.
   - Request QC for shortlisted listings.
   - Record award/close reason.

3. Supplier response flow:
   - Supplier can respond with available quantity, price, delivery window, listing reference, and notes.
   - Internal/admin can create responses for WhatsApp/manual suppliers.

4. Matching v1:
   - Deterministic scoring only: commodity match, geography, supplier status, verification grade, listing/QC grade,
     recency, quantity fit.
   - No AI matching until there is enough data.

5. Phase-0 validation instrumentation:
   - Capture `buyer_willing_to_pay_verification`, `buyer_willing_to_pay_qc`, quoted fees, accepted fees, rejected
     reason.
   - Dashboard cards: RFQs opened, matches, QC requested, paid-intent count.

6. Read-only domain config viewer:
   - Layer 2 only: active config, schema fields, workflow states, registered plugin keys.
   - No config editing.

### Explicitly not in Phase 2A

- Escrow or fund movement.
- Lending/credit decisions.
- ONDC/e-NAM transaction integration.
- Config CRUD studio.
- Multi-vertical expansion.
- AI-based supplier ranking.

## 6. Data model additions

Add Prisma models:

```prisma
model Rfq {
  id              String   @id @default(cuid())
  domainKey       String
  buyerOrgId      String?
  createdById     String?
  status          String
  title           String
  deliveryState   String?
  deliveryDistrict String?
  targetDate      DateTime?
  budgetMinPaise  Int?
  budgetMaxPaise  Int?
  paymentTerms    String?
  notes           String?
  metadataJson    Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RfqLine {
  id             String @id @default(cuid())
  rfqId          String
  commodityKey   String
  quantity       Float
  unit           String
  targetGrade    String?
  attributesJson Json?
}

model RfqResponse {
  id             String @id @default(cuid())
  rfqId          String
  supplierId     String
  listingId      String?
  status         String
  quotedPricePaise Int?
  availableQuantity Float?
  unit           String?
  deliveryDate   DateTime?
  notes          String?
  matchScore     Float?
  matchReasonsJson Json?
  createdAt      DateTime @default(now())
}

model BuyerValidationSignal {
  id           String @id @default(cuid())
  rfqId        String?
  buyerOrgId   String?
  signal       String
  amountPaise  Int?
  notes        String?
  createdAt    DateTime @default(now())
}
```

Mirror statuses as string unions in `@org/utils`.

## 7. API surface

| Method | Path                         | Notes                                  |
| ------ | ---------------------------- | -------------------------------------- |
| POST   | `/rfqs`                      | create RFQ                             |
| GET    | `/rfqs`                      | server-side table: search/filter/sort  |
| GET    | `/rfqs/:id`                  | RFQ detail with lines/responses        |
| POST   | `/rfqs/:id/lines`            | add commodity line                     |
| POST   | `/rfqs/:id/open`             | publish/open RFQ                       |
| POST   | `/rfqs/:id/matches/generate` | deterministic match generation         |
| GET    | `/rfqs/:id/matches`          | ranked supplier/listing suggestions    |
| POST   | `/rfqs/:id/responses`        | supplier/manual response               |
| PATCH  | `/rfqs/:id/responses/:rid`   | update response status/quote           |
| POST   | `/rfqs/:id/qc-requests`      | request QC for shortlisted listing     |
| POST   | `/rfqs/:id/validation`       | record buyer willingness/payment notes |
| POST   | `/rfqs/:id/close`            | award/close/cancel                     |

## 8. Build order

1. Prisma models + status unions + migration.
2. `@org/dto` RFQ schemas and query schemas.
3. `modules-domain/rfq`: CRUD, lines, responses, validation signals.
4. Deterministic matching service.
5. Buyer RFQ pages in React app using server-side `DataTable`.
6. RFQ detail page: matched suppliers, graded verification, documents, QC request.
7. Read-only domain config viewer.
8. Seed demo RFQs and varied supplier/listing responses.
9. Validation dashboard cards.
10. E2E smoke: create RFQ -> generate matches -> create response -> request QC -> record paid-intent -> close.

## 9. Success metrics

### Product metrics

- RFQ creation time under 3 minutes.
- At least 3 matched suppliers per RFQ in seeded/demo flow.
- Buyer can inspect verification evidence without leaving RFQ detail.
- QC request reachable from a shortlisted match in one click.

### Market metrics

- 5 buyer discovery calls completed.
- 3 buyers agree to paid pilot or paid verification/QC.
- 10 lots scored.
- 3 RFQs reach `awarded` or `closed_with_supplier_selected`.
- One repeat buyer creates a second RFQ.

### Guardrail metrics

- No domain-key branches in business logic.
- No fund movement.
- Verification remains graded.
- Domain config viewer is read-only.

## 10. Source notes

- Foodgrain estimate: Times of India coverage citing the agriculture ministry's latest estimates, May 2026.
- Horticulture estimate: Economic Times coverage citing the government's first advance estimate, March 2026.
- Agriculture exports: Economic Times coverage citing commerce ministry data, April 2026.
- e-NAM public site: dashboard/resource notices show active mandi expansion, QC lab guidelines, assaying equipment,
  logistics, FPO, warehouse/e-NWR, and advance demand/supply surfaces.
- DeHaat official site positions itself from "Seeds To Market" and lists agri output, finance, advisory, and
  institutional buyer solutions.
- Bijak official site positions around grain trading, fresh-produce market hubs, global trade, and selected
  fruits/vegetables.
