import { z } from 'zod';

export const checkoutSchema = z.object({
  planId: z.string().min(1, 'planId is required'),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;

export const verifyPaymentSchema = z
  .object({
    razorpay_payment_id: z.string().min(1),
    razorpay_order_id: z.string().min(1).optional(),
    razorpay_subscription_id: z.string().min(1).optional(),
    razorpay_signature: z.string().min(1),
  })
  .refine(
    (v) => Boolean(v.razorpay_order_id) || Boolean(v.razorpay_subscription_id),
    {
      message:
        'Either razorpay_order_id or razorpay_subscription_id is required',
    },
  );
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
