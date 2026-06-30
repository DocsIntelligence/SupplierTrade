import { randomBytes } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

const PREFIX_BYTES = 6; // pak_<12 hex chars>_…
const SECRET_BYTES = 24;
const BCRYPT_ROUNDS = 10;

export interface CreateApiKeyInput {
  name: string;
  orgId?: string;
  scopes?: string[];
  expiresAt?: Date;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly db: DatabaseService) {}

  /** Returns the raw token EXACTLY once — store the response client-side. */
  async create(userId: string, input: CreateApiKeyInput) {
    const prefix = `pak_${randomBytes(PREFIX_BYTES).toString('hex')}`;
    const secret = randomBytes(SECRET_BYTES).toString('base64url');
    const token = `${prefix}_${secret}`;
    const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);

    const row = await this.db.apiKey.create({
      data: {
        userId,
        orgId: input.orgId ?? null,
        name: input.name,
        prefix,
        tokenHash,
        scopes: (input.scopes ?? []) as never,
        expiresAt: input.expiresAt ?? null,
      },
    });

    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: input.scopes ?? [],
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      /** Raw token — show once, never persist client-side beyond display. */
      token,
    };
  }

  listMine(userId: string) {
    return this.db.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(userId: string, id: string) {
    const row = await this.db.apiKey.findUnique({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('API key not found');
    }
    return this.db.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Used by the ApiKeyGuard: take a `pak_<prefix>_<secret>` token, look up by
   * prefix, bcrypt-compare against the hash. Records `lastUsedAt`.
   */
  async authenticate(rawToken: string) {
    const parts = rawToken.split('_');
    if (parts.length !== 3 || parts[0] !== 'pak') return null;
    const prefix = `${parts[0]}_${parts[1]}`;
    const row = await this.db.apiKey.findUnique({ where: { prefix } });
    if (!row || row.revokedAt) return null;
    if (row.expiresAt && row.expiresAt < new Date()) return null;
    const ok = await bcrypt.compare(rawToken, row.tokenHash);
    if (!ok) return null;
    // Fire-and-forget update of lastUsedAt.
    this.db.apiKey
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return {
      userId: row.userId,
      orgId: row.orgId,
      scopes: (row.scopes as string[]) ?? [],
    };
  }
}
