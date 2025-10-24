import type {
  ProjectSummary,
  ProjectWorkspace,
  SessionUser,
} from '@proserv/shared';

import { ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;
  const user: SessionUser = {
    id: 'user-1',
    email: 'user@example.com',
    givenName: 'Casey',
    familyName: 'Vega',
    roles: [],
  };

  const summary: ProjectSummary = {
    id: 'proj-1',
    name: 'New Engagement',
    client: 'Acme Corp',
    owner: 'Engagement Lead',
    status: 'planning',
    startDate: '2024-07-01',
    endDate: undefined,
    billingModel: 'TIME_AND_MATERIAL',
    totalValue: 0,
    currency: 'USD',
    margin: 0,
    updatedAt: '2024-07-01T00:00:00.000Z',
  };

  beforeEach(() => {
    service = {
      getProjectSummaries: jest.fn(),
      getProjectSummary: jest.fn(),
      getProjectWorkspace: jest.fn(),
      createProject: jest.fn(),
      updateProject: jest.fn(),
    } as unknown as jest.Mocked<ProjectsService>;

    controller = new ProjectsController(service);
  });

  it('delegates to service when fetching summaries', async () => {
    const payload = { data: [summary] };
    service.getProjectSummaries.mockResolvedValue(payload as never);

    const result = await controller.getProjectSummaries(user, {} as never);
    expect(service.getProjectSummaries).toHaveBeenCalledWith(user, {});
    expect(result).toEqual(payload);
  });

  it('retrieves project workspace details by id', async () => {
    const workspace: ProjectWorkspace = {
      summary,
      baseline: {
        id: 'ver-1',
        name: 'Baseline',
        versionNumber: 1,
        status: 'DRAFT',
        updatedAt: '2024-07-01T00:00:00.000Z',
        rateCardName: 'Global Delivery Standard',
        rateCardId: 'card-1',
        rateCard: {
          id: 'card-1',
          organizationId: 'org-1',
          name: 'Global Delivery Standard',
          currency: 'USD',
          validFrom: null,
          validTo: null,
          createdAt: '2024-07-01T00:00:00.000Z',
          updatedAt: '2024-07-01T00:00:00.000Z',
          entries: [],
        },
        totalValue: 0,
        totalCost: 0,
        margin: 0,
        currency: 'USD',
        assignmentCount: 0,
      },
    };
    service.getProjectWorkspace.mockResolvedValue(workspace);

    const result = await controller.getProjectWorkspace(user, 'proj-1');
    expect(service.getProjectWorkspace).toHaveBeenCalledWith(user, 'proj-1');
    expect(result).toEqual(workspace);
  });

  it('creates a project using the service', async () => {
    service.createProject.mockResolvedValue(summary);

    const dto = {
      name: 'New Engagement',
      clientName: 'Acme Corp',
      startDate: '2024-07-01',
      baseCurrency: 'USD',
      billingModel: 'TIME_AND_MATERIAL',
    };

    const result = await controller.createProject(user, dto as never);

    expect(service.createProject).toHaveBeenCalledWith(user, dto);
    expect(result).toEqual(summary);
  });

  it('updates a project using the service', async () => {
    service.updateProject.mockResolvedValue(summary);

    const dto = { name: 'Updated' };
    const result = await controller.updateProject(user, 'proj-1', dto as never);

    expect(service.updateProject).toHaveBeenCalledWith(user, 'proj-1', dto);
    expect(result).toEqual(summary);
  });
});
