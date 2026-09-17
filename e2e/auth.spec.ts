import { expect, test } from '@playwright/test';

/** Covers the passwordless login journey against the live frontend and backend. */
test('requests and verifies an OTP through the real authentication boundary', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Email address').fill('person@example.com');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Verification code')).toBeVisible();
  await page.getByLabel('Verification code').fill('1234');
  await page.getByRole('button', { name: 'Verify access' }).click();
  await expect(page.getByRole('status')).toContainText('You are verified as person@example.com');
  expect(pageErrors).toEqual([]);
});
