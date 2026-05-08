import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';
import { UserIdentityService } from '../user-identity.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly users: UsersService,
    private readonly identities: UserIdentityService,
    config: ConfigService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
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
      if (!email) throw new BadRequestException('No email from Google');

      const { id } = await this.identities.findOrCreateFromOAuth({
        provider: 'google',
        providerAccountId: profile.id,
        email,
        name: profile.displayName,
        picture: profile.photos?.[0]?.value,
      });
      done(null, await this.users.findById(id));
    } catch (error) {
      done(error as Error);
    }
  }
}
