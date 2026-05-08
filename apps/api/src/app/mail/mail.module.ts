import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { MailTransport } from './mail.transport';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          return { connection: { url: redisUrl } };
        }
        // Fallback: in-memory-like config (localhost Redis, will warn if unavailable)
        return {
          connection: { host: 'localhost', port: 6379 },
        };
      },
    }),
    BullModule.registerQueue({ name: 'mail' }),
  ],
  providers: [MailService, MailProcessor, MailTransport],
  exports: [MailService],
})
export class MailModule {}
