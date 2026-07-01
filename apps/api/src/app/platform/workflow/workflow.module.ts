import { Module } from '@nestjs/common';
import { GuardRegistry } from './guard.registry';
import { ActionRegistry } from './action.registry';
import { WorkflowEngine } from './workflow.engine';

/**
 * Generic workflow engine + guard/action registries. DatabaseService and
 * AuditService are provided by their @Global() modules.
 */
@Module({
  providers: [GuardRegistry, ActionRegistry, WorkflowEngine],
  exports: [GuardRegistry, ActionRegistry, WorkflowEngine],
})
export class WorkflowModule {}
