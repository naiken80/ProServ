import { expect, test, type APIRequestContext } from '@playwright/test';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api';

async function createProject(
  request: APIRequestContext,
  user: { id: string; email: string },
  overrides?: Partial<{
    name: string;
    clientName: string;
    startDate: string;
    billingModel: 'TIME_AND_MATERIAL' | 'FIXED_PRICE' | 'RETAINER' | 'MANAGED_SERVICE';
    baseCurrency: string;
  }>,
) {
  const payload = {
    name: overrides?.name ?? `Workspace ${Date.now()}`,
    clientName: overrides?.clientName ?? 'Playwright Client',
    startDate: overrides?.startDate ?? '2025-01-01',
    baseCurrency: overrides?.baseCurrency ?? 'USD',
    billingModel: overrides?.billingModel ?? 'TIME_AND_MATERIAL',
  };

  const response = await request.post(`${apiUrl}/v1/projects`, {
    headers: {
      'Content-Type': 'application/json',
      'x-proserv-user-id': user.id,
      'x-proserv-user-email': user.email,
    },
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe('Project workspace management', () => {
  test('allows metadata edits and updates the dashboard optimistically', async ({ page, request }) => {
    const sessionUser = { id: 'engagement-lead', email: 'engagement.lead@proserv.local' };
    const originalName = `Workspace ${Date.now()}`;
    const summary = await createProject(request, sessionUser, {
      name: originalName,
      clientName: 'Initial Client',
    });

    await page.goto(`/projects/${summary.id}`);

    const renamed = `${originalName} - Updated`;
    const rebrandedClient = 'Updated Client Co';
    const newBaseline = 'Rev Alpha';

    await page.getByLabel('Project name').fill(renamed);
    await page.getByLabel('Client').fill(rebrandedClient);
    await page.getByLabel('Baseline label').fill(newBaseline);
    await page.getByLabel('Rate card').selectOption({ label: 'EMEA Nearshore FY25' });
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText(renamed)).toBeVisible();
    await expect(page.getByText(rebrandedClient)).toBeVisible();
    await expect(page.getByText(newBaseline)).toBeVisible();
    await expect(page.getByText('EMEA Nearshore FY25')).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByText(renamed, { exact: false })).toBeVisible();
    await expect(page.getByText(rebrandedClient, { exact: false })).toBeVisible();
  });

  test('only displays projects owned by the signed-in user', async ({ page, request }) => {
    const sessionUser = { id: 'engagement-lead', email: 'engagement.lead@proserv.local' };
    const otherUser = { id: 'finance-lead', email: 'finance.lead@proserv.local' };

    const owned = await createProject(request, sessionUser, {
      name: `Owned Workspace ${Date.now()}`,
      clientName: 'Exclusive Client',
    });

    const hiddenName = `Hidden Workspace ${Date.now()}`;
    await createProject(request, otherUser, {
      name: hiddenName,
      clientName: 'Private Client',
    });

    await page.goto('/projects');

    await expect(page.getByText(owned.name)).toBeVisible();
    await expect(page.getByText(hiddenName)).toHaveCount(0);
  });
});
