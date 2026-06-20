import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const FIRST_SWEEP_DELAY_MS = 60_000; // first sweep one minute after boot
const BATCH_SIZE = 5_000; // delete in chunks so a runaway purge can't OOM PG

/**
 * Nightly-ish purge for the AI usage ledger. Each row carries its own
 * `retentionDays` (defaulted from the `ai.usage.retention.days` setting at
 * insert time), so retention can be tightened or extended per-row without a
 * migration. The sweep deletes any row whose `createdAt + retentionDays` is in
 * the past, in bounded chunks, so the DELETE never blocks Postgres on a huge
 * tombstone scan.
 *
 * Dependency-free interval (matches the IntelligenceReconciler pattern — no
 * @nestjs/schedule). Sweep runs on every API replica; the DELETE itself is
 * idempotent, so multiple instances racing is harmless.
 */
@Injectable()
export class AiUsagePurgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiUsagePurgeService.name);
  private timer: NodeJS.Timeout | null = null;
  private initial: NodeJS.Timeout | null = null;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    // Don't sweep at boot — wait a minute so migrations / warm-up finish first.
    this.initial = setTimeout(() => {
      void this.runSafely();
      this.timer = setInterval(() => void this.runSafely(), SWEEP_INTERVAL_MS);
      this.timer.unref?.();
    }, FIRST_SWEEP_DELAY_MS);
    this.initial.unref?.();
    this.logger.log('AI usage purge scheduler started');
  }

  onModuleDestroy() {
    if (this.initial) clearTimeout(this.initial);
    if (this.timer) clearInterval(this.timer);
  }

  private async runSafely(): Promise<void> {
    try {
      const purged = await this.purge();
      if (purged > 0) {
        this.logger.log(`Purged ${purged} expired AiUsage row(s)`);
      }
    } catch (e) {
      this.logger.error(`AI usage purge failed: ${(e as Error).message}`);
    }
  }

  /**
   * Delete rows whose `createdAt + retentionDays` is in the past. Returns
   * the number of rows deleted across all chunks.
   *
   * Per-row expiry (`createdAt + retentionDays days < now`) can't be expressed
   * in a Prisma `where` (no column-to-column date arithmetic) and the obvious
   * server-side form is dialect-specific (`::interval` / `DELETE … USING` are
   * Postgres-only and fail on SQLite). So we page through the ledger oldest-id
   * first in bounded chunks, decide expiry in JS, and `deleteMany` the expired
   * ids — portable across SQLite/Postgres and independent of how the driver
   * stores `DateTime`. Tradeoff: this scans the table per sweep; for a very
   * large Postgres ledger a native interval DELETE would be cheaper.
   */
  async purge(): Promise<number> {
    const now = Date.now();
    const DAY_MS = 86_400_000;
    let total = 0;
    let cursor: string | undefined;

    for (;;) {
      const rows = await this.db.aiUsage.findMany({
        select: { id: true, createdAt: true, retentionDays: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1].id;

      const expiredIds = rows
        .filter((r) => r.createdAt.getTime() + r.retentionDays * DAY_MS < now)
        .map((r) => r.id);
      if (expiredIds.length > 0) {
        const { count } = await this.db.aiUsage.deleteMany({
          where: { id: { in: expiredIds } },
        });
        total += count;
      }

      if (rows.length < BATCH_SIZE) break; // last page
    }
    return total;
  }
}
