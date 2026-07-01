import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Former enum columns are plain SQLite strings; allowed values mirror the
// const objects in `@org/utils` (libs/shared/utils/src/lib/enums.ts).

const prisma = new PrismaClient();

/**
 * Idempotently upsert a user with a bcrypt-hashed password. Reuses the same
 * shape `auth.service.register` produces (User + Secrets in one go).
 *
 * Handles a leftover row that already owns the desired `username` under a
 * different `email` by reassigning the email + role onto that row (rather than
 * crashing on the unique constraint).
 */
async function upsertUser(opts: {
  email: string;
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}) {
  const hash = await bcrypt.hash(opts.password, 10);

  const byEmail = await prisma.user.findUnique({ where: { email: opts.email } });
  const byUsername = await prisma.user.findUnique({ where: { username: opts.username } });

  let user;
  if (byEmail) {
    user = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        username: opts.username,
        name: opts.name,
        role: opts.role,
        emailVerified: true,
      },
    });
  } else if (byUsername) {
    // Someone else owns this username (likely a stale dev row) — rebrand it.
    user = await prisma.user.update({
      where: { id: byUsername.id },
      data: {
        email: opts.email,
        name: opts.name,
        role: opts.role,
        emailVerified: true,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: opts.email,
        username: opts.username,
        name: opts.name,
        role: opts.role,
        provider: 'email',
        emailVerified: true,
      },
    });
  }

  await prisma.secrets.upsert({
    where: { userId: user.id },
    update: { password: hash },
    create: { userId: user.id, password: hash },
  });
  console.log(`  ✓ User "${opts.email}" (role=${opts.role})`);
  return user;
}

async function main() {
  // Free plan (inactive — assigned on wallet expiry)
  await prisma.plan.upsert({
    where: { id: 'free-plan' },
    update: {},
    create: {
      id: 'free-plan',
      name: 'Free',
      description: 'Basic access with limited features',
      type: 'one_time',
      duration: 30,
      interval: 'daily',
      price: 0,
      currency: 'INR',
      active: false,
      features: {
        create: [
          { name: 'documents', action: 'reset', quantity: 1 },
          {
            name: 'ai_tokens',
            action: 'reset',
            quantity: 1000,
          },
          {
            name: 'ai_attempts',
            action: 'reset',
            quantity: 5,
          },
          {
            name: 'storage_mb',
            action: 'reset',
            quantity: 50,
          },
          {
            name: 'api_calls',
            action: 'reset',
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
      type: 'subscription',
      duration: 1,
      interval: 'monthly',
      price: 499,
      originalPrice: 999,
      discountLabel: '50% OFF',
      priceMultiplier: 100,
      currency: 'INR',
      active: true,
      features: {
        create: [
          {
            name: 'documents',
            action: 'reset',
            quantity: -1,
          },
          {
            name: 'ai_tokens',
            action: 'reset',
            quantity: 50000,
          },
          {
            name: 'ai_attempts',
            action: 'reset',
            quantity: -1,
          },
          {
            name: 'storage_mb',
            action: 'reset',
            quantity: 500,
          },
          {
            name: 'api_calls',
            action: 'reset',
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
      type: 'subscription',
      duration: 1,
      interval: 'yearly',
      price: 3999,
      originalPrice: 11988,
      discountLabel: '67% OFF',
      priceMultiplier: 100,
      currency: 'INR',
      active: true,
      features: {
        create: [
          {
            name: 'documents',
            action: 'reset',
            quantity: -1,
          },
          {
            name: 'ai_tokens',
            action: 'reset',
            quantity: -1,
          },
          {
            name: 'ai_attempts',
            action: 'reset',
            quantity: -1,
          },
          {
            name: 'storage_mb',
            action: 'reset',
            quantity: 2000,
          },
          {
            name: 'api_calls',
            action: 'reset',
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

    const existingByValue = new Map(existing.values.map((v) => [v.value, v]));
    const newValues = group.values.filter((v) => !existingByValue.has(v.value));

    if (newValues.length > 0) {
      // Note: newValues is already filtered to values not present, and
      // SQLite's createMany does not support `skipDuplicates`.
      await prisma.lookupValue.createMany({
        data: newValues.map((v) => ({ groupId: existing.id, ...v })),
      });
      console.log(
        `  ✓ Lookup "${group.key}" — added ${newValues.length} new values`,
      );
    } else {
      console.log(`  ✓ Lookup "${group.key}" — up to date`);
    }

    // Backfill i18n metadata onto existing values (idempotent) so localized
    // labels land even on lookups seeded before translations were added.
    for (const v of group.values) {
      const current = existingByValue.get(v.value);
      if (v.metadata && current && !current.metadata) {
        await prisma.lookupValue.update({
          where: { id: current.id },
          data: { metadata: v.metadata },
        });
      }
    }
  }

  console.log('✅ Lookups seeded');

  // ── Default users (dev only) ─────────────────────────────────────
  // Override the password by setting SEED_PASSWORD before running seed.
  // Both rows are upserted — safe to re-run.
  console.log('Seeding default users…');
  const password = process.env.SEED_PASSWORD ?? 'password';
  await upsertUser({
    email: 'admin@example.com',
    username: 'admin',
    name: 'Admin',
    password,
    role: 'admin',
  });
  await upsertUser({
    email: 'test@example.com',
    username: 'test',
    name: 'Test User',
    password,
    role: 'user',
  });
  console.log(`✅ Users seeded (password = "${password}")`);

  // ── SupplierTrade demo data (agriculture) ────────────────────────
  console.log('Seeding SupplierTrade demo data…');
  const { seedSupplierTradeDemo } = await import('./seed-data/suppliertrade');
  await seedSupplierTradeDemo(prisma);
  console.log('✅ SupplierTrade demo seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
