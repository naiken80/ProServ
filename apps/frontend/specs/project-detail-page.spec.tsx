import { render, screen } from '@testing-library/react';

import ProjectDetailPage from '@/frontend/app/(dashboard)/projects/[id]/page';

const fetchProjectSummaryMock = jest.fn();

jest.mock('@/frontend/lib/api/projects', () => ({
  fetchProjectSummary: (...args: unknown[]) => fetchProjectSummaryMock(...args),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/projects',
}));

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    fetchProjectSummaryMock.mockReset();
  });

  it('renders the project snapshot when data is available', async () => {
    fetchProjectSummaryMock.mockResolvedValue({
      id: 'proj-1',
      name: 'AI Launch Program',
      client: 'Contoso Retail',
      owner: 'Casey Vega',
      status: 'planning',
      startDate: '2024-07-01',
      endDate: null,
      totalValue: 1250000,
      currency: 'USD',
      margin: 0.32,
      updatedAt: '2024-07-05T00:00:00.000Z',
    });

    const page = await ProjectDetailPage({
      params: Promise.resolve({ id: 'proj-1' }),
    });

    render(page);

    expect(screen.getByText('AI Launch Program')).toBeInTheDocument();
    expect(screen.getByText('Contoso Retail')).toBeInTheDocument();
    expect(screen.getByText(/Commercial snapshot/)).toBeInTheDocument();
  });

  it('shows a friendly message when the project is missing', async () => {
    fetchProjectSummaryMock.mockResolvedValue(null);

    const page = await ProjectDetailPage({
      params: Promise.resolve({ id: 'missing' }),
    });

    render(page);

    expect(
      screen.getByText("We couldn't find that workspace"),
    ).toBeInTheDocument();
    expect(screen.getByText('Create estimate')).toBeInTheDocument();
  });
});
