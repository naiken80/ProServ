import { Prisma, ProjectStatus } from '@prisma/client';

import { ProjectsService } from './projects.service';

import type { ProjectSummary } from '@proserv/shared';
import type { PrismaService } from '../infra/prisma/prisma.service';
import type { GetProjectSummariesDto } from './dto/get-project-summaries.dto';

describe('ProjectsService', () => {
  let prismaMock: {
    project: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    assignment: {
      findMany: jest.Mock;
    };
    organization: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    user: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    estimateVersion: {
      updateMany: jest.Mock;
    };
  };
  let service: ProjectsService;

  beforeEach(() => {
    prismaMock = {
      project: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      assignment: {
        findMany: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      estimateVersion: {
        updateMany: jest.fn(),
      },
    };

    service = new ProjectsService(prismaMock as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('builds summaries with financial aggregates and metadata', async () => {
    prismaMock.project.count
      .mockResolvedValueOnce(1) // planning count
      .mockResolvedValueOnce(0) // estimating count
      .mockResolvedValueOnce(1) // in-flight count
      .mockResolvedValueOnce(2) // total matching search
      .mockResolvedValueOnce(2) // total all
      .mockResolvedValueOnce(2); // total items

    const planningProject = {
      id: 'proj-1',
      name: 'Global ERP Turnaround',
      clientName: 'Northwind Manufacturing',
      baseCurrency: 'USD',
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2024-12-01T00:00:00Z'),
      organizationId: 'org-1',
      billingModel: 'TIME_AND_MATERIAL',
      status: ProjectStatus.DRAFT,
      createdAt: new Date('2024-05-15T00:00:00Z'),
      updatedAt: new Date('2024-06-10T09:00:00Z'),
      createdById: 'user-1',
      createdBy: {
        id: 'user-1',
        givenName: 'Kate',
        familyName: 'Reynolds',
        email: 'kate@example.com',
      },
      versions: [
        {
          id: 'ver-1',
          versionNumber: 1,
          status: 'IN_REVIEW',
          updatedAt: new Date('2024-06-11T10:00:00Z'),
        },
      ],
    };

    const activeProject = {
      id: 'proj-2',
      name: 'AI Assistant Expansion',
      clientName: 'Contoso Retail',
      baseCurrency: 'EUR',
      startDate: new Date('2024-07-05T00:00:00Z'),
      endDate: null,
      organizationId: 'org-1',
      billingModel: 'TIME_AND_MATERIAL',
      status: ProjectStatus.ACTIVE,
      createdAt: new Date('2024-05-20T00:00:00Z'),
      updatedAt: new Date('2024-06-12T13:30:00Z'),
      createdById: 'user-2',
      createdBy: {
        id: 'user-2',
        givenName: 'Lee',
        familyName: 'Chen',
        email: 'lee@example.com',
      },
      versions: [
        {
          id: 'ver-2',
          versionNumber: 2,
          status: 'APPROVED',
          updatedAt: new Date('2024-06-12T13:30:00Z'),
        },
      ],
    };

    prismaMock.project.findMany.mockResolvedValue([planningProject, activeProject]);

    prismaMock.assignment.findMany.mockResolvedValue([
      {
        workItem: { versionId: 'ver-1' },
        plans: [
          { bill: new Prisma.Decimal(1_000), cost: new Prisma.Decimal(600) },
          { bill: new Prisma.Decimal(500), cost: new Prisma.Decimal(200) },
        ],
      },
      {
        workItem: { versionId: 'ver-2' },
        plans: [
          { bill: new Prisma.Decimal(2_000), cost: new Prisma.Decimal(1_200) },
        ],
      },
    ]);

    prismaMock.project.findFirst.mockResolvedValue({
      updatedAt: new Date('2024-06-12T13:30:00Z'),
    });

    const result = await service.getProjectSummaries({
      page: 1,
      pageSize: 2,
    } as GetProjectSummariesDto);

    expect(result.counts).toEqual({
      planning: 1,
      estimating: 0,
      'in-flight': 1,
    });
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 2,
      totalItems: 2,
      totalPages: 1,
      totalMatchingSearch: 2,
      totalAll: 2,
    });
    expect(result.lastUpdated).toBe('2024-06-12T13:30:00.000Z');

    expect(result.data).toHaveLength(2);

    const planningSummary = result.data.find((item) => item.id === 'proj-1');
    const activeSummary = result.data.find((item) => item.id === 'proj-2');

    expect(planningSummary).toMatchObject({
      name: 'Global ERP Turnaround',
      client: 'Northwind Manufacturing',
      owner: 'Kate Reynolds',
      status: 'estimating',
      currency: 'USD',
      totalValue: 1500,
    });
    expect(planningSummary?.margin).toBeCloseTo((1500 - 800) / 1500);

    expect(activeSummary).toMatchObject({
      name: 'AI Assistant Expansion',
      client: 'Contoso Retail',
      owner: 'Lee Chen',
      status: 'in-flight',
      currency: 'EUR',
      totalValue: 2000,
    });
    expect(activeSummary?.margin).toBeCloseTo((2000 - 1200) / 2000);
  });

  it('clamps requested page when no results are available', async () => {
    prismaMock.project.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    prismaMock.project.findMany.mockResolvedValue([]);
    prismaMock.assignment.findMany.mockResolvedValue([]);
    prismaMock.project.findFirst.mockResolvedValue(null);

    const result = await service.getProjectSummaries({
      page: 5,
      pageSize: 10,
      status: 'in-flight',
    } as GetProjectSummariesDto);

    expect(result.data).toHaveLength(0);
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalPages).toBe(0);
    expect(result.lastUpdated).toBeNull();
  });

  it('returns a single project summary by id', async () => {
    const project = {
      id: 'proj-1',
      name: 'Global ERP Turnaround',
      clientName: 'Northwind Manufacturing',
      baseCurrency: 'USD',
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2024-12-01T00:00:00Z'),
      organizationId: 'org-1',
      billingModel: 'TIME_AND_MATERIAL',
      status: ProjectStatus.DRAFT,
      createdAt: new Date('2024-05-15T00:00:00Z'),
      updatedAt: new Date('2024-06-10T09:00:00Z'),
      createdById: 'user-1',
      createdBy: {
        id: 'user-1',
        givenName: 'Kate',
        familyName: 'Reynolds',
        email: 'kate@example.com',
      },
      versions: [
        {
          id: 'ver-1',
          versionNumber: 1,
          status: 'IN_REVIEW',
          updatedAt: new Date('2024-06-11T10:00:00Z'),
        },
      ],
    };

    prismaMock.project.findFirst
      .mockResolvedValueOnce(project) // for getProjectSummary
      .mockResolvedValueOnce({ updatedAt: project.updatedAt }); // safety for other calls

    prismaMock.assignment.findMany.mockResolvedValue([
      {
        workItem: { versionId: 'ver-1' },
        plans: [
          { bill: new Prisma.Decimal(1_000), cost: new Prisma.Decimal(600) },
          { bill: new Prisma.Decimal(500), cost: new Prisma.Decimal(200) },
        ],
      },
    ]);

    const summary = await service.getProjectSummary('proj-1');

    expect(prismaMock.assignment.findMany).toHaveBeenCalledWith({
      where: { workItem: { versionId: { in: ['ver-1'] } } },
      select: {
        workItem: {
          select: { versionId: true },
        },
        plans: {
          select: { bill: true, cost: true },
        },
      },
    });

    expect(summary).toMatchObject({
      id: 'proj-1',
      name: 'Global ERP Turnaround',
      client: 'Northwind Manufacturing',
      currency: 'USD',
      status: 'estimating',
      totalValue: 1500,
    });
  });

  it('throws when requesting a project that does not exist', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    await expect(service.getProjectSummary('missing')).rejects.toThrow(
      'Project not found',
    );
  });

  it('creates a project with baseline version and returns the summary', async () => {
    prismaMock.organization.findFirst.mockResolvedValue(null);
    prismaMock.organization.create.mockResolvedValue({ id: 'org-1' });
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' });
    prismaMock.project.create.mockResolvedValue({ id: 'proj-123' });

    const summary: ProjectSummary = {
      id: 'proj-123',
      name: 'New Engagement',
      client: 'Acme Corp',
      owner: 'Engagement Lead',
      status: 'planning',
      startDate: '2024-07-01',
      endDate: undefined,
      totalValue: 0,
      currency: 'USD',
      margin: 0,
      updatedAt: new Date('2024-07-01T00:00:00Z').toISOString(),
    };

    const getSummarySpy = jest
      .spyOn(service, 'getProjectSummary')
      .mockResolvedValue(summary);

    const result = await service.createProject({
      name: 'New Engagement',
      clientName: 'Acme Corp',
      baseCurrency: 'USD',
      billingModel: 'TIME_AND_MATERIAL',
      startDate: '2024-07-01',
    });

    expect(prismaMock.organization.findFirst).toHaveBeenCalled();
    expect(prismaMock.organization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Primary Services Org',
        currency: 'USD',
      }),
      select: { id: true },
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        email: 'engagement.lead@proserv.local',
      }),
      select: { id: true },
    });

    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'New Engagement',
        clientName: 'Acme Corp',
        baseCurrency: 'USD',
        billingModel: 'TIME_AND_MATERIAL',
        startDate: new Date('2024-07-01'),
        versions: {
          create: expect.objectContaining({
            name: 'Baseline',
            versionNumber: 1,
          }),
        },
      }),
      select: { id: true },
    });

    expect(result).toEqual(summary);
    getSummarySpy.mockRestore();
  });

  it('updates project fields and baseline version name', async () => {
    prismaMock.project.update.mockResolvedValue({ id: 'proj-1' });
    prismaMock.estimateVersion.updateMany.mockResolvedValue({ count: 1 });

    const summary: ProjectSummary = {
      id: 'proj-1',
      name: 'Updated Engagement',
      client: 'Acme Corp',
      owner: 'Engagement Lead',
      status: 'planning',
      startDate: '2024-07-01',
      endDate: '2024-12-01',
      totalValue: 0,
      currency: 'USD',
      margin: 0,
      updatedAt: new Date('2024-07-10T00:00:00Z').toISOString(),
    };

    const getSummarySpy = jest
      .spyOn(service, 'getProjectSummary')
      .mockResolvedValue(summary);

    const result = await service.updateProject('proj-1', {
      name: 'Updated Engagement',
      clientName: 'Acme Corp',
      baselineVersionName: 'Rev 1',
      endDate: '2024-12-01',
    });

    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: expect.objectContaining({
        name: 'Updated Engagement',
        clientName: 'Acme Corp',
        endDate: new Date('2024-12-01'),
      }),
      select: { id: true },
    });

    expect(prismaMock.estimateVersion.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1', versionNumber: 1 },
      data: { name: 'Rev 1' },
    });

    expect(result).toEqual(summary);
    getSummarySpy.mockRestore();
  });

  it('throws when update is missing fields', async () => {
    await expect(service.updateProject('proj-1', {})).rejects.toThrow(
      'No fields provided to update',
    );
  });

  it('throws when project is missing during update', async () => {
    prismaMock.project.update.mockImplementation(() => {
      const error = new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: '5.17',
      });
      throw error;
    });

    await expect(
      service.updateProject('proj-404', { name: 'Missing' }),
    ).rejects.toThrow('Project not found');
  });
});
