import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

/**
 * Generic recurring cleanup jobs. Each job is also exposed via
 * `CronAdminController` so an admin can trigger it on demand.
 */
@Injectable()
export class CronJobs {
  private readonly logger = new Logger(CronJobs.name);

  constructor(private readonly db: DatabaseService) {}

  /** Purge expired idempotency keys every hour. */
  @Cron(CronExpression.EVERY_HOUR, { name: 'idempotency.purge' })
  async purgeIdempotency(): Promise<{ deleted: number }> {
    const r = await this.db.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (r.count > 0) this.logger.log(`Purged ${r.count} idempotency keys`);
    return { deleted: r.count };
  }

  /** Purge expired invitations every 6 hours. */
  @Cron(CronExpression.EVERY_6_HOURS, { name: 'invitations.purge' })
  async purgeInvitations(): Promise<{ deleted: number }> {
    const r = await this.db.invitation.deleteMany({
      where: { acceptedAt: null, expiresAt: { lt: new Date() } },
    });
    if (r.count > 0) this.logger.log(`Purged ${r.count} expired invitations`);
    return { deleted: r.count };
  }

  /** Drop very old mail logs (>90 days) once a day at 03:00. */
  @Cron('0 3 * * *', { name: 'mail-logs.purge' })
  async purgeMailLogs(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const r = await this.db.mailLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (r.count > 0) this.logger.log(`Purged ${r.count} mail logs`);
    return { deleted: r.count };
  }

  /** Drop very old audit log entries (>365 days). */
  @Cron('30 3 * * *', { name: 'audit.purge' })
  async purgeAuditLogs(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000);
    const r = await this.db.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (r.count > 0) this.logger.log(`Purged ${r.count} audit log entries`);
    return { deleted: r.count };
  }

  /** Hand-rolled lookup table for admin "run now". */
  manualRunners(): Record<string, () => Promise<unknown>> {
    return {
      'idempotency.purge': () => this.purgeIdempotency(),
      'invitations.purge': () => this.purgeInvitations(),
      'mail-logs.purge': () => this.purgeMailLogs(),
      'audit.purge': () => this.purgeAuditLogs(),
    };
  }
}
