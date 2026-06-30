import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  controllers: [NotificationController, PushController],
  providers: [NotificationService, PushService],
  exports: [NotificationService, PushService],
})
export class NotificationModule {}
