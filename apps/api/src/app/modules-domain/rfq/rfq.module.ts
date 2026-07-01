import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [PlatformModule],
  controllers: [RfqController],
  providers: [RfqService, MatchingService],
  exports: [RfqService],
})
export class RfqModule {}
