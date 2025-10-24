import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import ProjectDetailPage from '@/frontend/app/(dashboard)/projects/[id]/page';
import { SessionProvider } from '@/frontend/lib/session-context';

const fetchProjectWorkspaceMock = jest.fn();
const listRateCardsMock = jest.fn();

jest.mock('@/frontend/lib/api/projects', () => ({
  fetchProjectWorkspace: (...args: unknown[]) =>
    fetchProjectWorkspaceMock(...args),
}));

jest.mock('@/frontend/lib/client/rate-cards', () => ({
  listRateCards: (...args: unknown[]) => listRateCardsMock(...args),
}));

jest.mock('@/frontend/lib/session.server', () => ({
  getServerSession: () => ({
    id: 'user-1',
    email: 'user@example.com',
    givenName: 'Casey',
    familyName: 'Vega',
    roles: [],
  }),
}));

const routerRefreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
  usePathname: () => '/projects',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <SessionProvider
      session={{
        id: 'user-1',
        email: 'user@example.com',
        givenName: 'Casey',
        familyName: 'Vega',
        roles: [],
      }}
    >
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SessionProvider>,
  );
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    fetchProjectWorkspaceMock.mockReset();
    routerRefreshMock.mockReset();
    listRateCardsMock.mockReset();
    listRateCardsMock.mockResolvedValue({
      data: [],
      roles: [],
    });
  });

  it('renders the project workspace when data is available', async () => {
    fetchProjectWorkspaceMock.mockResolvedValue({
      summary: {
        id: 'proj-1',
        name: 'AI Launch Program',
        client: 'Contoso Retail',
        owner: 'Casey Vega',
        status: 'planning',
        startDate: '2024-07-01',
        endDate: null,
        billingModel: 'TIME_AND_MATERIAL',
        totalValue: 1_250_000,
        currency: 'USD',
        margin: 0.32,
        updatedAt: '2024-07-05T00:00:00.000Z',
      },
      baseline: {
        id: 'ver-1',
        name: 'Baseline',
        versionNumber: 1,
        status: 'DRAFT',
        updatedAt: '2024-07-05T00:00:00.000Z',
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
          updatedAt: '2024-07-05T00:00:00.000Z',
          entries: [
            {
              id: 'entry-1',
              roleId: 'role-1',
              currency: 'USD',
              billRate: 325,
              costRate: 165,
              role: {
                id: 'role-1',
                code: 'ARCH',
                name: 'Solution Architect',
                description: null,
              },
            },
          ],
        },
        totalValue: 1_250_000,
        totalCost: 750_000,
        margin: 0.4,
        currency: 'USD',
        assignmentCount: 6,
      },
    });

    const page = await ProjectDetailPage({
      params: Promise.resolve({ id: 'proj-1' }),
    });

    renderWithProviders(page);

    expect(screen.getByText('AI Launch Program')).toBeInTheDocument();
    expect(screen.getByText('Contoso Retail')).toBeInTheDocument();
    expect(screen.getByText(/Baseline estimate details/)).toBeInTheDocument();
  });

  it('shows a friendly message when the project is missing', async () => {
    fetchProjectWorkspaceMock.mockResolvedValue(null);

    const page = await ProjectDetailPage({
      params: Promise.resolve({ id: 'missing' }),
    });

    renderWithProviders(page);

    expect(
      screen.getByText("We couldn't find that workspace"),
    ).toBeInTheDocument();
    expect(screen.getByText('Create estimate')).toBeInTheDocument();
  });
});
