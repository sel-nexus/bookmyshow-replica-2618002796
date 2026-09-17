import { expect, test } from '@playwright/test';

/** Covers deliberate API-backed movie and theatre choices against live services. */
test('selects a movie before fetching and selecting its mapped theatre', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/movies');
  await expect(page.getByRole('button', { name: 'Select Paradise' })).toBeVisible();
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await expect(page).toHaveURL(/\/theatres$/);
  await expect(page.getByRole('button', { name: 'Select Sandhya 70mm' })).toBeVisible();
  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  expect(pageErrors).toEqual([]);
});
