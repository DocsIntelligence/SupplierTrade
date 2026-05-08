-- AlterTable: add reset-token expiry
ALTER TABLE "Secrets" ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);

-- AlterTable: enforce idempotency on payment ids
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");
