import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { User } from '@org/dto';
import { ErrorMessage } from '@org/utils';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly auth: AuthService) {
    super({ usernameField: 'identifier', passwordField: 'password' });
  }

  async validate(identifier: string, password: string): Promise<User> {
    const user = await this.auth.validateUser(identifier, password);
    if (!user) throw new UnauthorizedException(ErrorMessage.InvalidCredentials);
    return user;
  }
}
