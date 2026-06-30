import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PushService } from './push.service';

export interface NotifyInput {
  /**
   * Free-form notification category. Define your project's vocabulary in
   * `@org/utils` (e.g. "system", "billing", "verification", "broadcast").
   */
  type: string;
  title: string;
  body: string;
  link?: string;
}

/**
 * Creates in-app notifications + delivers them via Web Push when configured.
 *
 * Live socket delivery (bell badge while user is connected) is intentionally
 * left out of the boilerplate — wire it up in your project by injecting your
 * own gateway and emitting `notify:new` after `notify()` resolves.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly push: PushService,
  ) {}

  async notify(userId: string, input: NotifyInput) {
    const n = await this.db.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
    await this.push.sendToUser(userId, {
      title: input.title,
      body: input.body,
      url: input.link ?? '/',
      tag: input.type,
    });
    return n;
  }

  list(userId: string, take = 50) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await this.db.notification.count({
      where: { userId, readAt: null },
    });
    return { unread };
  }

  async markRead(userId: string, id?: string): Promise<{ ok: true }> {
    await this.db.notification.updateMany({
      where: { userId, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  /** Admin: notify every user (in-app row + push). */
  async broadcast(input: NotifyInput): Promise<{ sent: number }> {
    const users = await this.db.user.findMany({ select: { id: true } });
    await this.db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: input.type ?? 'broadcast',
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      })),
    });
    await Promise.all(
      users.map((u) =>
        this.push.sendToUser(u.id, {
          title: input.title,
          body: input.body,
          url: input.link ?? '/',
          tag: input.type ?? 'broadcast',
        }),
      ),
    );
    return { sent: users.length };
  }
}
