import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { DomainConfig } from './domain.types';
import type { WorkflowDef } from '../workflow/workflow.types';

/**
 * Loads domain configs from disk (config-as-code, DOMAIN-ARCHITECTURE.md §0).
 * Each domain lives in `<configDir>/<key>/domain.yaml` whose top-level `domain:`
 * block references its JSON Schemas and workflow by relative `$ref`. This
 * loader parses YAML and inlines those references into a `DomainConfig`.
 *
 * Base dir resolves from `DOMAIN_CONFIG_DIR`, else `<cwd>/config/domains`.
 */
@Injectable()
export class DomainConfigLoader {
  private readonly logger = new Logger(DomainConfigLoader.name);

  get baseDir(): string {
    const fromEnv = process.env['DOMAIN_CONFIG_DIR'];
    if (fromEnv) return isAbsolute(fromEnv) ? fromEnv : resolve(fromEnv);
    return resolve(process.cwd(), 'config', 'domains');
  }

  /** Load every domain directory under the base dir. */
  loadAll(): DomainConfig[] {
    const base = this.baseDir;
    if (!existsSync(base)) {
      this.logger.warn(`Domain config dir not found: ${base}`);
      return [];
    }
    return readdirSync(base)
      .map((name) => join(base, name))
      .filter((p) => statSync(p).isDirectory())
      .filter((p) => existsSync(join(p, 'domain.yaml')))
      .map((p) => this.loadDir(p));
  }

  /** Load a single domain directory containing `domain.yaml`. */
  loadDir(dir: string): DomainConfig {
    const file = join(dir, 'domain.yaml');
    const raw = parseYaml(readFileSync(file, 'utf8')) as
      | { domain?: DomainConfig }
      | DomainConfig;
    const domain = ('domain' in raw && raw.domain ? raw.domain : raw) as
      DomainConfig;

    if (domain.entity_schemas) {
      domain.entity_schemas = {
        supplier: this.resolveRef(dir, domain.entity_schemas.supplier),
        listing: this.resolveRef(dir, domain.entity_schemas.listing),
      };
    }

    if (domain.workflow) {
      domain.workflow = this.resolveWorkflow(dir, domain.workflow);
    }

    this.logger.log(`Loaded domain config: ${domain.key} v${domain.version}`);
    return domain;
  }

  /** Resolve a `{ $ref: "schemas/x.json" }` to the parsed JSON object. */
  private resolveRef(
    dir: string,
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (!value) return undefined;
    const ref = (value as { $ref?: string }).$ref;
    if (!ref) return value as Record<string, unknown>; // already inline
    const path = join(dir, ref);
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  /** Resolve a workflow `$ref` (YAML with a top-level `workflow:` block). */
  private resolveWorkflow(dir: string, value: unknown): WorkflowDef {
    const ref = (value as { $ref?: string }).$ref;
    if (!ref) return value as WorkflowDef; // already inline
    const path = join(dir, ref);
    const parsed = parseYaml(readFileSync(path, 'utf8')) as
      | { workflow?: WorkflowDef }
      | WorkflowDef;
    return ('workflow' in parsed && parsed.workflow
      ? parsed.workflow
      : parsed) as WorkflowDef;
  }
}
