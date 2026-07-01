import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JsonSchemaService } from '../schema/json-schema.service';
import { VerificationAdapterRegistry } from '../registries/verification-adapter.registry';
import { QcScorerRegistry } from '../registries/qc-scorer.registry';
import { DomainsService } from './domains.service';

/**
 * READ-ONLY domain config for the operational UI (drives dynamic forms,
 * terminology and supplier-type pickers). This is NOT the admin config studio
 * (DOMAIN-ARCHITECTURE.md §0 layers 2/3 — still not built); it only surfaces
 * the active published config so schema-driven forms can render.
 */
@ApiTags('domains')
@ApiBearerAuth('bearer')
@Controller('domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(
    private readonly domains: DomainsService,
    private readonly schema: JsonSchemaService,
    private readonly verificationRegistry: VerificationAdapterRegistry,
    private readonly qcRegistry: QcScorerRegistry,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active domains' })
  async list() {
    const rows = await this.domains.listActive();
    return rows.map((d) => ({
      key: d.key,
      name: d.name,
      status: d.status,
      version: d.version,
    }));
  }

  @Get(':key')
  @ApiOperation({ summary: 'Active config for a domain (UI-safe view)' })
  async get(@Param('key') key: string) {
    const c = await this.domains.getConfig(key);
    return {
      key: c.key,
      name: c.name,
      version: c.version,
      status: c.status,
      terminology: c.terminology ?? {},
      feature_flags: c.feature_flags ?? {},
      supplier_types: (c.supplier_types ?? []).map((t) => ({
        key: t.key,
        label: t.label,
        required_documents: t.required_documents ?? [],
        media_capture: t.media_capture ?? [],
      })),
      qc_profile: c.qc_profile ?? null,
      workflow_states: c.workflow?.states ?? [],
    };
  }

  @Get(':key/form/:entity')
  @ApiOperation({
    summary: 'Dynamic form field metadata for an entity (supplier | listing)',
  })
  async form(@Param('key') key: string, @Param('entity') entity: string) {
    const c = await this.domains.getConfig(key);
    const schema =
      entity === 'supplier'
        ? c.entity_schemas?.supplier
        : entity === 'listing'
          ? c.entity_schemas?.listing
          : undefined;
    if (!schema) {
      throw new NotFoundException(
        `No "${entity}" schema for domain "${key}"`,
      );
    }
    return this.schema.formMetadata(schema);
  }

  /**
   * READ-ONLY config inspector (DOMAIN-ARCHITECTURE.md §0 Layer 2). Admin-only.
   * Surfaces the full active config — workflow, verification/QC profiles, and
   * every plugin key it references — alongside the keys actually registered in
   * code, so an admin can see what's wired. NOT config editing (that's Layer 3).
   */
  @Get(':key/inspect')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Read-only full config inspector (admin)' })
  async inspect(@Param('key') key: string) {
    const c = await this.domains.getConfig(key);
    const referencedSignals = [
      ...(c.verification_profile?.required_signals ?? []),
      ...(c.supplier_types ?? []).flatMap((t) => t.verification_signals ?? []),
    ].map((s) => s.key);

    return {
      key: c.key,
      name: c.name,
      version: c.version,
      status: c.status,
      supplier_types: (c.supplier_types ?? []).map((t) => t.key),
      verification: {
        required_signals: c.verification_profile?.required_signals ?? [],
        thresholds: c.verification_profile?.thresholds ?? {},
      },
      qc_profile: c.qc_profile ?? null,
      workflow: {
        initial: c.workflow?.initial,
        states: c.workflow?.states ?? [],
        transitions: c.workflow?.transitions ?? [],
      },
      plugins: {
        verification: {
          referenced: [...new Set(referencedSignals)],
          registered: this.verificationRegistry.keys(),
        },
        qc: {
          referenced: c.qc_profile?.scorer ? [c.qc_profile.scorer] : [],
          registered: this.qcRegistry.keys(),
        },
      },
      feature_flags: c.feature_flags ?? {},
    };
  }
}
