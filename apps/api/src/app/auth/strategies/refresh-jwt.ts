import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ErrorMessage } from '@org/utils';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import type { JwtPayload } from './jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.body as { refreshToken?: string } | undefined)?.refreshToken ??
          null,
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    try {
      const user = await this.users.findById(payload.sub);
      const refreshToken = (req.body as { refreshToken?: string })
        ?.refreshToken;
      if (!refreshToken) throw new UnauthorizedException();
      return { ...user, refreshToken };
    } catch {
      throw new UnauthorizedException(ErrorMessage.Unauthorized);
    }
  }
}
