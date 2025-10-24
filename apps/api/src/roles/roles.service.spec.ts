import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { SessionUser } from '@proserv/shared';
import type { PrismaService } from '../infra/prisma/prisma.service';
import type { OrganizationContextService } from '../infra/prisma/organization-context.service';
import type { RateCardsService } from '../rate-cards/rate-cards.service';

import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prismaMock: {
    role: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    rateCardRole: {
      deleteMany: jest.Mock;
    };
  };
  let organizationContextMock: {
    resolve: jest.Mock;
  };
  let rateCardsServiceMock: {
    backfillEntriesForRoles: jest.Mock;
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
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      rateCardRole: {
        deleteMany: jest.fn(),
      },
    };

    organizationContextMock = {
      resolve: jest.fn(),
    };

    rateCardsServiceMock = {
      backfillEntriesForRoles: jest.fn(),
    };

    organizationContextMock.resolve.mockResolvedValue({
      organizationId: 'org-1',
      currency: 'USD',
    });

    service = new RolesService(
      prismaMock as unknown as PrismaService,
      organizationContextMock as unknown as OrganizationContextService,
      rateCardsServiceMock as unknown as RateCardsService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists roles with meta counts and respects the archived filter', async () => {
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: 'role-1',
        organizationId: 'org-1',
        code: 'ARCH',
        name: 'Architect',
        description: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        archivedAt: null,
      },
      {
        id: 'role-2',
        organizationId: 'org-1',
        code: 'ANA',
        name: 'Analyst',
        description: 'Requirements partner',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        archivedAt: null,
      },
    ]);
    prismaMock.role.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await service.listRoles(session, {
      includeArchived: false,
    });

    expect(prismaMock.role.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', archivedAt: null },
      orderBy: [{ name: 'asc' }],
    });
    expect(result.data).toHaveLength(2);
    expect(result.meta.activeCount).toBe(2);
    expect(result.meta.archivedCount).toBe(1);
  });

  it('creates roles and backfills rate cards', async () => {
    const createdAt = new Date('2024-01-03T00:00:00Z');
    const createdRole = {
      id: 'role-3',
      organizationId: 'org-1',
      code: 'QA',
      name: 'Quality Analyst',
      description: null,
      createdAt,
      updatedAt: createdAt,
      archivedAt: null,
    };

    prismaMock.role.create.mockResolvedValue(createdRole);

    const result = await service.createRole(session, {
      code: 'QA',
      name: 'Quality Analyst',
    });

    expect(prismaMock.role.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        code: 'QA',
        name: 'Quality Analyst',
        description: null,
      },
    });
    expect(rateCardsServiceMock.backfillEntriesForRoles).toHaveBeenCalledWith(
      'org-1',
      [createdRole],
    );
    expect(result.code).toBe('QA');
    expect(result.description).toBeNull();
  });

  it('surfaces uniqueness violations when creating roles', async () => {
    prismaMock.role.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique mismatch', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createRole(session, {
        code: 'ARCH',
        name: 'Solution Architect',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates roles when fields change', async () => {
    const roleRecord = {
      id: 'role-4',
      organizationId: 'org-1',
      code: 'DEL',
      name: 'Delivery Lead',
      description: 'Program orchestrator',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      archivedAt: null,
    };

    prismaMock.role.findFirst.mockResolvedValue(roleRecord);
    prismaMock.role.update.mockImplementation(async ({ data }) => ({
      ...roleRecord,
      ...data,
      updatedAt: new Date('2024-02-01T00:00:00Z'),
    }));

    const result = await service.updateRole(session, roleRecord.id, {
      name: 'Engagement Lead',
      description: '',
    });

    expect(prismaMock.role.update).toHaveBeenCalledWith({
      where: { id: roleRecord.id },
      data: {
        name: 'Engagement Lead',
        description: null,
      },
    });
    expect(result.name).toBe('Engagement Lead');
    expect(result.description).toBeNull();
  });

  it('throws when updating a missing role', async () => {
    prismaMock.role.findFirst.mockResolvedValue(null);

    await expect(
      service.updateRole(session, 'missing-role', { name: 'Updated' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives roles and removes rate card entries', async () => {
    const roleRecord = {
      id: 'role-5',
      organizationId: 'org-1',
      code: 'CONS',
      name: 'Consultant',
      description: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      archivedAt: null,
    };

    prismaMock.role.findFirst.mockResolvedValue(roleRecord);
    prismaMock.role.update.mockImplementation(async ({ data }) => ({
      ...roleRecord,
      archivedAt: data.archivedAt as Date,
      updatedAt: data.archivedAt as Date,
    }));

    const result = await service.archiveRole(session, roleRecord.id);

    expect(prismaMock.role.update).toHaveBeenCalled();
    expect(prismaMock.rateCardRole.deleteMany).toHaveBeenCalledWith({
      where: { roleId: roleRecord.id },
    });
    expect(result.archivedAt).not.toBeNull();
  });
});

