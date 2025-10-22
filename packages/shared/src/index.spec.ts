import { projectSchema, projectSummarySchema } from './index';

describe('shared schemas', () => {
  it('validates project summaries', () => {
    const summary = projectSummarySchema.parse({
      id: 'proj-1',
      name: 'Field Service AI Assistant',
      client: 'Helios Utilities',
      owner: 'Amanda Singh',
      status: 'estimating',
      startDate: '2024-09-01',
      totalValue: 1850000,
      currency: 'USD',
      margin: 0.34,
      updatedAt: '2024-10-15T12:00:00Z',
    });

    expect(summary.margin).toBeGreaterThan(0);
  });

  it('validates nested project structures', () => {
    const result = projectSchema.parse({
      id: 'proj-1',
      organizationId: 'org-1',
      name: 'Digital Launchpad',
      clientName: 'Aurora Retail Group',
      ownerId: 'user-1',
      baseCurrency: 'USD',
      billingModel: 'TIME_AND_MATERIAL',
      status: 'ACTIVE',
      startDate: '2024-10-01',
      versions: [
        {
          id: 'ver-1',
          projectId: 'proj-1',
          name: 'Baseline',
          versionNumber: 1,
          status: 'DRAFT',
          fxSnapshot: [],
          workItems: [
            {
              id: 'wi-1',
              versionId: 'ver-1',
              parentId: null,
              name: 'Discovery',
              type: 'WORKSTREAM',
              assignments: [],
              children: [],
            },
          ],
          scenarios: [],
          approvals: [],
          comments: [],
          activityEvents: [],
          createdAt: '2024-10-01T09:00:00Z',
          updatedAt: '2024-10-01T09:00:00Z',
        },
      ],
    });

    expect(result.versions[0].versionNumber).toBe(1);
  });
});
