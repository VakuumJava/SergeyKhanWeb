# Test info

- Name: Expandable Logs (Admin Panel) >> should open and close order details modal
- Location: /Users/bekzhan/Documents/projects/sit/sergeykh-main/apps/super-admin/tests/expandable-logs.spec.ts:30:3

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('td .badge').first()

    at /Users/bekzhan/Documents/projects/sit/sergeykh-main/apps/super-admin/tests/expandable-logs.spec.ts:33:22
```

# Page snapshot

```yaml
- img
- text: test_frontend@gmail.com super-admin Основные
- list:
  - listitem:
    - link "Главная":
      - /url: /
      - img
      - text: Главная
- text: Инструменты
- list:
  - listitem:
    - link "Заказы":
      - /url: /orders
      - img
      - text: Заказы
  - listitem:
    - link "Не обзвоненные":
      - /url: /not_called
      - img
      - text: Не обзвоненные
  - listitem:
    - link "Управление всеми":
      - /url: /users-management
      - img
      - text: Управление всеми
  - listitem:
    - link "Управление балансами":
      - /url: /balance-management
      - img
      - text: Управление балансами
  - listitem:
    - link "Управление процентами":
      - /url: /percentages-management
      - img
      - text: Управление процентами
  - listitem:
    - link "Управление дистанционкой":
      - /url: /distance-management
      - img
      - text: Управление дистанционкой
  - listitem:
    - link "Логи":
      - /url: /logs
      - img
      - text: Логи
  - listitem:
    - link "Финансы":
      - /url: /finance
      - img
      - text: Финансы
- text: Формы
- list:
  - listitem:
    - link "Форма для заказа":
      - /url: /form_for_order
      - img
      - text: Форма для заказа
  - listitem:
    - link "Форма для аккаунта":
      - /url: /form
      - img
      - text: Форма для аккаунта
- text: Абоненты
- list:
  - listitem:
    - link "Абоненты":
      - /url: /abonents
      - img
      - text: Абоненты
- list:
  - listitem:
    - button "test_frontend@gmail.com test_frontend@gmail.com":
      - img "test_frontend@gmail.com"
      - text: test_frontend@gmail.com
      - img
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
      - tab "📋 Логи заказов" [selected]
      - tab "💰 Логи транзакций"
      - tab "📊 Всё"
    - tabpanel "📋 Логи заказов":
      - text: Логи заказов 20 История действий с заказами
      - table:
        - rowgroup:
          - row "ID Заказ Действие Описание Выполнил Дата":
            - cell
            - cell "ID"
            - cell "Заказ"
            - cell "Действие"
            - cell "Описание"
            - cell "Выполнил"
            - cell "Дата"
        - rowgroup:
          - 'row "#32 #61 Одобрен Заказ #61 одобрен администратором admin@test.com admin@test.com 01.06.2025, 15:09"':
            - cell:
              - button:
                - img
            - cell "#32"
            - cell "#61"
            - cell "Одобрен"
            - 'cell "Заказ #61 одобрен администратором admin@test.com"'
            - cell "admin@test.com"
            - cell "01.06.2025, 15:09"
          - 'row "#31 #61 Завершен Заказ #61 завершен гарантийным мастером warranty@test.com warranty@test.com 01.06.2025, 15:09"':
            - cell:
              - button:
                - img
            - cell "#31"
            - cell "#61"
            - cell "Завершен"
            - 'cell "Заказ #61 завершен гарантийным мастером warranty@test.com"'
            - cell "warranty@test.com"
            - cell "01.06.2025, 15:09"
          - 'row "#30 #61 Переведен на гарантию Заказ #61 передан гарантийному мастеру warranty@test.com master@test.com 01.06.2025, 15:09"':
            - cell:
              - button:
                - img
            - cell "#30"
            - cell "#61"
            - cell "Переведен на гарантию"
            - 'cell "Заказ #61 передан гарантийному мастеру warranty@test.com"'
            - cell "master@test.com"
            - cell "01.06.2025, 15:09"
          - 'row "#29 #61 Мастер назначен Мастер master@test.com назначен на заказ #61 admin@test.com 01.06.2025, 15:09"':
            - cell:
              - button:
                - img
            - cell "#29"
            - cell "#61"
            - cell "Мастер назначен"
            - 'cell "Мастер master@test.com назначен на заказ #61"'
            - cell "admin@test.com"
            - cell "01.06.2025, 15:09"
          - 'row "#28 #60 Одобрен Заказ #60 одобрен администратором admin@example.com admin@example.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#28"
            - cell "#60"
            - cell "Одобрен"
            - 'cell "Заказ #60 одобрен администратором admin@example.com"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:40"
          - 'row "#27 #60 Завершен Заказ #60 завершен гарантийным мастером test_warranty_integration@test.com. Integration test completion test_warranty_integration@test.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#27"
            - cell "#60"
            - cell "Завершен"
            - 'cell "Заказ #60 завершен гарантийным мастером test_warranty_integration@test.com. Integration test completion"'
            - cell "test_warranty_integration@test.com"
            - cell "01.06.2025, 13:40"
          - 'row "#26 #60 Переведен на гарантию Заказ #60 передан гарантийному мастеру test_warranty_integration@test.com test_master_integration@test.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#26"
            - cell "#60"
            - cell "Переведен на гарантию"
            - 'cell "Заказ #60 передан гарантийному мастеру test_warranty_integration@test.com"'
            - cell "test_master_integration@test.com"
            - cell "01.06.2025, 13:40"
          - 'row "#25 #60 Мастер назначен Мастер test_master_integration@test.com назначен на заказ #60 admin@example.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#25"
            - cell "#60"
            - cell "Мастер назначен"
            - 'cell "Мастер test_master_integration@test.com назначен на заказ #60"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:40"
          - 'row "#24 #60 Обновлен Заказ #60 обновлен: status: новый → в обработке admin@example.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#24"
            - cell "#60"
            - cell "Обновлен"
            - 'cell "Заказ #60 обновлен: status: новый → в обработке"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:40"
          - 'row "#23 #60 Создан Заказ #60 создан Система 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#23"
            - cell "#60"
            - cell "Создан"
            - 'cell "Заказ #60 создан"'
            - cell "Система"
            - cell "01.06.2025, 13:40"
          - 'row "#22 #59 Переведен на гарантию Заказ #59 передан гарантийному мастеру test-warrant-master@example.com test_master_integration@test.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#22"
            - cell "#59"
            - cell "Переведен на гарантию"
            - 'cell "Заказ #59 передан гарантийному мастеру test-warrant-master@example.com"'
            - cell "test_master_integration@test.com"
            - cell "01.06.2025, 13:40"
          - 'row "#21 #59 Мастер назначен Мастер test_master_integration@test.com назначен на заказ #59 admin@example.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#21"
            - cell "#59"
            - cell "Мастер назначен"
            - 'cell "Мастер test_master_integration@test.com назначен на заказ #59"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:40"
          - 'row "#20 #59 Обновлен Заказ #59 обновлен: status: новый → в обработке admin@example.com 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#20"
            - cell "#59"
            - cell "Обновлен"
            - 'cell "Заказ #59 обновлен: status: новый → в обработке"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:40"
          - 'row "#19 #59 Создан Заказ #59 создан Система 01.06.2025, 13:40"':
            - cell:
              - button:
                - img
            - cell "#19"
            - cell "#59"
            - cell "Создан"
            - 'cell "Заказ #59 создан"'
            - cell "Система"
            - cell "01.06.2025, 13:40"
          - 'row "#18 #58 Мастер назначен Мастер andrey@gmail.com назначен на заказ #58 admin@example.com 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#18"
            - cell "#58"
            - cell "Мастер назначен"
            - 'cell "Мастер andrey@gmail.com назначен на заказ #58"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:39"
          - 'row "#17 #58 Обновлен Заказ #58 обновлен: status: новый → в обработке admin@example.com 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#17"
            - cell "#58"
            - cell "Обновлен"
            - 'cell "Заказ #58 обновлен: status: новый → в обработке"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:39"
          - 'row "#16 #58 Создан Заказ #58 создан Система 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#16"
            - cell "#58"
            - cell "Создан"
            - 'cell "Заказ #58 создан"'
            - cell "Система"
            - cell "01.06.2025, 13:39"
          - 'row "#15 #57 Мастер назначен Мастер andrey@gmail.com назначен на заказ #57 admin@example.com 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#15"
            - cell "#57"
            - cell "Мастер назначен"
            - 'cell "Мастер andrey@gmail.com назначен на заказ #57"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:39"
          - 'row "#14 #57 Обновлен Заказ #57 обновлен: status: новый → в обработке admin@example.com 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#14"
            - cell "#57"
            - cell "Обновлен"
            - 'cell "Заказ #57 обновлен: status: новый → в обработке"'
            - cell "admin@example.com"
            - cell "01.06.2025, 13:39"
          - 'row "#13 #57 Создан Заказ #57 создан Система 01.06.2025, 13:39"':
            - cell:
              - button:
                - img
            - cell "#13"
            - cell "#57"
            - cell "Создан"
            - 'cell "Заказ #57 создан"'
            - cell "Система"
            - cell "01.06.2025, 13:39"
      - button "Загрузить еще"
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
> 33 |     await orderBadge.click();
     |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  56 |     await expect(page.getByText('Логи транзакций')).toBeVisible();
  57 |     // Switch to All
  58 |     await page.getByRole('tab', { name: /Всё/i }).click();
  59 |     await expect(page.getByText('Логи заказов')).toBeVisible();
  60 |     await expect(page.getByText('Логи транзакций')).toBeVisible();
  61 |   });
  62 | });
  63 |
```