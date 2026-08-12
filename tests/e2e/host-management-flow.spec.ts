import { expect, test } from '@playwright/test';

/**
 * Host journey against the seeded demo account: sign in, open the dashboard,
 * check surprise-mode masking, and add/remove a gift.
 */
test('host can sign in, see masked reservations, and manage gifts', async ({ page }) => {
  // 1. Sign in as the demo host.
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@giftcircle.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // 2. Dashboard lists the seeded events.
  await expect(page.getByRole('heading', { name: 'Hello, Maya Whitfield' })).toBeVisible();
  await expect(page.getByText('Maya & Jordan are getting married')).toBeVisible();

  // 3. Open the surprise-mode baby shower.
  await page.getByText('A shower for Baby Whitfield').click();
  await expect(page.getByRole('heading', { name: 'A shower for Baby Whitfield' })).toBeVisible();

  // Surprise mode: the host sees quantities but not the guest's name.
  await expect(page.getByText('Surprise mode is on')).toBeVisible();
  await expect(page.getByText('A guest (surprise!)')).toBeVisible();
  await expect(page.getByText('Dev Raghunathan')).toHaveCount(0);

  // 4. Add a gift.
  await page.getByLabel('Gift name').last().fill('Night light');
  await page.getByLabel('How many would you like?').last().fill('2');
  await page.getByRole('button', { name: 'Add gift to the list' }).click();
  await expect(page.getByText('Added “Night light” to the list.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Night light' })).toBeVisible();

  // 5. The guest page shows the new gift.
  await page.goto('/e/baby-whitfield-shower');
  await expect(page.getByRole('heading', { name: 'Night light' })).toBeVisible();

  // 6. Remove it again (confirmation dialog).
  await page.goto('/dashboard');
  await page.getByText('A shower for Baby Whitfield').click();
  const giftRow = page.locator('li', { has: page.getByRole('heading', { name: 'Night light' }) });
  page.once('dialog', (dialog) => dialog.accept());
  await giftRow.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('heading', { name: 'Night light' })).toHaveCount(0);

  // 7. Sign out returns to the landing page.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Host an event' }).first()).toBeVisible();
});
