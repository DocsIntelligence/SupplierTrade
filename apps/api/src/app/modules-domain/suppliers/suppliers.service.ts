import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { findSupplierType } from '../../platform/domains/domain.types';
import { JsonSchemaService } from '../../platform/schema/json-schema.service';
import { WorkflowEngine } from '../../platform/workflow/workflow.engine';
import { Prisma } from '@prisma/client';
import { WorkflowSubject } from '@org/utils';
import {
  SUPPLIER_SORT_FIELDS,
  type CreateSupplierDto,
  type SupplierListQuery,
} from '@org/dto';

/**
 * Domain-scoped supplier CRUD. 100% config-driven (no domain conditionals):
 *  - the `supplier_type` must exist in the domain config,
 *  - `attributes` are validated against the domain's supplier JSON Schema,
 *  - a workflow instance is created in the domain workflow's initial state.
 */
@Injectable()
export class SuppliersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly domains: DomainsService,
    private readonly schema: JsonSchemaService,
    private readonly workflow: WorkflowEngine,
  ) {}

  async create(dto: CreateSupplierDto) {
    const domain = await this.domains.getConfig(dto.domainKey);

    const type = findSupplierType(domain, dto.supplierType);
    if (!type) {
      throw new BadRequestException(
        `Unknown supplier_type "${dto.supplierType}" for domain "${domain.key}"`,
      );
    }

    const attributes = dto.attributes ?? {};
    const result = this.schema.validate(
      domain.entity_schemas?.supplier,
      attributes,
      `${domain.key}.supplier`,
    );
    if (!result.valid) {
      throw new BadRequestException(
        `supplier attributes invalid: ${result.errors.join('; ')}`,
      );
    }

    const supplier = await this.db.supplier.create({
      data: {
        domainKey: domain.key,
        supplierType: dto.supplierType,
        legalName: dto.legalName,
        gstin: dto.gstin || null,
        orgId: dto.orgId ?? null,
        attributes: attributes as object,
        consentAt: dto.consent ? new Date() : null,
      },
    });

    if (domain.workflow) {
      await this.workflow.createInstance({
        domainKey: domain.key,
        workflowVersion: domain.version,
        subjectType: WorkflowSubject.SUPPLIER,
        subjectId: supplier.id,
        def: domain.workflow,
        context: { requiredFieldsPresent: true },
      });
    }

    return supplier;
  }

  /** Fire a workflow event against a supplier (e.g. "submit"). */
  async transition(id: string, event: string, actor?: string | null) {
    const supplier = await this.get(id);
    const domain = await this.domains.getConfig(supplier.domainKey);
    const instance = await this.workflow.send(
      WorkflowSubject.SUPPLIER,
      id,
      event,
      { domain, actor },
    );
    // Mirror the workflow state onto the supplier row for cheap querying.
    await this.db.supplier.update({
      where: { id },
      data: { status: instance.currentState },
    });
    return instance;
  }

  async get(id: string) {
    const supplier = await this.db.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  /**
   * Server-side paginated + searchable + sortable supplier list. This is the
   * reference implementation of the list contract in docs/UI-STANDARDS.md;
   * other entity lists follow the same shape (paginationQuerySchema in,
   * { items, total, page, pageSize } out).
   */
  async list(q: SupplierListQuery) {
    const search = q.search?.trim();
    const where: Prisma.SupplierWhereInput = {
      domainKey: q.domainKey,
      ...(q.supplierType ? { supplierType: q.supplierType } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(search
        ? {
            OR: [
              { legalName: { contains: search } },
              { gstin: { contains: search } },
            ],
          }
        : {}),
    };

    const sortBy = (
      SUPPLIER_SORT_FIELDS as readonly string[]
    ).includes(q.sortBy ?? '')
      ? (q.sortBy as string)
      : 'createdAt';

    const [items, total] = await Promise.all([
      this.db.supplier.findMany({
        where,
        orderBy: { [sortBy]: q.sortOrder },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.supplier.count({ where }),
    ]);

    return { items, total, page: q.page, pageSize: q.pageSize };
  }
}
