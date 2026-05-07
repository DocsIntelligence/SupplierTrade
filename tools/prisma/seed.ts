import {
  PrismaClient,
  PaymentType,
  PlanInterval,
  Currency,
  Feature,
  FeatureAction,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Free plan (inactive — assigned on wallet expiry)
  await prisma.plan.upsert({
    where: { id: 'free-plan' },
    update: {},
    create: {
      id: 'free-plan',
      name: 'Free',
      description: 'Basic access with limited features',
      type: PaymentType.one_time,
      duration: 30,
      interval: PlanInterval.daily,
      price: 0,
      currency: Currency.INR,
      active: false,
      features: {
        create: [
          { name: Feature.documents, action: FeatureAction.reset, quantity: 1 },
          {
            name: Feature.ai_tokens,
            action: FeatureAction.reset,
            quantity: 1000,
          },
          {
            name: Feature.ai_attempts,
            action: FeatureAction.reset,
            quantity: 5,
          },
          {
            name: Feature.storage_mb,
            action: FeatureAction.reset,
            quantity: 50,
          },
          {
            name: Feature.api_calls,
            action: FeatureAction.reset,
            quantity: 100,
          },
        ],
      },
    },
  });

  // Pro Monthly
  await prisma.plan.upsert({
    where: { id: 'pro-monthly' },
    update: {},
    create: {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      description: 'Unlimited access, billed monthly',
      type: PaymentType.subscription,
      duration: 1,
      interval: PlanInterval.monthly,
      price: 499,
      originalPrice: 999,
      discountLabel: '50% OFF',
      priceMultiplier: 100,
      currency: Currency.INR,
      active: true,
      features: {
        create: [
          {
            name: Feature.documents,
            action: FeatureAction.reset,
            quantity: -1,
          },
          {
            name: Feature.ai_tokens,
            action: FeatureAction.reset,
            quantity: 50000,
          },
          {
            name: Feature.ai_attempts,
            action: FeatureAction.reset,
            quantity: -1,
          },
          {
            name: Feature.storage_mb,
            action: FeatureAction.reset,
            quantity: 500,
          },
          {
            name: Feature.api_calls,
            action: FeatureAction.reset,
            quantity: -1,
          },
        ],
      },
    },
  });

  // Pro Yearly
  await prisma.plan.upsert({
    where: { id: 'pro-yearly' },
    update: {},
    create: {
      id: 'pro-yearly',
      name: 'Pro Yearly',
      description: 'Unlimited access, billed annually',
      type: PaymentType.subscription,
      duration: 1,
      interval: PlanInterval.yearly,
      price: 3999,
      originalPrice: 11988,
      discountLabel: '67% OFF',
      priceMultiplier: 100,
      currency: Currency.INR,
      active: true,
      features: {
        create: [
          {
            name: Feature.documents,
            action: FeatureAction.reset,
            quantity: -1,
          },
          {
            name: Feature.ai_tokens,
            action: FeatureAction.reset,
            quantity: -1,
          },
          {
            name: Feature.ai_attempts,
            action: FeatureAction.reset,
            quantity: -1,
          },
          {
            name: Feature.storage_mb,
            action: FeatureAction.reset,
            quantity: 2000,
          },
          {
            name: Feature.api_calls,
            action: FeatureAction.reset,
            quantity: -1,
          },
        ],
      },
    },
  });

  console.log('✅ Plans seeded');

  // ─── Lookups ────────────────────────────────────────────────────────────
  const { lookupGroups } = await import('./seed-data/lookups');

  for (const group of lookupGroups) {
    const existing = await prisma.lookupGroup.findUnique({
      where: { key: group.key },
      include: { values: true },
    });

    if (!existing) {
      await prisma.lookupGroup.create({
        data: {
          key: group.key,
          name: group.name,
          description: group.description,
          isPublic: true,
          values: { create: group.values },
        },
      });
      console.log(
        `  ✓ Created lookup "${group.key}" (${group.values.length} values)`,
      );
      continue;
    }

    const existingValues = new Set(existing.values.map((v) => v.value));
    const newValues = group.values.filter((v) => !existingValues.has(v.value));

    if (newValues.length > 0) {
      await prisma.lookupValue.createMany({
        data: newValues.map((v) => ({ groupId: existing.id, ...v })),
        skipDuplicates: true,
      });
      console.log(
        `  ✓ Lookup "${group.key}" — added ${newValues.length} new values`,
      );
    } else {
      console.log(`  ✓ Lookup "${group.key}" — up to date`);
    }
  }

  console.log('✅ Lookups seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
