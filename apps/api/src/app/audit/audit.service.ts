import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface AuditRecord {
  actorId?: string | null;
  orgId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  ua?: string | null;
}

export interface AuditQuery {
  actorId?: string;
  orgId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  async record(rec: AuditRecord) {
    try {
      await this.db.auditLog.create({
        data: {
          actorId: rec.actorId ?? null,
          orgId: rec.orgId ?? null,
          action: rec.action,
          targetType: rec.targetType ?? null,
          targetId: rec.targetId ?? null,
          before: rec.before as never,
          after: rec.after as never,
          ip: rec.ip ?? null,
          ua: rec.ua ?? null,
        },
      });
    } catch (e) {
      this.logger.warn(`audit failed: ${(e as Error).message}`);
    }
  }

  list(q: AuditQuery = {}) {
    return this.db.auditLog.findMany({
      where: {
        actorId: q.actorId,
        orgId: q.orgId,
        action: q.action,
        targetType: q.targetType,
        targetId: q.targetId,
        createdAt: q.from || q.to ? { gte: q.from, lte: q.to } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit ?? 100,
      skip: q.offset ?? 0,
    });
  }
}
