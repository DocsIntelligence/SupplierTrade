import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { JsonSchemaService } from '../../platform/schema/json-schema.service';

/**
 * Domain-scoped listings. `attributes` validated against the domain's listing
 * JSON Schema — one renderer/validator for every domain (DOMAIN-ARCHITECTURE §3).
 */
@Injectable()
export class ListingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly domains: DomainsService,
    private readonly schema: JsonSchemaService,
  ) {}

  async create(input: {
    domainKey: string;
    supplierId: string;
    attributes?: Record<string, unknown>;
  }) {
    const domain = await this.domains.getConfig(input.domainKey);

    const supplier = await this.db.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier || supplier.domainKey !== domain.key) {
      throw new BadRequestException(
        `Supplier ${input.supplierId} not found in domain "${domain.key}"`,
      );
    }

    const attributes = input.attributes ?? {};
    const result = this.schema.validate(
      domain.entity_schemas?.listing,
      attributes,
      `${domain.key}.listing`,
    );
    if (!result.valid) {
      throw new BadRequestException(
        `listing attributes invalid: ${result.errors.join('; ')}`,
      );
    }

    return this.db.listing.create({
      data: {
        domainKey: domain.key,
        supplierId: input.supplierId,
        attributes: attributes as object,
      },
    });
  }

  async get(id: string) {
    const listing = await this.db.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    return listing;
  }

  list(domainKey: string) {
    return this.db.listing.findMany({
      where: { domainKey },
      orderBy: { createdAt: 'desc' },
    });
  }
}
