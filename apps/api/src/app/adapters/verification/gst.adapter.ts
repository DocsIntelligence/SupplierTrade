import { Injectable, Logger } from '@nestjs/common';
import { SignalStatus } from '@org/utils';
import {
  VerificationAdapter,
  VerificationAdapterInput,
  VerificationSignalResult,
} from '../../platform/registries/verification-adapter.interface';

/**
 * GST verification signal.
 *
 * Phase-1 implementation is a *graded* offline check on GSTIN shape/checksum —
 * NOT a live GSTN lookup (Open Question #2: programmatic registry access TBD).
 * When access is confirmed, swap the body for a real GSTN call; the graded
 * contract (pass/flag/na + evidence) stays the same (GUARDRAIL #3).
 */
@Injectable()
export class GstAdapter implements VerificationAdapter {
  readonly key = 'gst';
  private readonly logger = new Logger(GstAdapter.name);

  // 2 digits state + 10 char PAN + 1 entity + 'Z' + 1 checksum
  private static readonly GSTIN_RE =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  async run(
    input: VerificationAdapterInput,
  ): Promise<VerificationSignalResult> {
    const gstin = (input.supplier.gstin ?? '').toUpperCase().trim();

    if (!gstin) {
      return {
        status: SignalStatus.NA,
        evidence: { reason: 'no_gstin_provided' },
        summary: 'No GSTIN on file — GST signal not applicable.',
      };
    }

    const wellFormed = GstAdapter.GSTIN_RE.test(gstin);
    this.logger.debug(`gst check ${gstin}: wellFormed=${wellFormed}`);

    return {
      status: wellFormed ? SignalStatus.PASS : SignalStatus.FLAG,
      evidence: {
        gstin,
        wellFormed,
        method: 'offline_format_check',
        checkedAt: new Date().toISOString(),
      },
      summary: wellFormed
        ? `GSTIN ${gstin} is well-formed (offline check; live GSTN lookup pending registry access).`
        : `GSTIN ${gstin} failed format validation.`,
    };
  }
}
