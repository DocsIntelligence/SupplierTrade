import { Module } from '@nestjs/common';
import { RegistriesModule } from './registries/registries.module';
import { SchemaModule } from './schema/schema.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ExpressionModule } from './expression/expression.module';
import { DomainsModule } from './domains/domains.module';

/**
 * The domain-agnostic platform core (DOMAIN-ARCHITECTURE.md §7). Business
 * modules import this and depend ONLY on it + config — never on a specific
 * domain folder. Re-exports every platform capability:
 *  - DomainsService / DomainVersionStore       (domains)
 *  - WorkflowEngine / Guard & Action registries (workflow)
 *  - JsonSchemaService                          (schema)
 *  - VerificationAdapterRegistry / QcScorerRegistry (registries)
 *  - ExprEvaluator                              (expression)
 */
@Module({
  imports: [
    RegistriesModule,
    SchemaModule,
    WorkflowModule,
    ExpressionModule,
    DomainsModule,
  ],
  exports: [
    RegistriesModule,
    SchemaModule,
    WorkflowModule,
    ExpressionModule,
    DomainsModule,
  ],
})
export class PlatformModule {}
