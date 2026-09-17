import { expect, test, type Page } from '../frontend/node_modules/@playwright/test';

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function reachSeatsFromHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: /continue to sign in/i }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('1234');
  await page.getByRole('button', { name: 'Verify access' }).click();
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  await expect(page).toHaveURL(/\/seats$/);
}

test('applies the local seat preset after the authenticated catalogue journey', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiRequests.push(request.url());
  });
  await reachSeatsFromHome(page);
  await expect(page.getByRole('status')).toHaveText('No seats selected.');
  const requestCountBeforeSeats = apiRequests.length;
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(apiRequests.slice(requestCountBeforeSeats)).toEqual([]);
  await page.screenshot({ path: 'test-results/seats-checkout-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
