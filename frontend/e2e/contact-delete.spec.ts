import { expect, test } from '@playwright/test';

test('wastebin', async ({ page }) => {
  // Login as Maria

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();

  // Delete a contact

  await expect(
    page
      .getByRole('article', { name: 'Contact: Erik Andersson' })
      .getByLabel('Expand contact details'),
  ).toBeVisible();
  await expect(
    page.getByLabel('Contact: Erik Andersson').getByLabel('Expand contact details'),
  ).toMatchAriaSnapshot(`
    - button "Expand contact details":
      - text: /\\d+-\\d+-\\d+ Erik Andersson Volvo AB/
      - button "Delete Erik Andersson"
    `);
  await expect(page.getByText('Contacts30')).toBeVisible();
  await page.getByRole('button', { name: 'Delete Erik Andersson' }).click();

  // Verify it is in the wastebin

  await expect(page.getByText('Contacts29')).toBeVisible();
  await page.getByRole('link', { name: 'Wastebin' }).click();
  await expect(page.getByText('Deleted Contacts1')).toBeVisible();

  await expect(page.getByLabel('Expand contact details')).toMatchAriaSnapshot(`
    - button "Expand contact details":
      - text: /\\d+-\\d+-\\d+ Erik Andersson Volvo AB/
      - button "Restore Erik Andersson"
      - button "Permanently delete Erik Andersson"
    `);

  // Restore contact

  await page.getByRole('button', { name: 'Restore Erik Andersson' }).click();

  // Verify it is back

  await expect(page.getByRole('status', { name: 'Wastebin is empty' })).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await expect(page.getByText('Contacts30')).toBeVisible();
  await expect(
    page
      .getByRole('article', { name: 'Contact: Erik Andersson' })
      .getByLabel('Expand contact details'),
  ).toBeVisible();
});

test('permanent delete', async ({ page }) => {
  // Login as Maria

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(
    page
      .getByRole('article', { name: 'Contact: Erik Andersson' })
      .getByLabel('Expand contact details'),
  ).toBeVisible();
  await expect(page.getByText('Contacts30')).toBeVisible();

  // Delete contact

  await page.getByRole('button', { name: 'Delete Erik Andersson' }).click();

  // Verify it is in waste bin

  await expect(page.getByText('Contacts29')).toBeVisible();
  await page.getByRole('link', { name: 'Wastebin' }).click();
  await expect(page.getByText('Deleted Contacts1')).toBeVisible();

  // Permanent delete

  await page.getByRole('button', { name: 'Permanently delete Erik' }).click();

  // Verify it is gone

  await expect(page.getByRole('status', { name: 'Wastebin is empty' })).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await expect(page.getByText('Contacts29')).toBeVisible();
});
