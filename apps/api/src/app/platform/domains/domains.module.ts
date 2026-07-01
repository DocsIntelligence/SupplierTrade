import { Module } from '@nestjs/common';
import { RegistriesModule } from '../registries/registries.module';
import { SchemaModule } from '../schema/schema.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { DomainConfigLoader } from './domain-config.loader';
import { DomainConfigValidator } from './domain-config.validator';
import { DomainVersionStore } from './domain-version.store';
import { DomainsService } from './domains.service';
import { DomainBootstrapService } from './domain-bootstrap.service';
import { DomainsController } from './domains.controller';

@Module({
  imports: [RegistriesModule, SchemaModule, WorkflowModule],
  controllers: [DomainsController],
  providers: [
    DomainConfigLoader,
    DomainConfigValidator,
    DomainVersionStore,
    DomainsService,
    DomainBootstrapService,
  ],
  exports: [DomainsService, DomainVersionStore],
})
export class DomainsModule {}
