import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-github2';
import { UsersService } from '../../users/users.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly users: UsersService,
    private readonly db: DatabaseService,
    config: ConfigService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err?: Error | null, user?: Express.User) => void,
  ) {
    try {
      const { displayName, emails, photos, id: providerAccountId } = profile;
      const email = emails?.[0]?.value?.toLowerCase();
      const picture = photos?.[0]?.value;

      if (!email) throw new BadRequestException('No email from GitHub');

      // Check if identity already exists
      const existing = await this.db.userIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'github',
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (existing) {
        done(null, await this.users.findById(existing.userId));
        return;
      }

      // Check if user with this email exists (link flow)
      const byEmail = await this.db.user.findUnique({ where: { email } });
      if (byEmail) {
        await this.db.userIdentity.create({
          data: {
            userId: byEmail.id,
            provider: 'github',
            providerAccountId,
            email,
          },
        });
        done(null, await this.users.findById(byEmail.id));
        return;
      }

      // Create new user
      const username = profile.username ?? email.split('@')[0];
      const user = await this.db.user.create({
        data: {
          name: displayName ?? username,
          email,
          username: `${username}-${Date.now().toString(36)}`,
          picture,
          provider: 'github',
          emailVerified: true,
          secrets: { create: {} },
          identities: {
            create: { provider: 'github', providerAccountId, email },
          },
        },
      });

      done(null, await this.users.findById(user.id));
    } catch (error) {
      done(error as Error);
    }
  }
}
