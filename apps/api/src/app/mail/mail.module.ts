import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { MailTransport } from './mail.transport';

const MAIL_QUEUE_ENABLED = 'MAIL_QUEUE_ENABLED';

@Global()
@Module({})
export class MailModule {
  private static readonly logger = new Logger(MailModule.name);

  static forRoot(): DynamicModule {
    return {
      module: MailModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: MAIL_QUEUE_ENABLED,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            return !!config.get<string>('REDIS_URL');
          },
        },
        MailTransport,
        MailService,
        MailProcessor,
      ],
      exports: [MailService, MAIL_QUEUE_ENABLED],
    };
  }

  static forRootAsync(): DynamicModule {
    const redisUrl = process.env['REDIS_URL'];

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set — mail queue disabled. Emails will be sent synchronously.',
      );
      return {
        module: MailModule,
        global: true,
        providers: [
          { provide: MAIL_QUEUE_ENABLED, useValue: false },
          MailTransport,
          MailService,
          MailProcessor,
        ],
        exports: [MailService, MAIL_QUEUE_ENABLED],
      };
    }

    return {
      module: MailModule,
      global: true,
      imports: [
        BullModule.forRoot({ connection: { url: redisUrl } }),
        BullModule.registerQueue({ name: 'mail' }),
      ],
      providers: [
        { provide: MAIL_QUEUE_ENABLED, useValue: true },
        MailTransport,
        MailService,
        MailProcessor,
      ],
      exports: [MailService, MAIL_QUEUE_ENABLED],
    };
  }
}
