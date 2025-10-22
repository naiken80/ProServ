export type ProjectSummary = {
  id: string;
  name: string;
  client: string;
  owner: string;
  status: 'planning' | 'estimating' | 'in-flight';
  startDate: string;
  endDate?: string;
  totalValue: number;
  margin: number;
  currency: string;
  updatedAt: string;
};

export const projectSummaries: ProjectSummary[] = [
  {
    id: 'proj-tsx-001',
    name: 'Global ERP Modernization',
    client: 'Northwind Manufacturing',
    owner: 'Kate Reynolds',
    status: 'estimating',
    startDate: '2024-11-01',
    endDate: '2025-07-15',
    totalValue: 4125000,
    margin: 0.32,
    currency: 'USD',
    updatedAt: '2024-10-21T09:45:00Z',
  },
  {
    id: 'proj-tsx-002',
    name: 'APAC Digital Launchpad',
    client: 'Aurora Retail Group',
    owner: 'Marcus Chen',
    status: 'planning',
    startDate: '2025-01-08',
    totalValue: 2750000,
    margin: 0.28,
    currency: 'SGD',
    updatedAt: '2024-10-18T13:12:00Z',
  },
  {
    id: 'proj-tsx-003',
    name: 'Field Service AI Assistant',
    client: 'Helios Utilities',
    owner: 'Amanda Singh',
    status: 'in-flight',
    startDate: '2024-05-12',
    endDate: '2024-12-22',
    totalValue: 1980000,
    margin: 0.35,
    currency: 'GBP',
    updatedAt: '2024-10-11T16:55:00Z',
  },
];
