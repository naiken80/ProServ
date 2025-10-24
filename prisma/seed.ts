import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ROLE_DEFINITIONS: Array<{
  code: string;
  name: string;
  description: string;
  billRate: string;
  costRate: string;
}> = [
  {
    code: 'ARCH',
    name: 'Solution Architect',
    description: 'Design blueprint and guardrails across workstreams.',
    billRate: '325',
    costRate: '165',
  },
  {
    code: 'ENGM',
    name: 'Engagement Manager',
    description: 'Govern steering cadence, commercials, and communications.',
    billRate: '285',
    costRate: '155',
  },
  {
    code: 'DEL',
    name: 'Delivery Lead',
    description: 'Run day-to-day delivery, risks, and dependency orchestration.',
    billRate: '245',
    costRate: '135',
  },
  {
    code: 'ANA',
    name: 'Business Analyst',
    description: 'Shape requirements, groom stories, and align acceptance criteria.',
    billRate: '185',
    costRate: '95',
  },
];

type RoleRates = {
  billRate: string;
  costRate: string;
};

async function upsertRateCard(options: {
  id: string;
  name: string;
  currency: string;
  organizationId: string;
  rolesByCode: Map<string, { id: string }>;
  transformRate?: (roleCode: string, base: RoleRates) => RoleRates;
}) {
  const { id, name, currency, organizationId, rolesByCode, transformRate } =
    options;

  const rateCard = await prisma.rateCard.upsert({
    where: { id },
    update: {
      name,
      currency,
      organizationId,
    },
    create: {
      id,
      name,
      currency,
      organizationId,
    },
  });

  for (const roleDefinition of DEFAULT_ROLE_DEFINITIONS) {
    const role = rolesByCode.get(roleDefinition.code);
    if (!role) continue;

    const baseRates: RoleRates = {
      billRate: roleDefinition.billRate,
      costRate: roleDefinition.costRate,
    };

    const rates = transformRate
      ? transformRate(roleDefinition.code, baseRates)
      : baseRates;

    await prisma.rateCardRole.upsert({
      where: {
        rateCardId_roleId_currency: {
          rateCardId: rateCard.id,
          roleId: role.id,
          currency: rateCard.currency,
        },
      },
      update: {
        billRate: rates.billRate,
        costRate: rates.costRate,
      },
      create: {
        rateCardId: rateCard.id,
        roleId: role.id,
        currency: rateCard.currency,
        billRate: rates.billRate,
        costRate: rates.costRate,
      },
    });
  }

  return rateCard;
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: 'seed-org' },
    update: {
      name: 'Seed Consulting Group',
      timezone: 'UTC',
      currency: 'USD',
    },
    create: {
      id: 'seed-org',
      name: 'Seed Consulting Group',
      timezone: 'UTC',
      currency: 'USD',
    },
  });

  const roleRecords = await Promise.all(
    DEFAULT_ROLE_DEFINITIONS.map((role) =>
      prisma.role.upsert({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: role.code,
          },
        },
        update: {
          name: role.name,
          description: role.description,
        },
        create: {
          code: role.code,
          name: role.name,
          description: role.description,
          organizationId: organization.id,
        },
      }),
    ),
  );

  const rolesByCode = new Map(roleRecords.map((role) => [role.code, role]));

  const defaultRateCard = await upsertRateCard({
    id: 'seed-rate-card-default',
    name: 'Default FY25',
    currency: 'USD',
    organizationId: organization.id,
    rolesByCode,
  });

  await upsertRateCard({
    id: 'seed-rate-card-emea',
    name: 'EMEA Nearshore FY25',
    currency: 'EUR',
    organizationId: organization.id,
    rolesByCode,
    transformRate: (_code, base) => ({
      billRate: (parseFloat(base.billRate) * 0.92).toFixed(2),
      costRate: (parseFloat(base.costRate) * 0.9).toFixed(2),
    }),
  });

  const owner = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {
      organizationId: organization.id,
      givenName: 'Project',
      familyName: 'Manager',
    },
    create: {
      email: 'pm@example.com',
      givenName: 'Project',
      familyName: 'Manager',
      organizationId: organization.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Sample Transformation',
      clientName: 'Example Corp',
      baseCurrency: 'USD',
      billingModel: 'TIME_AND_MATERIAL',
      organizationId: organization.id,
      startDate: new Date(),
      createdById: owner.id,
      versions: {
        create: {
          name: 'Baseline',
          versionNumber: 1,
          rateCardId: defaultRateCard.id,
          fxSnapshot: {},
        },
      },
    },
  });
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Prisma seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
