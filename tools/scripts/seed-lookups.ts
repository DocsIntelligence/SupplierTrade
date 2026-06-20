/**
 * Seed lookup groups for configurable dropdowns.
 *
 * Usage:
 *   pnpm seed:lookups
 *
 * Idempotent — creates new groups, adds missing values. Never deletes existing values.
 */

import { PrismaClient } from '@prisma/client';
import { lookupGroups } from '../prisma/seed-data/lookups';

const prisma = new PrismaClient();

async function main() {
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
        `✓ Created "${group.key}" with ${group.values.length} values`,
      );
      continue;
    }

    // Add missing values
    const existingValues = new Set(existing.values.map((v) => v.value));
    const newValues = group.values.filter((v) => !existingValues.has(v.value));

    if (newValues.length === 0) {
      console.log(
        `✓ "${group.key}" — up to date (${existing.values.length} values)`,
      );
      continue;
    }

    // newValues is already filtered to absent values; SQLite's createMany
    // does not support `skipDuplicates`.
    await prisma.lookupValue.createMany({
      data: newValues.map((v) => ({
        groupId: existing.id,
        label: v.label,
        value: v.value,
        order: v.order,
      })),
    });

    console.log(
      `✓ "${group.key}" — added ${newValues.length} new values (total: ${existing.values.length + newValues.length})`,
    );
  }

  console.log('\n✅ Lookups seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
