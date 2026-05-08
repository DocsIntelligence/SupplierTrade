import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Provider } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

interface OAuthProfile {
  provider: Provider;
  providerAccountId: string;
  email: string;
  name?: string;
  picture?: string;
  preferredUsername?: string;
}

@Injectable()
export class UserIdentityService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Race-safe OAuth user resolution.
   * Tries: existing identity → link to existing user (by email) → create new.
   * Retries the chain once on P2002 to handle concurrent callbacks for the
   * same email or providerAccountId.
   */
  async findOrCreateFromOAuth(
    profile: OAuthProfile,
    maxAttempts = 2,
  ): Promise<{ id: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 1. Existing identity?
      const existing = await this.db.userIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        select: { userId: true },
      });
      if (existing) return { id: existing.userId };

      // 2. Existing user with same email — link.
      const byEmail = await this.db.user.findUnique({
        where: { email: profile.email },
        select: { id: true },
      });
      if (byEmail) {
        try {
          await this.db.userIdentity.create({
            data: {
              userId: byEmail.id,
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              email: profile.email,
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            // Concurrent callback already linked this identity — retry the lookup.
            continue;
          }
          throw err;
        }
        return { id: byEmail.id };
      }

      // 3. Brand new user.
      try {
        const baseUsername =
          profile.preferredUsername ?? profile.email.split('@')[0];
        const user = await this.db.user.create({
          data: {
            name: profile.name ?? baseUsername,
            email: profile.email,
            username: `${baseUsername}-${Date.now().toString(36)}`,
            picture: profile.picture,
            provider: profile.provider,
            emailVerified: true,
            secrets: { create: {} },
            identities: {
              create: {
                provider: profile.provider,
                providerAccountId: profile.providerAccountId,
                email: profile.email,
              },
            },
          },
          select: { id: true },
        });
        return user;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // Concurrent callback won the race — loop and pick up the existing user.
          continue;
        }
        throw err;
      }
    }
    throw new Error('OAuth user resolution failed after retries');
  }

  async listForUser(userId: string) {
    return this.db.userIdentity.findMany({
      where: { userId },
      select: { id: true, provider: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async unlinkForUser(userId: string, identityId: string) {
    const identity = await this.db.userIdentity.findFirst({
      where: { id: identityId, userId },
    });
    if (!identity) throw new NotFoundException('Identity not found');

    // Check user still has another way to sign in
    const [otherCount, secrets] = await Promise.all([
      this.db.userIdentity.count({
        where: { userId, NOT: { id: identityId } },
      }),
      this.db.secrets.findUnique({
        where: { userId },
        select: { password: true },
      }),
    ]);

    if (!secrets?.password && otherCount === 0) {
      throw new BadRequestException(
        'Cannot unlink last auth method. Set a password first.',
      );
    }

    await this.db.userIdentity.delete({ where: { id: identityId } });
    return { message: 'Provider disconnected' };
  }
}
