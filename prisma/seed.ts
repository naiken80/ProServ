import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: 'seed-org' },
    update: {},
    create: {
      id: 'seed-org',
      name: 'Seed Consulting Group',
      timezone: 'UTC',
      currency: 'USD',
    },
  });

  const architect = await prisma.role.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'ARCH' } },
    update: {},
    create: {
      code: 'ARCH',
      name: 'Solution Architect',
      organizationId: organization.id,
    },
  });

  const rateCard = await prisma.rateCard.create({
    data: {
      name: 'Default FY25',
      currency: 'USD',
      organizationId: organization.id,
      entries: {
        create: {
          roleId: architect.id,
          currency: 'USD',
          billRate: '325',
          costRate: '165',
        },
      },
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
      createdById: (await prisma.user.upsert({
        where: { email: 'pm@example.com' },
        update: {},
        create: {
          email: 'pm@example.com',
          givenName: 'Project',
          familyName: 'Manager',
          organizationId: organization.id,
        },
      })).id,
      versions: {
        create: {
          name: 'Baseline',
          versionNumber: 1,
          rateCardId: rateCard.id,
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
