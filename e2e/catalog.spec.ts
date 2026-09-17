import { expect, test, type Page } from '../frontend/node_modules/@playwright/test';

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function authenticateFromHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: /continue to sign in/i }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('1234');
  await page.getByRole('button', { name: 'Verify access' }).click();
  await expect(page).toHaveURL(/\/movies$/);
}

test('loads API catalogue data and mapped theatres after an authenticated selection', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  const moviesResponse = page.waitForResponse((response) => response.url().includes('/api/movies') && response.request().method() === 'GET');
  await authenticateFromHome(page);
  expect((await moviesResponse).status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Select Paradise' })).toBeVisible();
  const theatresResponse = page.waitForResponse((response) => response.url().includes('/api/theatres?movieId=movie-paradise'));
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  expect((await theatresResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/theatres$/);
  await expect(page.getByRole('button', { name: 'Select Sandhya 70mm' })).toBeVisible();
  await page.screenshot({ path: 'test-results/catalog-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
