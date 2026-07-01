import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DomainConfigLoader } from './domain-config.loader';
import { DomainConfigValidator } from './domain-config.validator';
import { DomainVersionStore } from './domain-version.store';
import type { DomainConfig } from './domain.types';

/**
 * Public entry point for domain configs (DOMAIN-ARCHITECTURE.md §0/§2).
 * `syncFromDisk` loads config-as-code, validates each (fail-fast), and
 * publishes immutable version snapshots. `getConfig` returns the active config
 * for a key, cached in memory.
 */
@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);
  private readonly cache = new Map<string, DomainConfig>();

  constructor(
    private readonly loader: DomainConfigLoader,
    private readonly validator: DomainConfigValidator,
    private readonly store: DomainVersionStore,
  ) {}

  /** Load → validate → publish every domain config on disk. Fail-fast. */
  async syncFromDisk(): Promise<{ published: string[] }> {
    const configs = this.loader.loadAll();
    const published: string[] = [];
    for (const config of configs) {
      this.validator.validateOrThrow(config); // throws on any error
      await this.store.publish(config);
      this.cache.set(config.key, config);
      published.push(`${config.key}@${config.version}`);
    }
    this.logger.log(
      published.length
        ? `Synced domains: ${published.join(', ')}`
        : 'No domain configs found to sync',
    );
    return { published };
  }

  /** Active config for a domain key (cached). Throws if absent. */
  async getConfig(key: string): Promise<DomainConfig> {
    const cached = this.cache.get(key);
    if (cached) return cached;
    const stored = await this.store.getActive(key);
    if (!stored) {
      throw new NotFoundException(`Unknown or unpublished domain: "${key}"`);
    }
    this.cache.set(key, stored);
    return stored;
  }

  getVersion(key: string, version: number): Promise<DomainConfig | null> {
    return this.store.getVersion(key, version);
  }

  listActive() {
    return this.store.listActive();
  }
}
