import { test, expect } from '@playwright/test';

const ADMIN_TOKEN = 'e92cd158b2d80a24c9cfd7f839b5d0cb14fcec59';
const LOGS_URL = 'http://localhost:3003/logs';

test.describe('Expandable Logs (Admin Panel)', () => {
  test.beforeEach(async ({ page }) => {
    // Set authentication in localStorage before page load
    await page.addInitScript(token => {
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', 'admin');
    }, ADMIN_TOKEN);
    await page.goto(LOGS_URL);
  });

  test('should load logs and expand/collapse rows', async ({ page }) => {
    // Wait for logs table to appear
    await expect(page.getByText('Логи заказов')).toBeVisible();
    // Find first chevron button and click to expand
    const chevrons = page.locator('button[variant="ghost"] svg');
    await expect(chevrons.first()).toBeVisible();
    await chevrons.first().click();
    // Expanded row should appear
    await expect(page.locator('text=Полное описание')).toBeVisible();
    // Collapse
    await chevrons.first().click();
    await expect(page.locator('text=Полное описание')).not.toBeVisible();
  });

  test('should open and close order details modal', async ({ page }) => {
    // Click on first order badge (e.g., #61)
    const orderBadge = page.locator('td .badge').first();
    await orderBadge.click();
    // Modal should appear
    await expect(page.getByText('Детали заказа')).toBeVisible();
    // Close modal (click outside or close button)
    await page.keyboard.press('Escape');
    await expect(page.getByText('Детали заказа')).not.toBeVisible();
  });

  test('should load more logs with pagination', async ({ page }) => {
    // Click "Загрузить еще" if present
    const loadMore = page.getByRole('button', { name: /Загрузить еще/i });
    if (await loadMore.isVisible()) {
      await loadMore.click();
      // Wait for more logs to load (check for increased row count)
      await page.waitForTimeout(1000);
      // No error should appear
      await expect(page.locator('.text-destructive')).toHaveCount(0);
    }
  });

  test('should switch between tabs', async ({ page }) => {
    // Switch to Transaction Logs
    await page.getByRole('tab', { name: /Логи транзакций/i }).click();
    await expect(page.getByText('Логи транзакций')).toBeVisible();
    // Switch to All
    await page.getByRole('tab', { name: /Всё/i }).click();
    await expect(page.getByText('Логи заказов')).toBeVisible();
    await expect(page.getByText('Логи транзакций')).toBeVisible();
  });
});
