import { projectSchema, projectSummarySchema, rateCardSchema, roleCollectionSchema } from './index';

describe('shared schemas', () => {
  it('validates project summaries', () => {
    const summary = projectSummarySchema.parse({
      id: 'proj-1',
      name: 'Field Service AI Assistant',
      client: 'Helios Utilities',
      owner: 'Amanda Singh',
      status: 'estimating',
      startDate: '2024-09-01',
      billingModel: 'TIME_AND_MATERIAL',
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
      baselineRateCardId: 'card-1',
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

  it('validates rate card structures', () => {
    const rateCard = rateCardSchema.parse({
      id: 'card-1',
      organizationId: 'org-1',
      name: 'Default FY25',
      currency: 'USD',
      validFrom: null,
      validTo: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
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
    });

    expect(rateCard.entries[0].role.code).toBe('ARCH');
    expect(rateCard.entries[0].billRate).toBeGreaterThan(0);
  });

  it('validates role collection payloads', () => {
    const collection = roleCollectionSchema.parse({
      data: [
        {
          id: 'role-1',
          organizationId: 'org-1',
          code: 'ARCH',
          name: 'Architect',
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          archivedAt: null,
        },
      ],
      meta: {
        total: 1,
        activeCount: 1,
        archivedCount: 0,
      },
    });

    expect(collection.meta.total).toBe(1);
    expect(collection.data[0].code).toBe('ARCH');
  });
});
