import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { OrgModule } from '../org/org.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksProcessor } from './webhooks.processor';
import { WebhooksService, WEBHOOKS_QUEUE_ENABLED } from './webhooks.service';

/**
 * Wires the BullMQ `webhooks` queue when `REDIS_URL` is set. Without Redis,
 * we register NO BullMQ pieces (no queue, no processor, no BULLMQ_CONFIG) —
 * the service still works and just runs deliveries synchronously via fetch.
 *
 * Mirrors `MailModule.forRootAsync()` exactly so behaviour is consistent.
 */
@Module({})
export class WebhooksModule {
  private static readonly logger = new Logger(WebhooksModule.name);

  static forRootAsync(): DynamicModule {
    const redisUrl = process.env['REDIS_URL'];

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set — webhook delivery will run synchronously (no retries).',
      );
      return {
        module: WebhooksModule,
        imports: [OrgModule],
        controllers: [WebhooksController],
        providers: [
          { provide: WEBHOOKS_QUEUE_ENABLED, useValue: false },
          WebhooksService,
        ],
        exports: [WebhooksService],
      };
    }

    return {
      module: WebhooksModule,
      imports: [OrgModule, BullModule.registerQueue({ name: 'webhooks' })],
      controllers: [WebhooksController],
      providers: [
        { provide: WEBHOOKS_QUEUE_ENABLED, useValue: true },
        WebhooksService,
        WebhooksProcessor,
      ],
      exports: [WebhooksService],
    };
  }
}
