import { expect, test } from '@playwright/test';

test.describe('Role catalog and rate cards', () => {
  test('adds a role and surfaces it in the rate card manager', async ({ page }) => {
    await page.goto('/resources');

    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    const roleCode = `QA${suffix}`.slice(0, 5);
    const roleName = `QA Analyst ${suffix}`;
    const description = 'Validates delivery increments';

    await page.getByLabel('Code').first().fill(roleCode);
    await page.getByLabel('Name').first().fill(roleName);
    await page.getByLabel('Description').first().fill(description);
    await page.getByRole('button', { name: 'Add role' }).click();

    const roleButton = page.getByRole('button', { name: roleName, exact: false });
    await expect(roleButton).toBeVisible();
    await roleButton.click();

    const rateCardTable = page.locator('table').first();
    await expect(
      rateCardTable.locator('tbody tr', { hasText: roleName }),
    ).toBeVisible();
    await expect(
      rateCardTable.locator('tbody tr').filter({ hasText: roleCode }),
    ).toBeVisible();
  });
});

