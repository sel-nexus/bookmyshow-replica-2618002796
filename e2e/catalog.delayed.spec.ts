import { expect, test, type Page } from '../frontend/node_modules/@playwright/test';

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('shows loading movies before delayed real catalogue data appears', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('1234');
  await page.getByRole('button', { name: 'Verify access' }).click();

  await expect(page).toHaveURL(/\/movies$/);
  await expect(page.getByRole('status')).toHaveText('Loading movies…');
  await expect(page.getByRole('button', { name: 'Select Paradise' })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
