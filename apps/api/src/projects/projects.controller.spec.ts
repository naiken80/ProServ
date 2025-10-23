import type { ProjectSummary } from '@proserv/shared';

import { ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;

  const summary: ProjectSummary = {
    id: 'proj-1',
    name: 'New Engagement',
    client: 'Acme Corp',
    owner: 'Engagement Lead',
    status: 'planning',
    startDate: '2024-07-01',
    endDate: undefined,
    totalValue: 0,
    currency: 'USD',
    margin: 0,
    updatedAt: '2024-07-01T00:00:00.000Z',
  };

  beforeEach(() => {
    service = {
      getProjectSummaries: jest.fn(),
      getProjectSummary: jest.fn(),
      createProject: jest.fn(),
      updateProject: jest.fn(),
    } as unknown as jest.Mocked<ProjectsService>;

    controller = new ProjectsController(service);
  });

  it('delegates to service when fetching summaries', async () => {
    const payload = { data: [summary] };
    service.getProjectSummaries.mockResolvedValue(payload as never);

    const result = await controller.getProjectSummaries({} as never);
    expect(service.getProjectSummaries).toHaveBeenCalledWith({});
    expect(result).toEqual(payload);
  });

  it('retrieves a project summary by id', async () => {
    service.getProjectSummary.mockResolvedValue(summary);

    const result = await controller.getProjectSummary('proj-1');
    expect(service.getProjectSummary).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual(summary);
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

    const result = await controller.createProject(dto as never);

    expect(service.createProject).toHaveBeenCalledWith(dto);
    expect(result).toEqual(summary);
  });

  it('updates a project using the service', async () => {
    service.updateProject.mockResolvedValue(summary);

    const dto = { name: 'Updated' };
    const result = await controller.updateProject('proj-1', dto as never);

    expect(service.updateProject).toHaveBeenCalledWith('proj-1', dto);
    expect(result).toEqual(summary);
  });
});
