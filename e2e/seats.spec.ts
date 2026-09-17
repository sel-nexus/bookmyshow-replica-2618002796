import { expect, test } from '@playwright/test';

test('applies the exact local seat preset and continues to checkout', async ({ page }) => {
  const browserErrors: string[] = [];
  const seatActionRequests: string[] = [];
  let recordingSeatActionRequests = false;
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('request', (request) => {
    if (recordingSeatActionRequests) seatActionRequests.push(request.url());
  });

  await page.goto('/movies');
  await page.getByRole('button').first().click();
  await page.getByRole('button').first().click();
  await expect(page).toHaveURL(/\/seats$/);
  await expect(page.getByRole('button', { name: 'Select Seats' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('No seats selected.');

  recordingSeatActionRequests = true;
  await page.getByRole('button', { name: 'Select Seats' }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  expect(seatActionRequests).toEqual([]);
  expect(browserErrors).toEqual([]);
});
