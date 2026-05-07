import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { User } from '@org/dto';
import { ErrorMessage } from '@org/utils';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Extracts JWT from cookie first, then falls back to Authorization header.
 * This allows both cookie-based (web/app subdomains) and header-based (mobile/API) auth.
 */
const extractJwt = (req: Request): string | null => {
  const fromCookie = req?.cookies?.['access_token'] as string | undefined;
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      return await this.users.findById(payload.sub);
    } catch {
      throw new UnauthorizedException(ErrorMessage.Unauthorized);
    }
  }
}
