import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-github2';
import { UsersService } from '../../users/users.service';
import { UserIdentityService } from '../user-identity.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly users: UsersService,
    private readonly identities: UserIdentityService,
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
    _req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err?: Error | null, user?: Express.User) => void,
  ) {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) throw new BadRequestException('No email from GitHub');

      const { id } = await this.identities.findOrCreateFromOAuth({
        provider: 'github',
        providerAccountId: profile.id,
        email,
        name: profile.displayName,
        picture: profile.photos?.[0]?.value,
        preferredUsername: profile.username,
      });
      done(null, await this.users.findById(id));
    } catch (error) {
      done(error as Error);
    }
  }
}
