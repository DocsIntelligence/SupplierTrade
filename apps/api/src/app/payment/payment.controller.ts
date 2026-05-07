import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanService } from './plan.service';
import { RazorpayService } from './razorpay.service';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create checkout order/subscription' })
  createCheckout(@CurrentUser() user: User, @Body('planId') planId: string) {
    return this.razorpay.createOrder(user.id, planId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Verify payment after Razorpay success' })
  verifyPayment(@Body() body: any) {
    return this.razorpay.verifyPayment(body);
  }

  @Post('webhook/razorpay')
  @Public()
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  async razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('X-Razorpay-Signature') signature: string,
    @Body() body: any,
  ) {
    await this.razorpay.handleWebhook(signature, req.rawBody!, body);
    return { ok: true };
  }
}
