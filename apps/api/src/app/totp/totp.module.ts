import { Module } from '@nestjs/common';
import { TotpController } from './totp.controller';
import { TotpService } from './totp.service';

@Module({
  controllers: [TotpController],
  providers: [TotpService],
  exports: [TotpService],
})
export class TotpModule {}
