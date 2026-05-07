import { createHmac } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { PlanService } from './plan.service';
import { WalletService } from './wallet.service';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;
  private readonly webhookSecret: string;
  private readonly keySecret: string;
  private readonly enabled: boolean;

  constructor(
    private readonly db: DatabaseService,
    private readonly planService: PlanService,
    private readonly walletService: WalletService,
    private readonly config: ConfigService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
    this.keySecret = keySecret ?? '';
    this.enabled = Boolean(keyId && keySecret);

    if (this.enabled) {
      // Dynamic import to avoid crash if razorpay not installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        this.logger.log('Razorpay initialized');
      } catch {
        this.logger.warn('Razorpay package not installed — payment disabled');
        this.enabled = false;
      }
    } else {
      this.logger.warn(
        'Razorpay not configured — RAZORPAY_KEY_ID/SECRET missing',
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async createOrder(userId: string, planId: string) {
    if (!this.enabled)
      throw new BadRequestException('Payment gateway not configured');

    const plan = await this.planService.getPlanById(planId);
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (plan.type === 'subscription' && plan.gatewayPlanId) {
      // Create subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: plan.gatewayPlanId,
        quantity: 1,
        total_count: plan.totalCycleCount ?? 12,
        notes: { appUserId: userId, appPlanId: planId },
      });
      return {
        type: 'subscription',
        subscriptionId: subscription.id,
        ...subscription,
      };
    }

    // Create one-time order
    const order = await this.razorpay.orders.create({
      amount: plan.price * plan.priceMultiplier,
      currency: plan.currency,
      payment_capture: true,
      notes: { appUserId: userId, appUserEmail: user.email, appPlanId: planId },
    });

    return {
      type: 'order',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  }

  async verifyPayment(body: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature: string;
  }) {
    if (!this.enabled)
      throw new BadRequestException('Payment gateway not configured');

    // Verify signature
    const signatureBody = body.razorpay_order_id
      ? `${body.razorpay_order_id}|${body.razorpay_payment_id}`
      : `${body.razorpay_payment_id}|${body.razorpay_subscription_id}`;

    const expected = createHmac('sha256', this.keySecret)
      .update(signatureBody)
      .digest('hex');
    if (expected !== body.razorpay_signature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    // Fetch payment details
    const paymentDetails = await this.razorpay.payments.fetch(
      body.razorpay_payment_id,
    );
    const { appPlanId, appUserId } = (paymentDetails.notes ?? {}) as {
      appPlanId?: string;
      appUserId?: string;
    };

    if (!appPlanId || !appUserId)
      throw new BadRequestException('Payment notes missing');

    // Idempotency
    const existing = await this.db.payment.findFirst({
      where: { gatewayPaymentId: paymentDetails.id },
    });
    if (existing) return { verified: true };

    // Create payment record
    const payment = await this.db.payment.create({
      data: {
        gateway: 'razorpay',
        gatewayPaymentId: paymentDetails.id,
        gatewayOrderId: paymentDetails.order_id ?? '',
        gatewaySubscriptionId: body.razorpay_subscription_id ?? '',
        status: 'completed',
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        initiatedAt: new Date(paymentDetails.created_at * 1000),
        confirmedAt: new Date(),
        userId: appUserId,
      },
    });

    // Activate wallet
    await this.walletService.createWallet(appUserId, appPlanId, payment.id);
    return { verified: true };
  }

  async handleWebhook(signature: string, rawBody: Buffer, body: any) {
    if (!this.enabled) return;
    if (!this.webhookSecret) {
      throw new BadRequestException(
        'Webhook secret not configured (RAZORPAY_WEBHOOK_SECRET)',
      );
    }

    const hash = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (hash !== signature)
      throw new BadRequestException('Invalid webhook signature');

    if (body.event === 'payment.captured') {
      const payment = body.payload?.payment?.entity;
      if (!payment?.notes?.appPlanId || !payment?.notes?.appUserId) return;

      const existing = await this.db.payment.findFirst({
        where: { gatewayPaymentId: payment.id },
      });
      if (existing) return; // Already processed

      const record = await this.db.payment.create({
        data: {
          gateway: 'razorpay',
          gatewayPaymentId: payment.id,
          gatewayOrderId: payment.order_id ?? '',
          status: 'completed',
          amount: payment.amount,
          currency: payment.currency,
          initiatedAt: new Date(payment.created_at * 1000),
          confirmedAt: new Date(),
          userId: payment.notes.appUserId,
        },
      });

      await this.walletService.createWallet(
        payment.notes.appUserId,
        payment.notes.appPlanId,
        record.id,
      );
    }
  }
}
