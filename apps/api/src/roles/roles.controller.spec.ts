import type { SessionUser } from '@proserv/shared';

import { RolesController } from './roles.controller';
import type { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: jest.Mocked<RolesService>;
  const user: SessionUser = {
    id: 'user-1',
    email: 'user@example.com',
    roles: [],
    givenName: 'Casey',
    familyName: 'Lee',
  };

  beforeEach(() => {
    service = {
      listRoles: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      archiveRole: jest.fn(),
    } as unknown as jest.Mocked<RolesService>;

    controller = new RolesController(service);
  });

  it('lists roles via the service', async () => {
    const payload = { data: [], meta: { total: 0, activeCount: 0, archivedCount: 0 } };
    service.listRoles.mockResolvedValue(payload as never);

    const result = await controller.listRoles(user, { includeArchived: true });

    expect(service.listRoles).toHaveBeenCalledWith(user, { includeArchived: true });
    expect(result).toBe(payload);
  });

  it('creates roles via the service', async () => {
    const dto = { code: 'QA', name: 'Quality Analyst' };
    const created = { id: 'role-1' };
    service.createRole.mockResolvedValue(created as never);

    const result = await controller.createRole(user, dto as never);

    expect(service.createRole).toHaveBeenCalledWith(user, dto);
    expect(result).toBe(created);
  });

  it('updates roles via the service', async () => {
    const dto = { name: 'Delivery Lead' };
    const updated = { id: 'role-2' };
    service.updateRole.mockResolvedValue(updated as never);

    const result = await controller.updateRole(user, 'role-2', dto as never);

    expect(service.updateRole).toHaveBeenCalledWith(user, 'role-2', dto);
    expect(result).toBe(updated);
  });

  it('archives roles via the service', async () => {
    const archived = { id: 'role-3', archivedAt: '2024-01-01T00:00:00Z' };
    service.archiveRole.mockResolvedValue(archived as never);

    const result = await controller.archiveRole(user, 'role-3');

    expect(service.archiveRole).toHaveBeenCalledWith(user, 'role-3');
    expect(result).toBe(archived);
  });
});

