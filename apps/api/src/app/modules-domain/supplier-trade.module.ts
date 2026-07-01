import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ListingsModule } from './listings/listings.module';
import { VerificationEngineModule } from './verification-engine/verification-engine.module';
import { QcModule } from './qc/qc.module';

/**
 * SupplierTrade business modules (the multi-vertical trust + quality layer).
 * Each depends only on `platform/*` + config — never on a specific domain
 * folder (DOMAIN-ARCHITECTURE.md §7). Note: distinct from the generic,
 * user-bound `verification` (KYC) module that ships in the boilerplate — see
 * docs/SUPPLIERTRADE-PLAN.md §3.
 */
@Module({
  imports: [
    SuppliersModule,
    ListingsModule,
    VerificationEngineModule,
    QcModule,
  ],
})
export class SupplierTradeModule {}
