import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  RFQ_SORT_FIELDS,
  type CloseRfqDto,
  type CreateRfqDto,
  type CreateRfqLineDto,
  type CreateRfqResponseDto,
  type RecordBuyerValidationSignalDto,
  type RfqListQuery,
  type UpdateRfqResponseDto,
} from '@org/dto';
import { DatabaseService } from '../../database/database.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { MatchingService } from './matching.service';

/**
 * RFQ workflow for verified matching + paid-QC validation (Phase 2A). Buyers
 * post requirements; the deterministic MatchingService suggests verified
 * suppliers/listings; suppliers (or staff, for WhatsApp/manual) respond; QC can
 * be requested on shortlisted listings; buyer willingness-to-pay is captured as
 * validation signals. No fund movement (GUARDRAIL #1).
 */
@Injectable()
export class RfqService {
  constructor(
    private readonly db: DatabaseService,
    private readonly domains: DomainsService,
    private readonly matching: MatchingService,
  ) {}

  async create(dto: CreateRfqDto, createdById?: string) {
    await this.domains.getConfig(dto.domainKey); // validates domain exists
    return this.db.rfq.create({
      data: {
        domainKey: dto.domainKey,
        buyerOrgId: dto.buyerOrgId ?? null,
        createdById: createdById ?? null,
        status: 'draft',
        title: dto.title,
        deliveryState: dto.deliveryState ?? null,
        deliveryDistrict: dto.deliveryDistrict ?? null,
        targetDate: dto.targetDate ?? null,
        budgetMinPaise: dto.budgetMinPaise ?? null,
        budgetMaxPaise: dto.budgetMaxPaise ?? null,
        paymentTerms: dto.paymentTerms ?? null,
        notes: dto.notes ?? null,
        metadataJson: (dto.metadata ?? {}) as object,
        lines: {
          create: dto.lines.map((l) => this.lineData(l)),
        },
      },
      include: { lines: true },
    });
  }

  async list(q: RfqListQuery) {
    const search = q.search?.trim();
    const where: Prisma.RfqWhereInput = {
      domainKey: q.domainKey,
      ...(q.status ? { status: q.status } : {}),
      ...(q.buyerOrgId ? { buyerOrgId: q.buyerOrgId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { deliveryState: { contains: search } },
            ],
          }
        : {}),
    };
    const sortBy = (RFQ_SORT_FIELDS as readonly string[]).includes(q.sortBy ?? '')
      ? (q.sortBy as string)
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.db.rfq.findMany({
        where,
        orderBy: { [sortBy]: q.sortOrder },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { _count: { select: { lines: true, responses: true } } },
      }),
      this.db.rfq.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string) {
    const rfq = await this.db.rfq.findUnique({
      where: { id },
      include: {
        lines: true,
        responses: { orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }] },
        validationSignals: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!rfq) throw new NotFoundException(`RFQ ${id} not found`);
    return rfq;
  }

  async addLine(id: string, dto: CreateRfqLineDto) {
    await this.getOrThrow(id);
    return this.db.rfqLine.create({
      data: { rfqId: id, ...this.lineData(dto) },
    });
  }

  async open(id: string) {
    const rfq = await this.getOrThrow(id);
    if (rfq.status !== 'draft') {
      throw new BadRequestException(`RFQ is already ${rfq.status}`);
    }
    return this.db.rfq.update({ where: { id }, data: { status: 'open' } });
  }

  /**
   * Run deterministic matching and upsert `suggested` responses. Existing
   * supplier/manual responses (shortlisted/quoted/awarded) are preserved;
   * only their score/reasons are refreshed.
   */
  async generateMatches(id: string) {
    const rfq = await this.getOrThrow(id);
    const candidates = await this.matching.generate(id);

    for (const c of candidates) {
      await this.db.rfqResponse.upsert({
        where: {
          rfqId_supplierId_listingId: {
            rfqId: id,
            supplierId: c.supplierId,
            listingId: c.listingId ?? '',
          },
        },
        create: {
          rfqId: id,
          supplierId: c.supplierId,
          listingId: c.listingId,
          status: 'suggested',
          matchScore: c.score,
          matchReasonsJson: c.reasons as object,
        },
        update: {
          matchScore: c.score,
          matchReasonsJson: c.reasons as object,
        },
      });
    }

    if (rfq.status === 'open' && candidates.length > 0) {
      await this.db.rfq.update({ where: { id }, data: { status: 'matched' } });
    }
    return this.matches(id);
  }

  matches(id: string) {
    return this.db.rfqResponse.findMany({
      where: { rfqId: id },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addResponse(id: string, dto: CreateRfqResponseDto) {
    await this.getOrThrow(id);
    const supplier = await this.db.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new BadRequestException(`Supplier ${dto.supplierId} not found`);
    }
    return this.db.rfqResponse.upsert({
      where: {
        rfqId_supplierId_listingId: {
          rfqId: id,
          supplierId: dto.supplierId,
          listingId: dto.listingId ?? '',
        },
      },
      create: {
        rfqId: id,
        supplierId: dto.supplierId,
        listingId: dto.listingId ?? null,
        status: dto.status,
        quotedPricePaise: dto.quotedPricePaise ?? null,
        availableQuantity: dto.availableQuantity ?? null,
        unit: dto.unit ?? null,
        deliveryDate: dto.deliveryDate ?? null,
        notes: dto.notes ?? null,
      },
      update: {
        status: dto.status,
        quotedPricePaise: dto.quotedPricePaise ?? null,
        availableQuantity: dto.availableQuantity ?? null,
        unit: dto.unit ?? null,
        deliveryDate: dto.deliveryDate ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateResponse(
    id: string,
    responseId: string,
    dto: UpdateRfqResponseDto,
  ) {
    const resp = await this.db.rfqResponse.findUnique({
      where: { id: responseId },
    });
    if (!resp || resp.rfqId !== id) {
      throw new NotFoundException('Response not found');
    }
    return this.db.rfqResponse.update({
      where: { id: responseId },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.quotedPricePaise !== undefined
          ? { quotedPricePaise: dto.quotedPricePaise }
          : {}),
        ...(dto.availableQuantity !== undefined
          ? { availableQuantity: dto.availableQuantity }
          : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.deliveryDate !== undefined
          ? { deliveryDate: dto.deliveryDate }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  /**
   * Request QC for a shortlisted listing: marks the RFQ `sampling` and creates
   * a pending QcJob so a field/desk inspector can score it. This is the paid-QC
   * validation hook — no scoring happens here.
   */
  async requestQc(id: string, listingId: string) {
    const rfq = await this.getOrThrow(id);
    const listing = await this.db.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.domainKey !== rfq.domainKey) {
      throw new BadRequestException(`Listing ${listingId} not in this RFQ's domain`);
    }
    const domain = await this.domains.getConfig(rfq.domainKey);
    const scorer = domain.qc_profile?.scorer;
    if (!scorer) {
      throw new BadRequestException('Domain has no QC profile');
    }
    const job = await this.db.qcJob.create({
      data: {
        domainKey: rfq.domainKey,
        listingId,
        scorer,
        status: 'pending',
        criteriaResultsJson: {},
      },
    });
    if (rfq.status === 'matched' || rfq.status === 'open') {
      await this.db.rfq.update({ where: { id }, data: { status: 'sampling' } });
    }
    return job;
  }

  async close(id: string, dto: CloseRfqDto) {
    await this.getOrThrow(id);
    if (dto.status === 'awarded' && dto.awardedResponseId) {
      const resp = await this.db.rfqResponse.findUnique({
        where: { id: dto.awardedResponseId },
      });
      if (!resp || resp.rfqId !== id) {
        throw new BadRequestException('Awarded response not found');
      }
      await this.db.rfqResponse.update({
        where: { id: dto.awardedResponseId },
        data: { status: 'awarded' },
      });
    }
    return this.db.rfq.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes ?? undefined,
      },
    });
  }

  /** Record buyer willingness-to-pay — the Phase-0 validation instrumentation. */
  async recordValidation(
    id: string,
    dto: RecordBuyerValidationSignalDto,
    buyerOrgId?: string,
  ) {
    const rfq = await this.getOrThrow(id);
    return this.db.buyerValidationSignal.create({
      data: {
        rfqId: id,
        buyerOrgId: buyerOrgId ?? rfq.buyerOrgId ?? null,
        signal: dto.signal,
        amountPaise: dto.amountPaise ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  /** Aggregate paid-intent metrics for the validation dashboard. */
  async validationSummary(domainKey: string) {
    const signals = await this.db.buyerValidationSignal.findMany({
      where: { rfq: { domainKey } },
    });
    const byType: Record<string, number> = {};
    let amountPaise = 0;
    for (const s of signals) {
      byType[s.signal] = (byType[s.signal] ?? 0) + 1;
      amountPaise += s.amountPaise ?? 0;
    }
    const [rfqsOpened, matched, qcRequested] = await Promise.all([
      this.db.rfq.count({ where: { domainKey, status: { not: 'draft' } } }),
      this.db.rfqResponse.count({ where: { rfq: { domainKey } } }),
      this.db.qcJob.count({ where: { domainKey } }),
    ]);
    return {
      rfqsOpened,
      matches: matched,
      qcRequested,
      paidIntentCount: signals.length,
      amountPaise,
      byType,
    };
  }

  private async getOrThrow(id: string) {
    const rfq = await this.db.rfq.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException(`RFQ ${id} not found`);
    return rfq;
  }

  private lineData(l: CreateRfqLineDto) {
    return {
      commodityKey: l.commodityKey,
      quantity: l.quantity,
      unit: l.unit,
      targetGrade: l.targetGrade ?? null,
      attributesJson: (l.attributes ?? {}) as object,
    };
  }
}
