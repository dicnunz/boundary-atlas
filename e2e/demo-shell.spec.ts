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
    await expect(page.getByRole('heading', { name: /TypeScript and JavaScript repos/i })).toBeVisible();
    await expect(page.getByText('Boundary Atlas').first()).toBeVisible();
    await expect(page.locator('.finding-card')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Optional $5 support receipt' })).toHaveAttribute(
      'href',
      'https://nicdunz.gumroad.com/l/smrimu'
    );
    await expect(page.getByRole('link', { name: 'Browser Operator OS $39' })).toHaveAttribute(
      'href',
      'https://nicdunz.gumroad.com/l/agent-browser-operator-os'
    );
    await expect(page.getByRole('link', { name: 'Mini audit $149' })).toHaveAttribute(
      'href',
      'https://nicdunz.gumroad.com/l/agent-workflow-mini-audit'
    );
    await expect(page.getByRole('link', { name: 'Workflow audit $750' })).toHaveAttribute(
      'href',
      'https://nicdunz.gumroad.com/l/agent-workflow-audit'
    );
    await expect(page.getByText('No private source, secrets, credentials')).toBeVisible();
    await expect(page.locator('.finding-row').first()).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'package' })).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'folder' })).toBeVisible();
    await expect(page.locator('.granularity-toggle button', { hasText: 'file' })).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('lets the user switch graph scope and inspect findings', async ({ page }) => {
    await page.goto('/');

    await page.locator('.granularity-toggle button', { hasText: 'folder' }).click();
    await expect(page.getByRole('heading', { name: 'Folder view' })).toBeVisible();

    await page.getByRole('button', { name: /Cross-feature fan-out from src\/features\/reporting/i }).click();
    await expect(page.locator('.finding-card')).toBeVisible();
    await expect(page.locator('.finding-card h3')).toContainText('Cross-feature fan-out');
  });
});
