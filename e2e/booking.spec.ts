import { expect, test, type Page } from '../frontend/node_modules/@playwright/test';

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function reachCheckoutFromHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: /continue to sign in/i }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('1234');
  await page.getByRole('button', { name: 'Verify access' }).click();
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

test('submits a Card booking after exactly two seconds and renders backend confirmation data', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await reachCheckoutFromHome(page);
  await page.getByRole('radio', { name: 'Card' }).check();
  const bookingResponse = page.waitForResponse((response) => response.url().includes('/api/bookings') && response.request().method() === 'POST');
  const submittedAt = Date.now();
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  await expect(page.getByRole('status')).toHaveText('Processing Payment...');
  const response = await bookingResponse;
  expect(Date.now() - submittedAt).toBeGreaterThanOrEqual(2_000);
  expect(response.status()).toBe(201);
  const payload = await response.json();
  expect(payload.booking.movie.title).toBe('Paradise');
  expect(payload.booking.theatre.name).toBe('Sandhya 70mm');
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText(payload.booking.confirmationId)).toBeVisible();
  await page.screenshot({ path: 'test-results/card-confirmation-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

test('submits a UPI booking and rejects unauthenticated access to the protected API', async ({ page, request }) => {
  const browserErrors = captureBrowserErrors(page);
  const unauthenticatedResponse = await request.post('/api/bookings', {
    data: { movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1'], paymentMethod: 'UPI', totalPricePaise: 15000 },
    headers: { 'Idempotency-Key': '00000000-0000-4000-8000-000000000001' }
  });
  expect(unauthenticatedResponse.status()).toBe(401);
  await reachCheckoutFromHome(page);
  await page.getByRole('radio', { name: 'UPI' }).check();
  const bookingResponse = page.waitForResponse((response) => response.url().includes('/api/bookings') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  expect((await bookingResponse).status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await page.screenshot({ path: 'test-results/upi-confirmation-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

test('guards a direct initial checkout entry without transient journey data', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Complete your booking journey first.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/checkout-guard-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

test('redirects a direct initial confirmation entry without backend confirmation data', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/confirmation');
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Complete your booking journey first.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/confirmation-guard-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
