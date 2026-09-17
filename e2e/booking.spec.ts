import { test, expect } from '@playwright/test';

test('authenticates, selects catalogue data, and renders backend booking confirmation', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto('http://localhost:3000/login');
  await page.getByLabel(/mobile/i).fill('9876543210');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel(/otp/i).fill('1234');
  await page.getByRole('button', { name: /verify/i }).click();
  await page.getByRole('button', { name: /Paradise/i }).click();
  await page.getByRole('button', { name: /Sandhya 70mm/i }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await page.getByLabel('Card Number').fill('4111111111111111');
  await page.getByLabel('Expiry').fill('12/30');
  await page.getByLabel('CVV').fill('123');
  await page.getByRole('button', { name: /Pay/ }).click();
  await expect(page.getByText('Processing Payment...')).toBeVisible();
  await expect(page.getByText('Your seats are reserved.')).toBeVisible();
  await expect(page.getByText('Paradise')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
