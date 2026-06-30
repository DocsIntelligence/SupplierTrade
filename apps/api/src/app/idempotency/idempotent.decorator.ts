import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_META = 'idempotent:meta';

export interface IdempotentOptions {
  /** TTL of the cached response in seconds (default 86_400 = 24h). */
  ttlSeconds?: number;
}

/**
 * Mark a handler as idempotent. Combined with `IdempotencyInterceptor`,
 * a request with header `Idempotency-Key: <uuid>` that re-uses the same key
 * within TTL returns the original response instead of executing the handler.
 *
 *   @Idempotent()
 *   @Post('payments') createPayment(...) { ... }
 */
export const Idempotent = (opts: IdempotentOptions = {}) =>
  SetMetadata(IDEMPOTENT_META, opts);
