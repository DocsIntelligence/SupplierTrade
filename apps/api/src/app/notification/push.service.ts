import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { DatabaseService } from '../database/database.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Web Push (VAPID) sender. No-ops when VAPID keys aren't configured, so the
 * rest of the app works without push. Dead subscriptions (404/410) are pruned.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    const pub = config.get<string>('VAPID_PUBLIC_KEY');
    const priv = config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      config.get<string>('VAPID_SUBJECT') || 'mailto:admin@example.com';
    if (pub && priv) {
      webpush.setVapidDetails(subject, pub, priv);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys not set — web push disabled');
    }
  }

  get publicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }

  async subscribe(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string }; ua?: string },
  ): Promise<void> {
    await this.db.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        ua: sub.ua,
      },
      update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, ua: sub.ua },
    });
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.db.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const subs = await this.db.pushSubscription.findMany({ where: { userId } });
    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await this.db.pushSubscription
              .delete({ where: { id: s.id } })
              .catch(() => undefined);
          } else {
            this.logger.debug(`push failed: ${(e as Error).message}`);
          }
        }
      }),
    );
  }
}
