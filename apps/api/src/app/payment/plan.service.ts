import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PlanService {
  constructor(private readonly db: DatabaseService) {}

  async getAllPlans() {
    const plans = await this.db.plan.findMany({
      where: { active: true },
      include: { features: true },
      orderBy: { price: 'asc' },
    });
    if (plans.length === 0) throw new NotFoundException('No plans available');
    return plans;
  }

  async getPlanById(id: string) {
    return this.db.plan.findUniqueOrThrow({
      where: { id },
      include: { features: true },
    });
  }

  async getFreePlanId(): Promise<string> {
    const plan = await this.db.plan.findFirst({
      where: { price: 0 },
      select: { id: true },
    });
    if (!plan) throw new NotFoundException('Free plan not configured');
    return plan.id;
  }
}
