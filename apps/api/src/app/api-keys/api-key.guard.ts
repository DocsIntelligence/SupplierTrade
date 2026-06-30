import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

/**
 * Optional guard for machine-to-machine routes. Pairs with `@UseGuards(ApiKeyGuard)`
 * on a controller method to allow `Authorization: Bearer pak_<prefix>_<secret>`
 * in lieu of a JWT. Sets `req.user = { id, orgId, scopes }` on success.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly keys: ApiKeysService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: unknown;
    }>();
    const header = req.headers['authorization'] ?? '';
    const match = /^Bearer\s+(pak_\S+)$/.exec(header);
    if (!match) return false;
    const auth = await this.keys.authenticate(match[1]);
    if (!auth) return false;
    req.user = { id: auth.userId, orgId: auth.orgId, scopes: auth.scopes };
    return true;
  }
}
