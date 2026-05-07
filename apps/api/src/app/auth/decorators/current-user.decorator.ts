import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '@org/dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);
