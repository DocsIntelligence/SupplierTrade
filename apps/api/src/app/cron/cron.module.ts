import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronController } from './cron.controller';
import { CronJobs } from './cron.jobs';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CronController],
  providers: [CronJobs],
  exports: [CronJobs],
})
export class CronModule {}
