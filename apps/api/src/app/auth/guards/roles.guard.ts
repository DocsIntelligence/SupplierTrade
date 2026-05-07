import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User, UserRole } from '@org/dto';
import { ErrorMessage } from '@org/utils';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as User | undefined;
    if (!user) throw new ForbiddenException(ErrorMessage.Forbidden);
    if (!required.includes(user.role))
      throw new ForbiddenException(ErrorMessage.Forbidden);
    return true;
  }
}
