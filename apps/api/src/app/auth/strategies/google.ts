import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env['GOOGLE_CLIENT_ID'] ?? 'missing',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? 'missing',
      callbackURL:
        process.env['GOOGLE_CALLBACK_URL'] ??
        'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos } = profile;
    const user = {
      providerId: id,
      provider: 'google' as const,
      name: displayName,
      email: emails?.[0]?.value,
      picture: photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
