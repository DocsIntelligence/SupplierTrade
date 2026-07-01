import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { QcService } from './qc.service';
import { QcController } from './qc.controller';

@Module({
  imports: [PlatformModule],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
