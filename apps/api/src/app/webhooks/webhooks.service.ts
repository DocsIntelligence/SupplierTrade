import { createHmac, randomBytes } from 'crypto';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DatabaseService } from '../database/database.service';

export const WEBHOOKS_QUEUE_ENABLED = 'WEBHOOKS_QUEUE_ENABLED';

export interface DispatchInput {
  event: string;
  payload: Record<string, unknown>;
  /** Restrict to one org's endpoints; undefined = all endpoints subscribed to the event. */
  orgId?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() @InjectQueue('webhooks') private readonly queue: Queue | null,
    @Inject(WEBHOOKS_QUEUE_ENABLED) private readonly queueEnabled: boolean,
  ) {}

  // ─── endpoint CRUD ─────────────────────────────────────────────

  list(orgId: string) {
    return this.db.webhookEndpoint.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, url: string, events: string[]) {
    const secret = randomBytes(32).toString('hex');
    return this.db.webhookEndpoint.create({
      data: { orgId, url, secret, events: events as never, active: true },
    });
  }

  async toggle(id: string, active: boolean) {
    return this.db.webhookEndpoint.update({ where: { id }, data: { active } });
  }

  async remove(id: string) {
    return this.db.webhookEndpoint.delete({ where: { id } });
  }

  async deliveries(endpointId: string) {
    return this.db.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ─── dispatch ──────────────────────────────────────────────────

  async dispatch(input: DispatchInput) {
    const endpoints = await this.db.webhookEndpoint.findMany({
      where: { active: true, orgId: input.orgId ?? undefined },
    });
    const matching = endpoints.filter((e) => {
      const events = (e.events as string[]) ?? [];
      return events.includes('*') || events.includes(input.event);
    });

    await Promise.all(
      matching.map((e) =>
        this.enqueueDelivery(e.id, input.event, input.payload),
      ),
    );
    return { dispatched: matching.length };
  }

  private async enqueueDelivery(
    endpointId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const delivery = await this.db.webhookDelivery.create({
      data: {
        endpointId,
        event,
        payload: payload as never,
        status: 'pending',
        attempt: 0,
      },
    });

    if (this.queueEnabled && this.queue) {
      await this.queue.add(
        'deliver',
        { deliveryId: delivery.id },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } else {
      // Best-effort sync — production should set REDIS_URL.
      void this.deliverNow(delivery.id).catch((e) =>
        this.logger.warn(`webhook sync send failed: ${(e as Error).message}`),
      );
    }
  }

  // ─── delivery (called by processor or sync fallback) ───────────

  async deliverNow(deliveryId: string) {
    const row = await this.db.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!row) return;

    const body = JSON.stringify(row.payload);
    const signature = createHmac('sha256', row.endpoint.secret)
      .update(body)
      .digest('hex');

    const attempt = row.attempt + 1;
    try {
      const res = await fetch(row.endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': row.event,
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Delivery': row.id,
        },
        body,
      });
      const responseBody = await res.text().catch(() => null);
      const ok = res.ok;
      await this.db.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: ok ? 'success' : 'failed',
          attempt,
          responseStatus: res.status,
          responseBody: responseBody?.slice(0, 4000) ?? null,
          deliveredAt: ok ? new Date() : null,
        },
      });
      if (!ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      const msg = (e as Error).message;
      await this.db.webhookDelivery.update({
        where: { id: row.id },
        data: { status: 'failed', attempt, responseBody: msg.slice(0, 4000) },
      });
      throw e;
    }
  }
}
