import { expect, test } from '@playwright/test';

test.describe('Boundary Atlas report viewer', () => {
  test('renders the interactive demo report without runtime errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');

    await expect(page).toHaveTitle(/Boundary Atlas/i);
    await expect(page.getByRole('heading', { name: /architecture radar/i })).toBeVisible();
    await expect(page.getByText('Boundary Atlas').first()).toBeVisible();
    await expect(page.locator('.finding-row').first()).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'package' })).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'folder' })).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'file' })).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('lets the user switch graph scope and inspect findings', async ({ page }) => {
    await page.goto('/');

    await page.locator('.granularity-toggle button', { hasText: 'file' }).click();
    await expect(page.getByRole('heading', { name: 'File view' })).toBeVisible();

    await page.locator('.finding-row').first().click();
    await expect(page.locator('.finding-card')).toBeVisible();
    await expect(page.locator('.finding-card h3')).toBeVisible();
  });
});
