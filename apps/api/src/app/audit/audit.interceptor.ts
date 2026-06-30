import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_META, type AuditMeta } from './audit.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(
      AUDIT_META,
      ctx.getHandler(),
    );
    if (!meta) return next.handle();

    const req = ctx.switchToHttp().getRequest<{
      user?: { id?: string };
      headers: Record<string, string | undefined>;
      params?: Record<string, string>;
      body?: Record<string, unknown>;
      ip?: string;
    }>();

    return next.handle().pipe(
      tap((result) => {
        const targetId =
          meta.targetIdFrom?.(req) ??
          req.params?.id ??
          (typeof result === 'object' && result !== null && 'id' in (result as object)
            ? ((result as { id: string }).id)
            : undefined);

        void this.audit.record({
          actorId: req.user?.id ?? null,
          action: meta.action,
          targetType: meta.targetType ?? null,
          targetId: targetId ?? null,
          after: result ?? null,
          ip: req.ip ?? null,
          ua: req.headers['user-agent'] ?? null,
        });
      }),
    );
  }
}
