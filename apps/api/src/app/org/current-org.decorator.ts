import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolves the org id from `x-org-id` header (preferred) or `x-org-slug`.
 * The actual membership check is done by services via `OrgService.assertMember`.
 */
export const CurrentOrgId = createParamDecorator(
  (_data, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    return req.headers['x-org-id'];
  },
);
