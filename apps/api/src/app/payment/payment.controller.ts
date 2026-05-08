import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { User } from '@org/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlanService } from './plan.service';
import { RazorpayService } from './razorpay.service';
import {
  checkoutSchema,
  verifyPaymentSchema,
  type CheckoutDto,
  type VerifyPaymentDto,
} from './payment.dto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly planService: PlanService,
    private readonly razorpay: RazorpayService,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all active plans' })
  getPlans() {
    return this.planService.getAllPlans();
  }

  @Get('gateway')
  @Public()
  @ApiOperation({ summary: 'Get payment gateway info' })
  getGateway() {
    return {
      razorpay: this.razorpay.isEnabled(),
      stripe: false, // Future
    };
  }

  @Post('checkout')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create checkout order/subscription' })
  createCheckout(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutDto,
  ) {
    return this.razorpay.createOrder(user.id, body.planId);
  }

  @Post('verify')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Verify payment after Razorpay success' })
  verifyPayment(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) body: VerifyPaymentDto,
  ) {
    return this.razorpay.verifyPayment(user.id, body);
  }

  @Post('webhook/razorpay')
  @Public()
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  async razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: unknown,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body unavailable — rawBody must be enabled');
    }
    await this.razorpay.handleWebhook(signature, req.rawBody, body);
    return { ok: true };
  }
}
