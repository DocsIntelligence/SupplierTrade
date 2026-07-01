import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { VerificationEngineService } from './verification-engine.service';
import { VerificationEngineController } from './verification-engine.controller';

@Module({
  imports: [PlatformModule],
  controllers: [VerificationEngineController],
  providers: [VerificationEngineService],
  exports: [VerificationEngineService],
})
export class VerificationEngineModule {}
