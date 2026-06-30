import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { DatabaseService } from '../database/database.service';

const BCRYPT_ROUNDS = 10;
const RECOVERY_CODE_COUNT = 8;

function newRecoveryCode(): string {
  return randomBytes(5).toString('hex'); // 10 hex chars
}

/**
 * Two-factor authentication via TOTP (RFC 6238). The flow:
 *   1. setup() → creates a `TwoFactor` row with `enabled=false`, returns secret + otpauth URL + QR.
 *   2. confirm(code) → verifies first code from authenticator app, marks enabled, returns recovery codes.
 *   3. verify(code) → check at login.
 *   4. disable(code) → tear down, requires a current code.
 *   5. consumeRecovery(code) → fallback when device is lost.
 */
@Injectable()
export class TotpService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async setup(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.db.twoFactor.findUnique({ where: { userId } });
    if (existing?.enabled) {
      throw new BadRequestException('TOTP is already enabled');
    }

    const secret = authenticator.generateSecret();
    const issuer = this.config.get<string>('PUBLIC_URL') ?? 'starter';
    const otpauth = authenticator.keyuri(user.email, new URL(issuer).hostname, secret);

    await this.db.twoFactor.upsert({
      where: { userId },
      create: { userId, secret, enabled: false },
      update: { secret, enabled: false, confirmedAt: null },
    });

    return { secret, otpauth };
  }

  async confirm(userId: string, code: string) {
    const row = await this.db.twoFactor.findUnique({ where: { userId } });
    if (!row) throw new BadRequestException('Run setup first');
    if (!authenticator.check(code, row.secret)) {
      throw new BadRequestException('Invalid TOTP code');
    }

    const recovery = Array.from({ length: RECOVERY_CODE_COUNT }, newRecoveryCode);
    const recoveryCodesHash = await Promise.all(
      recovery.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)),
    );

    await this.db.twoFactor.update({
      where: { userId },
      data: {
        enabled: true,
        confirmedAt: new Date(),
        recoveryCodesHash: recoveryCodesHash as never,
      },
    });

    return { enabled: true, recoveryCodes: recovery };
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const row = await this.db.twoFactor.findUnique({ where: { userId } });
    if (!row?.enabled) return false;
    return authenticator.check(code, row.secret);
  }

  async consumeRecovery(userId: string, code: string): Promise<boolean> {
    const row = await this.db.twoFactor.findUnique({ where: { userId } });
    if (!row?.enabled) return false;
    const hashes = (row.recoveryCodesHash as string[]) ?? [];
    for (let i = 0; i < hashes.length; i++) {
      if (await bcrypt.compare(code, hashes[i])) {
        const next = [...hashes.slice(0, i), ...hashes.slice(i + 1)];
        await this.db.twoFactor.update({
          where: { userId },
          data: { recoveryCodesHash: next as never },
        });
        return true;
      }
    }
    return false;
  }

  async disable(userId: string, code: string) {
    if (!(await this.verify(userId, code))) {
      throw new BadRequestException('Invalid TOTP code');
    }
    return this.db.twoFactor.delete({ where: { userId } });
  }

  async status(userId: string) {
    const row = await this.db.twoFactor.findUnique({ where: { userId } });
    return {
      enabled: row?.enabled ?? false,
      confirmedAt: row?.confirmedAt ?? null,
      recoveryCodesRemaining: ((row?.recoveryCodesHash as string[]) ?? []).length,
    };
  }
}
