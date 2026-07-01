import { Injectable } from '@nestjs/common';
import { SignalStatus } from '@org/utils';
import {
  VerificationAdapter,
  VerificationAdapterInput,
  VerificationSignalResult,
} from '../../platform/registries/verification-adapter.interface';

/**
 * Litigation / adverse-media signal.
 *
 * Phase-1 implementation reports `na` with a "manual review pending" evidence
 * trail — it deliberately does NOT fabricate a clean result (GUARDRAIL #3: no
 * binary "safe"). When a court/adverse-media data source is wired, return
 * `pass` (nothing found) or `flag` (matches found) with case references.
 */
@Injectable()
export class LitigationAdapter implements VerificationAdapter {
  readonly key = 'litigation';

  async run(
    input: VerificationAdapterInput,
  ): Promise<VerificationSignalResult> {
    return {
      status: SignalStatus.NA,
      evidence: {
        subject: input.supplier.legalName,
        source: 'none_connected',
        note: 'No litigation/adverse-media source connected yet (Open Question #2). Manual review required before relying on this signal.',
        checkedAt: new Date().toISOString(),
      },
      summary:
        'Litigation check not available — no data source connected; flagged for manual review (never auto-cleared).',
    };
  }
}
