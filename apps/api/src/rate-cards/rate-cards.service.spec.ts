import { Prisma } from '@prisma/client';

import type { SessionUser } from '@proserv/shared';
import type { PrismaService } from '../infra/prisma/prisma.service';
import type { OrganizationContextService } from '../infra/prisma/organization-context.service';

import { RateCardsService } from './rate-cards.service';

describe('RateCardsService', () => {
  let service: RateCardsService;
  let prismaMock: {
    role: {
      findMany: jest.Mock;
    };
    rateCard: {
      findMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findFirstOrThrow?: jest.Mock;
    };
    rateCardRole: {
      create: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let organizationContextMock: {
    resolve: jest.Mock;
  };

  const session: SessionUser = {
    id: 'user-1',
    email: 'user@example.com',
    givenName: 'Casey',
    familyName: 'Lee',
    roles: [],
  };

  beforeEach(() => {
    prismaMock = {
      role: {
        findMany: jest.fn(),
      },
      rateCard: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      rateCardRole: {
        create: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    organizationContextMock = {
      resolve: jest.fn(),
    };

    service = new RateCardsService(
      prismaMock as unknown as PrismaService,
      organizationContextMock as unknown as OrganizationContextService,
    );

    organizationContextMock.resolve.mockResolvedValue({
      organizationId: 'org-1',
      currency: 'USD',
    });

    prismaMock.role.findMany.mockResolvedValue([
      {
        id: 'role-1',
        code: 'ARCH',
        name: 'Solution Architect',
        description: null,
        organizationId: 'org-1',
        archivedAt: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'role-2',
        code: 'ENGM',
        name: 'Engagement Manager',
        description: null,
        organizationId: 'org-1',
        archivedAt: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'role-3',
        code: 'DEL',
        name: 'Delivery Lead',
        description: null,
        organizationId: 'org-1',
        archivedAt: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'role-4',
        code: 'ANA',
        name: 'Business Analyst',
        description: null,
        organizationId: 'org-1',
        archivedAt: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates rate cards with entries for every role', async () => {
    prismaMock.rateCard.create.mockResolvedValue({
      id: 'card-1',
      organizationId: 'org-1',
      name: 'Regional FY25',
      currency: 'USD',
      validFrom: null,
      validTo: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      entries: [
        {
          id: 'entry-1',
          roleId: 'role-1',
          currency: 'USD',
          billRate: new Prisma.Decimal(325),
          costRate: new Prisma.Decimal(165),
          role: {
            id: 'role-1',
            code: 'ARCH',
            name: 'Solution Architect',
            description: null,
            archivedAt: null,
          },
        },
        {
          id: 'entry-2',
          roleId: 'role-2',
          currency: 'USD',
          billRate: new Prisma.Decimal(285),
          costRate: new Prisma.Decimal(155),
          role: {
            id: 'role-2',
            code: 'ENGM',
            name: 'Engagement Manager',
            description: null,
            archivedAt: null,
          },
        },
      ],
    });

    const result = await service.createRateCard(session, {
      name: 'Regional FY25',
      currency: 'usd',
    });

    expect(prismaMock.rateCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        name: 'Regional FY25',
        currency: 'USD',
        entries: {
          create: expect.arrayContaining([
            expect.objectContaining({ roleId: 'role-1', currency: 'USD' }),
            expect.objectContaining({ roleId: 'role-2', currency: 'USD' }),
          ]),
        },
      }),
      include: expect.any(Object),
    });

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].billRate).toBeGreaterThan(0);
    expect(result.entries[0].role.code).toBeDefined();
  });

  it('lists rate cards with numeric rates and role metadata', async () => {
    prismaMock.rateCard.findMany
      .mockResolvedValueOnce([
        {
          id: 'card-1',
          currency: 'USD',
          entries: [
            { roleId: 'role-1', currency: 'USD' },
            { roleId: 'role-2', currency: 'USD' },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'card-1',
          organizationId: 'org-1',
          name: 'Default FY25',
          currency: 'USD',
          validFrom: null,
          validTo: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-05T00:00:00Z'),
          entries: [
            {
              id: 'entry-1',
              roleId: 'role-1',
              currency: 'USD',
              billRate: new Prisma.Decimal(325),
              costRate: new Prisma.Decimal(165),
              role: {
                id: 'role-1',
                code: 'ARCH',
                name: 'Solution Architect',
                description: null,
                archivedAt: null,
              },
            },
            {
              id: 'entry-2',
              roleId: 'role-2',
              currency: 'USD',
              billRate: new Prisma.Decimal(285),
              costRate: new Prisma.Decimal(155),
              role: {
                id: 'role-2',
                code: 'ENGM',
                name: 'Engagement Manager',
                description: null,
                archivedAt: null,
              },
            },
          ],
        },
      ]);

    const collection = await service.listRateCards(session);

    expect(prismaMock.rateCard.findMany).toHaveBeenCalledTimes(2);
    expect(collection.data[0].entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: expect.objectContaining({ code: 'ARCH' }),
          billRate: 325,
        }),
      ]),
    );
    expect(collection.roles).toHaveLength(4);
  });
});
