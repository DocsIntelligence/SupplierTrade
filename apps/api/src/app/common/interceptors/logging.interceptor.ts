import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - started;
          this.logger.log(
            `${req.method} ${req.url} ${context.switchToHttp().getResponse().statusCode} +${elapsed}ms`,
          );
        },
        error: (err: unknown) => {
          const elapsed = Date.now() - started;
          this.logger.warn(
            `${req.method} ${req.url} -> error +${elapsed}ms: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      }),
    );
  }
}
