import { Injectable, Logger } from '@nestjs/common';
import { Feature } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WalletUsageService {
  private readonly logger = new Logger(WalletUsageService.name);

  constructor(private readonly db: DatabaseService) {}

  async trackUsage(userId: string, feature: Feature, quantity = 1) {
    const wallet = await this.db.userWallet.findUnique({ where: { userId } });
    if (!wallet) return;

    try {
      await this.db.walletUsage.update({
        where: {
          name_userWalletId: { name: feature, userWalletId: wallet.id },
        },
        data: { consumed: { increment: quantity } },
      });
    } catch (error) {
      this.logger.error(`Failed to track usage for ${feature}`, error);
    }
  }

  async checkQuota(userId: string, feature: Feature): Promise<boolean> {
    const wallet = await this.db.userWallet.findUnique({
      where: { userId },
      include: { usage: true },
    });
    if (!wallet) return false;

    const usage = wallet.usage.find((u) => u.name === feature);
    if (!usage) return false;
    if (usage.quantity === -1) return true; // unlimited
    return usage.consumed < usage.quantity;
  }
}
