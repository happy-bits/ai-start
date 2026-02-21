import { expect, test } from '@playwright/test';

test('permanent delete', async ({ page }) => {
  /*
  STARTUP

  Reset database and login as Maria
  We should see 30 contacts
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(
    page
      .getByRole('article', { name: 'Contact: Erik Andersson' })
      .getByLabel('Expand contact details'),
  ).toBeVisible();
  await expect(page.getByText('Contacts30')).toBeVisible();

  /*
  DELETE ERIK

  Delete Erik. 
  Verify he appears in the wastebin with 29 contacts remaining
  */

  await page.getByRole('button', { name: 'Delete Erik Andersson' }).click();
  await expect(page.getByText('Contacts29')).toBeVisible();
  await page.getByRole('link', { name: 'Wastebin' }).click();
  await expect(page.getByText('Deleted Contacts1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contacts', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page',
  );

  /*
  PERMANENT DELETE

  Permanently delete Erik 
  */

  await page.getByRole('button', { name: 'Permanently delete Erik' }).click();

  /*
  VERIFY REMOVAL

  Wastebin should be empty. Contacts list should show 29 contacts (Erik is gone)
  */

  await expect(page.getByRole('status', { name: 'Wastebin is empty' })).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await expect(page.getByText('Contacts29')).toBeVisible();
});
