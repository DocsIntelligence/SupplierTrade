import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

/**
 * Continuous percentile with linear interpolation, matching Postgres'
 * `percentile_cont`. Computed in JS so latency stats stay DB-portable
 * (SQLite has no percentile function). `sorted` must be ascending.
 */
function percentileCont(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = p * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

export interface ListUsageQuery {
  /** Caller scope. */
  userId?: string;
  orgId?: string;
  documentId?: string;
  sourceDocumentId?: string;
  pipelineRunId?: string;
  extractionId?: string;
  analysisRunId?: string;
  batchId?: string;
  operation?: string;
  provider?: string;
  model?: string;
  status?: string;
  /** ISO date strings. */
  from?: string;
  to?: string;
  /** Free-text search across model + featureCode + tags. */
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'createdAt' | 'durationMs' | 'totalTokens' | 'estimatedCostUsd';
  dir?: 'asc' | 'desc';
}

export interface UsageSummary {
  /** Workspace-wide rollup across the filter window. */
  totals: {
    calls: number;
    successCalls: number;
    errorCalls: number;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    totalTokens: number;
    costUsd: number;
    averageDurationMs: number;
  };
  /** Per-day series for the chart (ordered ascending). */
  daily: Array<{
    day: string; // ISO date
    calls: number;
    tokens: number;
    costUsd: number;
    errors: number;
  }>;
  perOperation: Array<{
    operation: string;
    calls: number;
    tokens: number;
    costUsd: number;
  }>;
  perModel: Array<{
    provider: string;
    model: string;
    calls: number;
    tokens: number;
    costUsd: number;
  }>;
  perProvider: Array<{
    provider: string;
    calls: number;
    tokens: number;
    costUsd: number;
  }>;
  /** P50/P95/P99 wall-clock latency, in ms. */
  latency: { p50: number; p95: number; p99: number };
}

@Injectable()
export class AiUsageService {
  constructor(private readonly db: DatabaseService) {}

  // ── List ───────────────────────────────────────────────────────────────
  async list(q: ListUsageQuery = {}) {
    const where = this.buildWhere(q);
    const page = Math.max(0, q.page ?? 0);
    const pageSize = Math.min(200, Math.max(1, q.pageSize ?? 50));
    const orderBy: Prisma.AiUsageOrderByWithRelationInput = {
      [q.sort ?? 'createdAt']: q.dir ?? 'desc',
    };
    const [rows, total] = await this.db.$transaction([
      this.db.aiUsage.findMany({
        where,
        orderBy,
        skip: page * pageSize,
        take: pageSize,
      }),
      this.db.aiUsage.count({ where }),
    ]);
    return { items: rows.map(this.serialise), total, page, pageSize };
  }

  // ── Summary ────────────────────────────────────────────────────────────
  async summary(q: ListUsageQuery = {}): Promise<UsageSummary> {
    const where = this.buildWhere(q);
    const rangeFrom = q.from ? new Date(q.from) : this.daysAgo(30);
    const rangeTo = q.to ? new Date(q.to) : new Date();

    // ── totals ────────────────────────────────────────────────────────
    const agg = await this.db.aiUsage.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cachedInputTokens: true,
        cacheWriteTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        estimatedCostUsd: true,
      },
      _avg: { durationMs: true },
    });
    const errorCalls = await this.db.aiUsage.count({
      where: { ...where, status: { not: 'success' } },
    });
    const successCalls = (agg._count._all ?? 0) - errorCalls;

    // Range-scoped where reused by the per-day series and latency percentiles.
    // (Computed in JS rather than raw SQL so the queries stay portable across
    // Postgres/SQLite — SQLite has no date_trunc/FILTER/percentile_cont.)
    const rangeWhere: Prisma.AiUsageWhereInput = {
      ...where,
      createdAt: { gte: rangeFrom, lte: rangeTo },
    };

    // ── per-day series ────────────────────────────────────────────────
    const seriesRows = await this.db.aiUsage.findMany({
      where: rangeWhere,
      select: {
        createdAt: true,
        totalTokens: true,
        estimatedCostUsd: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const dayBuckets = new Map<
      string,
      { calls: number; tokens: number; cost: number; errors: number }
    >();
    for (const r of seriesRows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      const b =
        dayBuckets.get(day) ?? { calls: 0, tokens: 0, cost: 0, errors: 0 };
      b.calls += 1;
      b.tokens += r.totalTokens ?? 0;
      b.cost += Number(r.estimatedCostUsd ?? 0);
      if (r.status !== 'success') b.errors += 1;
      dayBuckets.set(day, b);
    }
    const daily = [...dayBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, b]) => ({
        day,
        calls: b.calls,
        tokens: b.tokens,
        costUsd: b.cost,
        errors: b.errors,
      }));

    // ── group-by rollups ──────────────────────────────────────────────
    const perOp = await this.db.aiUsage.groupBy({
      by: ['operation'],
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _sum: { estimatedCostUsd: 'desc' } },
    });
    const perModel = await this.db.aiUsage.groupBy({
      by: ['provider', 'model'],
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _sum: { estimatedCostUsd: 'desc' } },
    });
    const perProvider = await this.db.aiUsage.groupBy({
      by: ['provider'],
      where,
      _count: { _all: true },
      _sum: { totalTokens: true, estimatedCostUsd: true },
      orderBy: { _sum: { estimatedCostUsd: 'desc' } },
    });

    // ── p50/p95/p99 latency ───────────────────────────────────────────
    const durationRows = await this.db.aiUsage.findMany({
      where: rangeWhere,
      select: { durationMs: true },
      orderBy: { durationMs: 'asc' },
    });
    const durations = durationRows.map((r) => r.durationMs ?? 0);
    const lat = {
      p50: percentileCont(durations, 0.5),
      p95: percentileCont(durations, 0.95),
      p99: percentileCont(durations, 0.99),
    };

    return {
      totals: {
        calls: agg._count._all ?? 0,
        successCalls,
        errorCalls,
        inputTokens: agg._sum.inputTokens ?? 0,
        outputTokens: agg._sum.outputTokens ?? 0,
        cachedInputTokens: agg._sum.cachedInputTokens ?? 0,
        cacheWriteTokens: agg._sum.cacheWriteTokens ?? 0,
        reasoningTokens: agg._sum.reasoningTokens ?? 0,
        totalTokens: agg._sum.totalTokens ?? 0,
        costUsd: Number(agg._sum.estimatedCostUsd ?? 0),
        averageDurationMs: Math.round(agg._avg.durationMs ?? 0),
      },
      daily,
      perOperation: perOp.map((r) => ({
        operation: r.operation,
        calls: r._count._all,
        tokens: r._sum.totalTokens ?? 0,
        costUsd: Number(r._sum.estimatedCostUsd ?? 0),
      })),
      perModel: perModel.map((r) => ({
        provider: r.provider,
        model: r.model,
        calls: r._count._all,
        tokens: r._sum.totalTokens ?? 0,
        costUsd: Number(r._sum.estimatedCostUsd ?? 0),
      })),
      perProvider: perProvider.map((r) => ({
        provider: r.provider,
        calls: r._count._all,
        tokens: r._sum.totalTokens ?? 0,
        costUsd: Number(r._sum.estimatedCostUsd ?? 0),
      })),
      latency: {
        p50: Math.round(lat.p50 ?? 0),
        p95: Math.round(lat.p95 ?? 0),
        p99: Math.round(lat.p99 ?? 0),
      },
    };
  }

  // ── Where-clause builder ───────────────────────────────────────────────
  private buildWhere(q: ListUsageQuery): Prisma.AiUsageWhereInput {
    const where: Prisma.AiUsageWhereInput = {};
    if (q.userId) where.userId = q.userId;
    if (q.orgId) where.orgId = q.orgId;
    if (q.documentId) where.documentId = q.documentId;
    if (q.sourceDocumentId) where.sourceDocumentId = q.sourceDocumentId;
    if (q.pipelineRunId) where.pipelineRunId = q.pipelineRunId;
    if (q.extractionId) where.extractionId = q.extractionId;
    if (q.analysisRunId) where.analysisRunId = q.analysisRunId;
    if (q.batchId) where.batchId = q.batchId;
    if (q.operation) where.operation = q.operation;
    if (q.provider) where.provider = q.provider;
    if (q.model) where.model = q.model;
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }
    if (q.q) {
      // SQLite has no `mode: 'insensitive'`; its LIKE is case-insensitive for
      // ASCII by default, so plain `contains` already matches case-insensitively.
      where.OR = [
        { model: { contains: q.q } },
        { featureCode: { contains: q.q } },
        { errorMessage: { contains: q.q } },
      ];
    }
    return where;
  }

  private serialise = (r: Prisma.AiUsageGetPayload<NonNullable<unknown>>) => ({
    ...r,
    estimatedCostUsd: Number(r.estimatedCostUsd),
  });

  private daysAgo(n: number): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    return d;
  }
}
