import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { VerificationAdminController } from './verification-admin.controller';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [StorageModule],
  controllers: [VerificationController, VerificationAdminController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
