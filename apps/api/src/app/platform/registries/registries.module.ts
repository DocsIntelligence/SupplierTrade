import { Module } from '@nestjs/common';
import { GstAdapter } from '../../adapters/verification/gst.adapter';
import { LitigationAdapter } from '../../adapters/verification/litigation.adapter';
import { GrainGradeScorer } from '../../adapters/qc/grain-grade.scorer';
import { VERIFICATION_ADAPTERS } from './verification-adapter.interface';
import { VerificationAdapterRegistry } from './verification-adapter.registry';
import { QC_SCORERS } from './qc-scorer.interface';
import { QcScorerRegistry } from './qc-scorer.registry';

/**
 * The code-level seam (DOMAIN-ARCHITECTURE.md §5). To add a verification signal
 * or QC scorer: implement the interface in `adapters/`, add the class to
 * `providers`, and include it in the matching factory `inject` array below.
 * A domain config referencing a key that isn't wired here fails validation at
 * load (see DomainConfigValidator) — never at runtime.
 */
@Module({
  providers: [
    GstAdapter,
    LitigationAdapter,
    GrainGradeScorer,
    {
      provide: VERIFICATION_ADAPTERS,
      useFactory: (gst: GstAdapter, litigation: LitigationAdapter) => [
        gst,
        litigation,
      ],
      inject: [GstAdapter, LitigationAdapter],
    },
    {
      provide: QC_SCORERS,
      useFactory: (grain: GrainGradeScorer) => [grain],
      inject: [GrainGradeScorer],
    },
    VerificationAdapterRegistry,
    QcScorerRegistry,
  ],
  exports: [VerificationAdapterRegistry, QcScorerRegistry],
})
export class RegistriesModule {}
