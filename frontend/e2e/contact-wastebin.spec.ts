import { expect, test } from '@playwright/test';

test('wastebin', async ({ page }) => {
  /*
  STARTUP
  
  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();

  /*
  ERIK SHOULD BE VISIBLE

  Verify that Erik is in the list and delete-button is visible
  And the total amount of contacts should be 30
  */

  await expect(
    page.getByLabel('Contact: Erik Andersson').getByLabel('Expand contact details'),
  ).toMatchAriaSnapshot(`
    - button "Expand contact details":
      - text: /\\d+-\\d+-\\d+ Erik Andersson Volvo AB/
      - button "Delete Erik Andersson"
    `);
  await expect(page.getByText('Contacts30')).toBeVisible(); // 30 contacts in total

  /*
  REMOVE ERIK

  Remove Erik. Now only 29 contacts should be left
  Click on "wastebin". Erik should be visible in the wastebin
  A detail: the menu item "Contact"should not be marked as current page
  */

  await page.getByRole('button', { name: 'Delete Erik Andersson' }).click();
  await expect(page.getByText('Contacts29')).toBeVisible();
  await page.getByRole('link', { name: 'Wastebin' }).click();
  await expect(page.getByText('Deleted Contacts1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contacts', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page',
  );

  await expect(page.getByLabel('Expand contact details')).toMatchAriaSnapshot(` 
    - button "Expand contact details":
      - text: /\\d+-\\d+-\\d+ Erik Andersson Volvo AB/
      - button "Restore Erik Andersson"
      - button "Permanently delete Erik Andersson"
    `);

  /*
  RESTORE ERIK
  
  Click to restore Erik. 
  The wastebin should now be empty
  Go to Contacts and we should have 30 contacts again, and Erik should be visible again
  */

  await page.getByRole('button', { name: 'Restore Erik Andersson' }).click();
  await expect(page.getByRole('status', { name: 'Wastebin is empty' })).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await expect(page.getByText('Contacts30')).toBeVisible();
  await expect(
    page
      .getByRole('article', { name: 'Contact: Erik Andersson' })
      .getByLabel('Expand contact details'),
  ).toBeVisible();
});
