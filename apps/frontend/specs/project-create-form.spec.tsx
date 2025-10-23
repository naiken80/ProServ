import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CreateProjectForm } from '@/frontend/app/(dashboard)/projects/create/create-project-form';
import type { BillingModelOption } from '@/frontend/app/(dashboard)/projects/create/constants';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const createProjectMock = jest.fn();

jest.mock('@/frontend/lib/client/projects', () => ({
  createProject: (...args: unknown[]) => createProjectMock(...args),
}));

const billingModels: BillingModelOption[] = [
  {
    value: 'TIME_AND_MATERIAL',
    label: 'Time & materials',
    description: 'Flexible staffing',
  },
  {
    value: 'FIXED_PRICE',
    label: 'Fixed price',
    description: 'Fixed scope',
  },
];

describe('CreateProjectForm', () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    pushMock.mockReset();
  });

  it('submits the form and redirects to the new project', async () => {
    createProjectMock.mockResolvedValue({ id: 'proj-99' });

    render(<CreateProjectForm billingModels={billingModels} />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: { value: 'New Workspace' },
    });
    fireEvent.change(screen.getByLabelText('Client name'), {
      target: { value: 'Acme Corp' },
    });
    fireEvent.change(screen.getByLabelText('Kickoff'), {
      target: { value: '2024-07-01' },
    });
    fireEvent.change(screen.getByLabelText('Base currency'), {
      target: { value: 'eur' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Launch workspace/i }));

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        name: 'New Workspace',
        clientName: 'Acme Corp',
        startDate: '2024-07-01',
        baseCurrency: 'EUR',
        billingModel: 'TIME_AND_MATERIAL',
      });
    });

    expect(pushMock).toHaveBeenCalledWith('/projects/proj-99');
  });

  it('surfaces API errors to the user', async () => {
    createProjectMock.mockRejectedValue(new Error('Request failed'));

    render(<CreateProjectForm billingModels={billingModels} />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: { value: 'New Workspace' },
    });
    fireEvent.change(screen.getByLabelText('Client name'), {
      target: { value: 'Acme Corp' },
    });
    fireEvent.change(screen.getByLabelText('Kickoff'), {
      target: { value: '2024-07-01' },
    });
    fireEvent.change(screen.getByLabelText('Base currency'), {
      target: { value: 'usd' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Launch workspace/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Request failed'),
      ).toBeInTheDocument();
    });
  });
});
