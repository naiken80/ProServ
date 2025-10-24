import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProjectsResults } from '@/frontend/app/(dashboard)/projects/_components/projects-results';
import type { PipelineStatus } from '@/frontend/app/(dashboard)/projects/constants';
import type { ProjectSummariesResponse, ProjectSummary } from '@/frontend/lib/api/projects';

const pushMock = jest.fn();
let searchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

const baseMeta: ProjectSummariesResponse['meta'] = {
  page: 1,
  pageSize: 6,
  totalItems: 1,
  totalPages: 1,
  totalMatchingSearch: 1,
  totalAll: 1,
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const sampleProject: ProjectSummary = {
  id: 'proj-1',
  name: 'Global ERP Modernization',
  client: 'Northwind Manufacturing',
  owner: 'Kate Reynolds',
  status: 'planning',
  startDate: '2024-06-01T00:00:00.000Z',
  endDate: '2024-12-01T00:00:00.000Z',
  billingModel: 'TIME_AND_MATERIAL',
  totalValue: 4_125_000,
  currency: 'USD',
  margin: 0.32,
  updatedAt: '2024-06-02T08:30:00.000Z',
};

const statusCounts: Record<PipelineStatus, number> = {
  planning: 1,
  estimating: 0,
  'in-flight': 0,
};

describe('ProjectsResults', () => {
  beforeEach(() => {
    pushMock.mockReset();
    searchParamsValue = '';
  });

  it('renders project summaries with status badges and metrics', () => {
    renderWithQuery(
      <ProjectsResults
        projects={[sampleProject]}
        statusCounts={statusCounts}
        statusFilter={undefined}
        searchTerm=""
        hasFilters={false}
        resultsLabel="1 results"
        meta={baseMeta}
        lastUpdatedLabel="Jun 2, 2024"
        lastUpdated="2024-06-02T08:30:00.000Z"
      />,
    );

    expect(screen.getByText('Global ERP Modernization')).toBeInTheDocument();
    expect(screen.getAllByText('Planning')[0]).toBeInTheDocument();
    expect(screen.getByText('Client · Northwind Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('Estimated value')).toBeInTheDocument();
    expect(screen.getByText('Margin target')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
  });

  it('shows an empty state when there are no matching projects', () => {
    renderWithQuery(
      <ProjectsResults
        projects={[]}
        statusCounts={{ planning: 0, estimating: 0, 'in-flight': 0 }}
        statusFilter={undefined}
        searchTerm="apollo"
        hasFilters
        resultsLabel="0 results"
        meta={{ ...baseMeta, totalItems: 0, totalMatchingSearch: 0, totalAll: 0 }}
        lastUpdatedLabel="Awaiting updates"
        lastUpdated={null}
      />,
    );

    expect(
      screen.getByText('No projects match your filters yet'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Try a different status or search term/i),
    ).toBeInTheDocument();
  });

  it('encourages project creation when the workspace is empty', () => {
    renderWithQuery(
      <ProjectsResults
        projects={[]}
        statusCounts={{ planning: 0, estimating: 0, 'in-flight': 0 }}
        statusFilter={undefined}
        searchTerm=""
        hasFilters={false}
        resultsLabel="0 results"
        meta={{ ...baseMeta, totalItems: 0, totalMatchingSearch: 0, totalAll: 0 }}
        lastUpdatedLabel="Awaiting updates"
        lastUpdated={null}
      />,
    );

    expect(
      screen.getByText('Get started by creating your first estimate'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create an estimate to light up your dashboards with live metrics.'),
    ).toBeInTheDocument();
  });

  it('applies status filters via router navigation', () => {
    renderWithQuery(
      <ProjectsResults
        projects={[sampleProject]}
        statusCounts={statusCounts}
        statusFilter={undefined}
        searchTerm=""
        hasFilters={false}
        resultsLabel="1 results"
        meta={baseMeta}
        lastUpdatedLabel="Jun 2, 2024"
        lastUpdated="2024-06-02T08:30:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Planning/ }));
    expect(pushMock).toHaveBeenCalledWith('/projects?status=planning');
  });

  it('navigates between pages', () => {
    renderWithQuery(
      <ProjectsResults
        projects={[sampleProject]}
        statusCounts={statusCounts}
        statusFilter={undefined}
        searchTerm=""
        hasFilters={false}
        resultsLabel="1 results"
        meta={{ ...baseMeta, totalPages: 3, totalItems: 3 }}
        lastUpdatedLabel="Jun 2, 2024"
        lastUpdated="2024-06-02T08:30:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(pushMock).toHaveBeenCalledWith('/projects?page=2');
  });
});
