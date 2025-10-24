import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProjectMetadataForm } from '@/frontend/app/(dashboard)/projects/[id]/project-metadata-form';
import { SessionProvider } from '@/frontend/lib/session-context';

const listRateCardsMock = jest.fn();
const updateProjectMock = jest.fn();
const routerRefreshMock = jest.fn();

jest.mock('@/frontend/lib/client/rate-cards', () => ({
  listRateCards: (...args: unknown[]) => listRateCardsMock(...args),
}));

jest.mock('@/frontend/lib/client/projects', () => ({
  updateProject: (...args: unknown[]) => updateProjectMock(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

describe('ProjectMetadataForm', () => {
  beforeEach(() => {
    listRateCardsMock.mockReset();
    updateProjectMock.mockReset();
    routerRefreshMock.mockReset();
  });

  it('submits baseline rate card updates and refreshes the workspace', async () => {
    const onProjectUpdated = jest.fn();

    listRateCardsMock.mockResolvedValue({
      data: [
        {
          id: 'card-1',
          organizationId: 'org-1',
          name: 'Delivery Core',
          currency: 'USD',
          validFrom: null,
          validTo: null,
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: '2024-06-15T00:00:00.000Z',
          entries: [],
        },
        {
          id: 'card-2',
          organizationId: 'org-1',
          name: 'Strategic Advisory',
          currency: 'USD',
          validFrom: null,
          validTo: null,
          createdAt: '2024-06-05T00:00:00.000Z',
          updatedAt: '2024-06-20T00:00:00.000Z',
          entries: [],
        },
      ],
      roles: [],
    });

    updateProjectMock.mockResolvedValue({
      id: 'proj-1',
      name: 'Discovery Sprint',
      client: 'Northwind',
      owner: 'Taylor Jordan',
      status: 'planning',
      startDate: '2024-07-01',
      endDate: null,
      billingModel: 'TIME_AND_MATERIAL',
      totalValue: 0,
      currency: 'USD',
      margin: 0,
      updatedAt: '2024-07-02T00:00:00.000Z',
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <SessionProvider
        session={{
          id: 'user-1',
          email: 'owner@example.com',
          givenName: 'Taylor',
          familyName: 'Jordan',
          roles: [],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ProjectMetadataForm
            projectId="proj-1"
            summary={{
              id: 'proj-1',
              name: 'Discovery Sprint',
              client: 'Northwind',
              owner: 'Taylor Jordan',
              status: 'planning',
              startDate: '2024-07-01',
              endDate: null,
              billingModel: 'TIME_AND_MATERIAL',
              totalValue: 0,
              currency: 'USD',
              margin: 0,
              updatedAt: '2024-07-01T00:00:00.000Z',
            }}
            baselineName="Baseline"
            baselineRateCardId="card-1"
            onProjectUpdated={onProjectUpdated}
          />
        </QueryClientProvider>
      </SessionProvider>,
    );

    await waitFor(() => expect(listRateCardsMock).toHaveBeenCalled());

    const rateCardSelect = await screen.findByRole('combobox', {
      name: /rate card/i,
    });
    await waitFor(() => expect(rateCardSelect).not.toBeDisabled());
    fireEvent.change(rateCardSelect, { target: { value: 'card-2' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateProjectMock).toHaveBeenCalled());

    expect(updateProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'proj-1',
      { baselineRateCardId: 'card-2' },
    );

    await waitFor(() => expect(onProjectUpdated).toHaveBeenCalled());

    expect(onProjectUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'proj-1', updatedAt: '2024-07-02T00:00:00.000Z' }),
      {
        rateCard: {
          id: 'card-2',
          name: 'Strategic Advisory',
          details: expect.objectContaining({ id: 'card-2', name: 'Strategic Advisory' }),
        },
      },
    );

    expect(routerRefreshMock).toHaveBeenCalled();
  });
});
