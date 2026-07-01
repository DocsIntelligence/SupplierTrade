import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { DomainConfig } from './domain.types';

/**
 * Persists domains + immutable published version snapshots
 * (DOMAIN-ARCHITECTURE.md §2/§6). Publishing a config:
 *  - upserts the `Domain` row with the active config + version, and
 *  - creates an immutable `DomainVersion` snapshot (no-op if that version
 *    already exists — publishes are idempotent per version number).
 */
@Injectable()
export class DomainVersionStore {
  private readonly logger = new Logger(DomainVersionStore.name);

  constructor(private readonly db: DatabaseService) {}

  async publish(config: DomainConfig): Promise<void> {
    const existingVersion = await this.db.domainVersion.findUnique({
      where: {
        domainKey_version: { domainKey: config.key, version: config.version },
      },
    });

    await this.db.domain.upsert({
      where: { key: config.key },
      create: {
        key: config.key,
        name: config.name,
        status: config.status,
        version: config.version,
        configJson: config as object,
      },
      update: {
        name: config.name,
        status: config.status,
        version: config.version,
        configJson: config as object,
      },
    });

    if (!existingVersion) {
      await this.db.domainVersion.create({
        data: {
          domainKey: config.key,
          version: config.version,
          configJson: config as object,
        },
      });
      this.logger.log(`Published ${config.key} v${config.version}`);
    } else {
      this.logger.debug(
        `${config.key} v${config.version} already snapshotted — config updated in place`,
      );
    }
  }

  async getActive(key: string): Promise<DomainConfig | null> {
    const row = await this.db.domain.findUnique({ where: { key } });
    return row ? (row.configJson as unknown as DomainConfig) : null;
  }

  async getVersion(
    key: string,
    version: number,
  ): Promise<DomainConfig | null> {
    const row = await this.db.domainVersion.findUnique({
      where: { domainKey_version: { domainKey: key, version } },
    });
    return row ? (row.configJson as unknown as DomainConfig) : null;
  }

  listActive() {
    return this.db.domain.findMany({ where: { status: 'active' } });
  }
}
