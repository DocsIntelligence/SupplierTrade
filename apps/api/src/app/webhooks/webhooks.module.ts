import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrgModule } from '../org/org.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksProcessor } from './webhooks.processor';
import { WebhooksService, WEBHOOKS_QUEUE_ENABLED } from './webhooks.service';

/**
 * Wires the BullMQ `webhooks` queue when REDIS_URL is set. Without Redis,
 * delivery falls back to a fire-and-forget sync HTTP call inside the service —
 * fine for dev, not for prod scale.
 */
@Module({})
export class WebhooksModule {
  static forRootAsync(): DynamicModule {
    return {
      module: WebhooksModule,
      imports: [
        OrgModule,
        BullModule.registerQueueAsync({
          name: 'webhooks',
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            // BullModule reads connection from the global BullModule.forRoot in
            // mail.module.ts. If REDIS_URL is missing the queue stays inert.
          }),
        }),
      ],
      controllers: [WebhooksController],
      providers: [
        WebhooksService,
        WebhooksProcessor,
        {
          provide: WEBHOOKS_QUEUE_ENABLED,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => Boolean(config.get<string>('REDIS_URL')),
        },
      ],
      exports: [WebhooksService],
    };
  }
}
