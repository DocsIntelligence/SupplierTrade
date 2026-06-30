import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';

export type VerificationKind = string;
export type VerificationStatus =
  | 'pending'
  | 'auto_passed'
  | 'auto_failed'
  | 'approved'
  | 'rejected';

export interface SubmitVerificationInput {
  kind: VerificationKind;
  /** Free-form metadata (e.g. masked id last-4, address fields). */
  payload?: Record<string, unknown>;
  /** Optional evidence (a single uploaded file — image / pdf / etc.). */
  evidence?: { buffer: Buffer; filename?: string; mimetype?: string };
}

export interface DecisionInput {
  decision: 'approve' | 'reject';
  reason?: string;
  /** When true, the stored evidence is purged after the decision. */
  purgeEvidence?: boolean;
}

const SUBMITTABLE = new Set<VerificationStatus>([
  'pending',
  'auto_failed',
  'rejected',
]);

/**
 * Generic identity/address/KYC verification for any user.
 *
 * The workflow is:
 *   user.submit(kind, payload, evidence?) → status=pending
 *   admin.queue() returns all pending rows
 *   admin.decide(id, approve|reject, reason?) → status=approved|rejected
 *
 * Kind is a free-form string ("identity", "address", "email", "phone", "kyc", …)
 * — pick a vocabulary that fits your project and centralise it in @org/utils.
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  // ─── member-facing ──────────────────────────────────────────────

  list(userId: string) {
    return this.db.userVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submit(userId: string, input: SubmitVerificationInput) {
    if (!input.kind) throw new BadRequestException('kind is required');

    const last = await this.db.userVerification.findFirst({
      where: { userId, kind: input.kind },
      orderBy: { createdAt: 'desc' },
    });

    if (last && last.status === 'approved') {
      throw new ConflictException(`Already verified for kind "${input.kind}"`);
    }
    if (last && last.status === 'pending') {
      throw new ConflictException(
        `A pending verification for "${input.kind}" already exists`,
      );
    }
    if (last && !SUBMITTABLE.has(last.status as VerificationStatus)) {
      throw new BadRequestException(
        `Cannot submit from state "${last.status}"`,
      );
    }

    let evidenceKey: string | null = null;
    if (input.evidence?.buffer?.length) {
      const { key } = await this.storage.upload(input.evidence.buffer, {
        filename: input.evidence.filename || `${input.kind}-evidence`,
        contentType: input.evidence.mimetype || 'application/octet-stream',
        folder: `verification/${userId}`,
      });
      evidenceKey = key;
    }

    return this.db.userVerification.create({
      data: {
        userId,
        kind: input.kind,
        status: 'pending',
        payload: (input.payload ?? null) as never,
        evidenceKey,
      },
    });
  }

  // ─── admin-facing ───────────────────────────────────────────────

  queue() {
    return this.db.userVerification.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async decide(id: string, dto: DecisionInput, adminId: string) {
    if (dto.decision === 'reject' && !dto.reason) {
      throw new BadRequestException('A reason is required when rejecting');
    }

    const row = await this.db.userVerification.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!row) throw new NotFoundException('Verification not found');
    if (row.status !== 'pending') {
      throw new ConflictException(
        `Verification is not pending (state: ${row.status})`,
      );
    }

    const approve = dto.decision === 'approve';
    const updated = await this.db.userVerification.update({
      where: { id },
      data: {
        status: approve ? 'approved' : 'rejected',
        reviewedBy: adminId,
        decidedAt: new Date(),
        rejectReason: approve ? null : dto.reason,
        evidenceKey: dto.purgeEvidence ? null : row.evidenceKey,
      },
    });

    if (dto.purgeEvidence && row.evidenceKey) {
      this.storage.delete(row.evidenceKey).catch((e) =>
        this.logger.warn(
          `Failed to purge verification evidence: ${(e as Error).message}`,
        ),
      );
    }

    void this.notifyDecision(
      row.user.email,
      row.user.name || '',
      row.kind,
      approve,
      approve ? undefined : dto.reason,
    );

    this.logger.log(
      `Verification ${dto.decision} on ${row.kind} for user ${row.userId} by ${adminId}`,
    );

    return updated;
  }

  private async notifyDecision(
    email: string,
    name: string,
    kind: string,
    approve: boolean,
    reason?: string,
  ) {
    try {
      await this.mail.enqueue({
        to: email,
        subject: approve
          ? `Your ${kind} verification is approved`
          : `Action needed: ${kind} verification update`,
        template: 'verification-decision',
        templateData: {
          name: name || email.split('@')[0],
          kind,
          outcome: approve ? 'approved' : 'rejected',
          reason: reason ?? '',
        },
      });
    } catch (e) {
      this.logger.warn(
        `Failed to enqueue verification email: ${(e as Error).message}`,
      );
    }
  }
}
