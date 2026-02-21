import { expect, test } from '@playwright/test';

// Import for Window.__TEST_DATE__ type declaration
import '../src/utils/clock';

test('set follow up date', async ({ page }) => {
  /*
  STARTUP
  
  Reset database and login as Lars
  Set startdate to 2026-02-12 
  */

  await page.addInitScript((date) => {
    window.__TEST_DATE__ = date;
  }, '2026-02-12');

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Lars (Seller)' }).click();

  /*
  CREATE NEW CONTACT

  Create John Doe, and verify that he is visible in the list
  */

  await page.getByRole('button', { name: 'Add new contact' }).first().click();
  await page.getByRole('textbox', { name: 'Name' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('John Doe');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('john@doe.se');
  await page.getByRole('textbox', { name: 'Phone' }).click();
  await page.getByRole('textbox', { name: 'Phone' }).fill('123456789');
  await page.getByRole('textbox', { name: 'Company' }).click();
  await page.getByRole('textbox', { name: 'Company' }).fill('Acme Inc.');
  await page.getByRole('button', { name: 'Create Contact' }).click();

  await expect(page.getByLabel('Contacts', { exact: true })).toMatchAriaSnapshot(`
    - heading "Contacts" [level=2]
    - text: "1"
    `);

  await expect(page.getByLabel('Expand contact details')).toMatchAriaSnapshot(`
        - button "Expand contact details":
          - text: ""
          - button "Delete John Doe"
        `);

  /*
  SET FOLLOWUP-DATE
   
  Set it to 2026-01-01
  */

  await page.getByRole('button', { name: 'Expand contact details' }).click();

  await page.getByText('Add follow-up date').click();
  await page.getByRole('textbox', { name: 'Add follow-up date' }).fill('2026-01-01');
  await page.getByRole('button', { name: 'Collapse contact details' }).click();

  await expect(page.getByLabel('Expand contact details')).toContainText(
    'Expand2026-01-01John DoeAcme Inc.Delete',
  );

  /*
  EDIT FOLLOWUP-DATE
   
  Press the button to add three workdays
  Since today is 2026-02-12 (thursday), the new date should be 2026-02-17 (tuesday)
  */
  await page.getByRole('button', { name: 'Expand contact details' }).click();
  await page.getByRole('button', { name: 'Set follow-up date 3 days' }).click();
  await page.getByRole('button', { name: 'Collapse contact details' }).click();
  await expect(page.getByLabel('Expand contact details')).toContainText(
    'Expand2026-02-17John DoeAcme Inc.Delete',
  );

  /*
  EDIT FOLLOWUP-DATE AGAIN
   
  Press a button to set the date a month from now
  Since today is 2026-02-12 we should bet 2026-03-12
  */

  await page.getByRole('button', { name: 'Expand contact details' }).click();
  await page.getByRole('button', { name: 'Set follow-up date 1 month' }).click();
  await page.getByRole('button', { name: 'Collapse contact details' }).click();
  await expect(page.getByLabel('Expand contact details')).toContainText(
    'Expand2026-03-12John DoeAcme Inc.Delete',
  );
});
