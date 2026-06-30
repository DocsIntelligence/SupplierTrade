import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

const CODE_BYTES = 5; // base32 → 8 chars
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // no 0/1/i/l/o

function newCode(): string {
  const bytes = randomBytes(CODE_BYTES);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export interface ReferralStats {
  invited: number;
  awarded: number;
  pending: number;
}

@Injectable()
export class ReferralsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get (or assign) a stable referral code for a user. Lazy — the row is
   * created the first time a user views their code. We keep a single
   * placeholder row per referrer with `referredId = null` so the code is
   * persisted; subsequent referrals re-use the same code value.
   */
  async getMyCode(userId: string): Promise<{ code: string; shareUrl: string }> {
    const existing = await this.db.referral.findFirst({
      where: { referrerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { code: true },
    });

    let code = existing?.code;
    if (!code) {
      // Find a free code (collisions are astronomically rare; retry a few).
      for (let i = 0; i < 8; i++) {
        const candidate = newCode();
        const taken = await this.db.referral.findFirst({
          where: { code: candidate },
          select: { id: true },
        });
        if (!taken) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new ConflictException('Could not allocate a referral code');
      await this.db.referral.create({
        data: { code, referrerId: userId },
      });
    }

    const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
    return { code, shareUrl: `${frontend}/?ref=${code}` };
  }

  async stats(userId: string): Promise<ReferralStats> {
    // Exclude the placeholder (referredId = null) from "invited".
    const rows = await this.db.referral.findMany({
      where: { referrerId: userId, referredId: { not: null } },
      select: { rewardStatus: true },
    });
    return {
      invited: rows.length,
      awarded: rows.filter((r) => r.rewardStatus === 'awarded').length,
      pending: rows.filter((r) => r.rewardStatus === 'pending').length,
    };
  }

  listMine(userId: string) {
    return this.db.referral.findMany({
      where: { referrerId: userId, referredId: { not: null } },
      include: {
        referred: { select: { id: true, name: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Called by auth.service.register (or any signup flow) right after the new
   * user row is created. Idempotent — if `referredId` already has a row, this
   * is a no-op and returns it. Self-referral is rejected.
   */
  async attachReferred(code: string, referredId: string, source?: string) {
    const referrer = await this.db.referral.findFirst({
      where: { code },
      select: { referrerId: true, code: true },
    });
    if (!referrer) throw new NotFoundException('Unknown referral code');
    if (referrer.referrerId === referredId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const already = await this.db.referral.findUnique({
      where: { referredId },
    });
    if (already) return already;

    return this.db.referral.create({
      data: {
        code: referrer.code,
        referrerId: referrer.referrerId,
        referredId,
        source: source ?? null,
        usedAt: new Date(),
      },
    });
  }

  /** Mark a referral as rewarded — project-specific reward logic supplies metadata. */
  async markRewarded(id: string, metadata?: Record<string, unknown>) {
    return this.db.referral.update({
      where: { id },
      data: {
        rewardStatus: 'awarded',
        rewardMetadata: (metadata ?? null) as never,
      },
    });
  }

  /** Admin: list every referral (paginated). */
  list(offset = 0, limit = 100) {
    return this.db.referral.findMany({
      where: { referredId: { not: null } },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referred: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}
