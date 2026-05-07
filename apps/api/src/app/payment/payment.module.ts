import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { WalletController } from './wallet.controller';
import { PlanService } from './plan.service';
import { WalletService } from './wallet.service';
import { WalletUsageService } from './wallet-usage.service';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [PaymentController, WalletController],
  providers: [PlanService, WalletService, WalletUsageService, RazorpayService],
  exports: [PlanService, WalletService, WalletUsageService],
})
export class PaymentModule {}
