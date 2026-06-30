import { SetMetadata } from '@nestjs/common';

export const AUDIT_META = 'audit:meta';

export interface AuditMeta {
  action: string;
  targetType?: string;
  /** Pluck the target id from the request — default: `params.id`. */
  targetIdFrom?: (req: { params?: Record<string, string>; body?: Record<string, unknown> }) => string | undefined;
}

/**
 * Tag a controller handler so the AuditInterceptor records its invocation
 * to the audit log on success. The actor is the authenticated user.
 *
 *   @Audit({ action: 'plan.create', targetType: 'plan' })
 *   @Post('plans') create(...) { ... }
 */
export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_META, meta);
