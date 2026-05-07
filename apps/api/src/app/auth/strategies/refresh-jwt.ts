import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ErrorMessage } from '@org/utils';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import type { JwtPayload } from './jwt';

/**
 * Extracts refresh token from:
 * 1. Cookie (cross-subdomain flow)
 * 2. Request body (legacy/mobile flow)
 */
const extractRefreshJwt = (req: Request): string | null => {
  const fromCookie = req?.cookies?.['refresh_token'] as string | undefined;
  if (fromCookie) return fromCookie;
  return (
    (req?.body as { refreshToken?: string } | undefined)?.refreshToken ?? null
  );
};

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshJwt]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      return await this.users.findById(payload.sub);
    } catch {
      throw new UnauthorizedException(ErrorMessage.Unauthorized);
    }
  }
}
