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
  await Promise.all([
    page.waitForURL(/\/login$/),
    page.getByRole('link', { name: /continue to sign in/i }).click()
  ]);
  await page.getByLabel('Mobile number').fill('9876543210');
  const loginResponse = page.waitForResponse((response) => response.url().includes('/api/auth/login') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Continue' }).click();
  expect((await loginResponse).status()).toBe(200);
  await page.getByLabel('Verification code').fill('1234');
  const verificationResponse = page.waitForResponse((response) => response.url().includes('/api/auth/verify') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Verify access' }).click();
  expect((await verificationResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/movies$/);
}

test('rejects an invalid OTP in the browser and stays on the verification step', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('0000');
  const verificationResponse = page.waitForResponse((response) => response.url().includes('/api/auth/verify') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Verify access' }).click();
  expect((await verificationResponse).status()).toBe(401);
  await expect(page.getByText('The verification code is incorrect.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Verification code')).toBeVisible();
  await expect(page).not.toHaveURL(/\/movies$/);
  expect(browserErrors.filter((message) => !message.includes('status of 401'))).toEqual([]);
});

test('authenticates through mobile OTP and routes to API-backed movies without storing a token', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await authenticateFromHome(page);
  await expect(page.getByRole('heading', { name: 'Choose a movie.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select Paradise' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(window.localStorage))).not.toContain('sessionToken');
  await page.screenshot({ path: 'test-results/auth-movies-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
