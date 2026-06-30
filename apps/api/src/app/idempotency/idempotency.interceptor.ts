import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { IDEMPOTENT_META, type IdempotentOptions } from './idempotent.decorator';

const DEFAULT_TTL = 24 * 3600;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const opts = this.reflector.get<IdempotentOptions | undefined>(
      IDEMPOTENT_META,
      ctx.getHandler(),
    );
    if (!opts) return next.handle();

    const req = ctx.switchToHttp().getRequest<{
      method: string;
      url: string;
      headers: Record<string, string | undefined>;
      user?: { id?: string };
    }>();
    const key = req.headers['idempotency-key'];
    if (!key) {
      throw new BadRequestException(
        'Idempotency-Key header is required for this endpoint',
      );
    }

    const ttl = opts.ttlSeconds ?? DEFAULT_TTL;

    return from(
      this.db.idempotencyKey.findUnique({ where: { key } }),
    ).pipe(
      switchMap((cached) => {
        if (cached && cached.expiresAt > new Date()) {
          // Replay cached response.
          return of(cached.responseBody);
        }
        return next.handle().pipe(
          tap(async (result) => {
            try {
              await this.db.idempotencyKey.upsert({
                where: { key },
                create: {
                  key,
                  userId: req.user?.id ?? null,
                  method: req.method,
                  path: req.url,
                  responseStatus: 200,
                  responseBody: (result ?? null) as never,
                  expiresAt: new Date(Date.now() + ttl * 1000),
                },
                update: {
                  responseBody: (result ?? null) as never,
                  responseStatus: 200,
                  expiresAt: new Date(Date.now() + ttl * 1000),
                },
              });
            } catch {
              // Race: another request stored first — ignore.
            }
          }),
        );
      }),
    );
  }
}
