import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DomainsService } from './domains.service';

/**
 * Loads + validates + publishes domain configs on application boot
 * (config-as-code "loaded on deploy" — DOMAIN-ARCHITECTURE.md §0).
 *
 * Fail-fast: an invalid config (bad shape or unregistered plugin key) throws
 * here and the application refuses to start. Set `DOMAIN_SYNC_ON_BOOT=false`
 * to skip (e.g. in unit tests that don't need DB-backed domains).
 */
@Injectable()
export class DomainBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DomainBootstrapService.name);

  constructor(private readonly domains: DomainsService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env['DOMAIN_SYNC_ON_BOOT'] === 'false') {
      this.logger.warn('DOMAIN_SYNC_ON_BOOT=false — skipping domain sync');
      return;
    }
    await this.domains.syncFromDisk();
  }
}
