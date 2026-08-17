import { expect, test } from '@playwright/test';

/**
 * The critical guest journey against the seeded sample wedding registry:
 * open the invitation, identify as a guest, reserve a gift, then use the
 * private management link to change and finally cancel the reservation.
 */
test('guest can view an event, reserve a gift, and manage the reservation', async ({ page }) => {
  // 1. Open the public invitation.
  await page.goto('/e/maya-and-jordan');
  await expect(page.getByRole('heading', { name: 'Maya & Jordan are getting married' })).toBeVisible();
  await expect(page.getByText('Hollis Farm, Petaluma, California')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The gift list' })).toBeVisible();

  // Canvas fields render on the invitation.
  await expect(page.getByText('5:00 to 9:00 PM', { exact: false })).toBeVisible();

  // Purchaser names are visible to guests (public mode).
  await expect(page.getByText('Amara Osei')).toBeVisible();

  // 2. Pick an available gift and open the reserve form.
  const card = page.locator('article', { hasText: 'Wool picnic blanket' });
  await expect(card.getByText('2 of 2 still available')).toBeVisible();
  await card.getByRole('button', { name: /bring this/ }).click();

  // 3. Identify as a guest and reserve one.
  await card.getByLabel('Your name').fill('Priya Test');
  await card.getByLabel('Your email').fill('priya@example.com');
  await card.getByLabel('How many are you bringing?').fill('1');
  await card.getByRole('button', { name: 'Reserve this gift' }).click();

  // 4. Success: private management link is issued.
  await expect(card.getByText('Reserved! Save your private link below.')).toBeVisible();
  const managementUrl = (await card.getByTestId('management-link').textContent())?.trim();
  expect(managementUrl).toMatch(/\/reservation\/[A-Za-z0-9_-]+/);

  // The registry now reflects the claim.
  await expect(card.getByText('1 of 2 still available')).toBeVisible();
  await expect(card.getByText('Priya Test')).toBeVisible();

  // 5. Manage the reservation via the private link — update the quantity.
  await page.goto(managementUrl!);
  await expect(
    page.getByRole('heading', { name: /Priya Test, you.re bringing 1 × Wool picnic blanket/ }),
  ).toBeVisible();

  await page.getByLabel('Quantity').fill('2');
  await page.getByRole('button', { name: 'Save change' }).click();
  await expect(page.getByText("Updated! You're now bringing 2.")).toBeVisible();

  // The public page shows the gift fully claimed.
  await page.goto('/e/maya-and-jordan');
  await expect(
    page.locator('article', { hasText: 'Wool picnic blanket' }).getByText('Fully claimed. Thank you!'),
  ).toBeVisible();

  // 6. Cancel the reservation (two-step confirmation).
  await page.goto(managementUrl!);
  await page.getByRole('button', { name: 'Cancel reservation' }).click();
  await page.getByRole('button', { name: 'Yes, cancel my reservation' }).click();
  await expect(page.getByText('Reservation cancelled')).toBeVisible();

  // 7. Inventory is freed and the management link is dead.
  await page.goto('/e/maya-and-jordan');
  await expect(
    page.locator('article', { hasText: 'Wool picnic blanket' }).getByText('2 of 2 still available'),
  ).toBeVisible();

  await page.goto(managementUrl!);
  await expect(page.getByText('slipped out of its envelope')).toBeVisible();
});
