# Test info

- Name: Expandable Logs (Admin Panel) >> should switch between tabs
- Location: /Users/bekzhan/Documents/projects/sit/sergeykh-main/apps/super-admin/tests/expandable-logs.spec.ts:53:3

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: getByText('Логи транзакций') resolved to 2 elements:
    1) <button role="tab" tabindex="0" type="button" data-state="active" aria-selected="true" data-orientation="horizontal" data-radix-collection-item="" id="radix-:R17rqnl7:-trigger-logs" aria-controls="radix-:R17rqnl7:-content-logs" class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disab…>💰 Логи транзакций</button> aka getByRole('tab', { name: '💰 Логи транзакций' })
    2) <div class="font-semibold leading-none tracking-tight">Логи транзакций</div> aka getByText('Логи транзакций', { exact: true })

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByText('Логи транзакций')

    at /Users/bekzhan/Documents/projects/sit/sergeykh-main/apps/super-admin/tests/expandable-logs.spec.ts:56:53
```

# Page snapshot

```yaml
- text: Загрузка...
- main:
  - button "Toggle Sidebar":
    - img
    - text: Toggle Sidebar
  - navigation "breadcrumb":
    - list:
      - listitem:
        - link "logs" [disabled]
  - button "Сменить тему":
    - img
    - img
    - text: Сменить тему
  - main:
    - heading "Система мониторинга" [level=1]
    - paragraph: Логи заказов и транзакций в реальном времени
    - tablist:
      - tab "📋 Логи заказов"
      - tab "💰 Логи транзакций" [selected]
      - tab "📊 Всё"
    - paragraph: Загрузка данных...
    - paragraph: Пожалуйста, подождите
    - tabpanel "💰 Логи транзакций":
      - text: Логи транзакций История финансовых операций
      - table:
        - rowgroup:
          - row "ID Тип транзакции Сумма Описание Пользователь Выполнил Дата":
            - cell "ID"
            - cell "Тип транзакции"
            - cell "Сумма"
            - cell "Описание"
            - cell "Пользователь"
            - cell "Выполнил"
            - cell "Дата"
        - rowgroup
- status:
  - img
  - text: Static route
  - button "Hide static indicator":
    - img
- alert
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const ADMIN_TOKEN = 'e92cd158b2d80a24c9cfd7f839b5d0cb14fcec59';
   4 | const LOGS_URL = 'http://localhost:3003/logs';
   5 |
   6 | test.describe('Expandable Logs (Admin Panel)', () => {
   7 |   test.beforeEach(async ({ page }) => {
   8 |     // Set authentication in localStorage before page load
   9 |     await page.addInitScript(token => {
  10 |       localStorage.setItem('token', token);
  11 |       localStorage.setItem('userRole', 'admin');
  12 |     }, ADMIN_TOKEN);
  13 |     await page.goto(LOGS_URL);
  14 |   });
  15 |
  16 |   test('should load logs and expand/collapse rows', async ({ page }) => {
  17 |     // Wait for logs table to appear
  18 |     await expect(page.getByText('Логи заказов')).toBeVisible();
  19 |     // Find first chevron button and click to expand
  20 |     const chevrons = page.locator('button[variant="ghost"] svg');
  21 |     await expect(chevrons.first()).toBeVisible();
  22 |     await chevrons.first().click();
  23 |     // Expanded row should appear
  24 |     await expect(page.locator('text=Полное описание')).toBeVisible();
  25 |     // Collapse
  26 |     await chevrons.first().click();
  27 |     await expect(page.locator('text=Полное описание')).not.toBeVisible();
  28 |   });
  29 |
  30 |   test('should open and close order details modal', async ({ page }) => {
  31 |     // Click on first order badge (e.g., #61)
  32 |     const orderBadge = page.locator('td .badge').first();
  33 |     await orderBadge.click();
  34 |     // Modal should appear
  35 |     await expect(page.getByText('Детали заказа')).toBeVisible();
  36 |     // Close modal (click outside or close button)
  37 |     await page.keyboard.press('Escape');
  38 |     await expect(page.getByText('Детали заказа')).not.toBeVisible();
  39 |   });
  40 |
  41 |   test('should load more logs with pagination', async ({ page }) => {
  42 |     // Click "Загрузить еще" if present
  43 |     const loadMore = page.getByRole('button', { name: /Загрузить еще/i });
  44 |     if (await loadMore.isVisible()) {
  45 |       await loadMore.click();
  46 |       // Wait for more logs to load (check for increased row count)
  47 |       await page.waitForTimeout(1000);
  48 |       // No error should appear
  49 |       await expect(page.locator('.text-destructive')).toHaveCount(0);
  50 |     }
  51 |   });
  52 |
  53 |   test('should switch between tabs', async ({ page }) => {
  54 |     // Switch to Transaction Logs
  55 |     await page.getByRole('tab', { name: /Логи транзакций/i }).click();
> 56 |     await expect(page.getByText('Логи транзакций')).toBeVisible();
     |                                                     ^ Error: expect.toBeVisible: Error: strict mode violation: getByText('Логи транзакций') resolved to 2 elements:
  57 |     // Switch to All
  58 |     await page.getByRole('tab', { name: /Всё/i }).click();
  59 |     await expect(page.getByText('Логи заказов')).toBeVisible();
  60 |     await expect(page.getByText('Логи транзакций')).toBeVisible();
  61 |   });
  62 | });
  63 |
```