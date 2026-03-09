import { expect, test } from '@playwright/test';

// Import for Window.__TEST_DATE__ type declaration
import '../src/utils/clock';

test('set and display next contact channel', async ({ page }) => {
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

  Create John Doe and verify it appears in list
  */

  await page.getByRole('button', { name: 'Add new contact' }).first().click();
  await page.getByRole('textbox', { name: 'Name' }).fill('John Channel');
  await page.getByRole('textbox', { name: 'Email' }).fill('john.channel@example.com');
  await page.getByRole('textbox', { name: 'Phone' }).fill('123456789');
  await page.getByRole('textbox', { name: 'Company' }).fill('Channel Corp');

  // Set next contact channel in the form
  await page.getByLabel('How to contact next time (optional)').selectOption({ label: 'SMS' });

  await page.getByRole('button', { name: 'Create Contact' }).click();

  // New contact has no follow-up date, so "To contact" shows positive empty state
  await expect(page.getByText('All caught up!')).toBeVisible();

  // Switch to "All" to see the new contact
  await page.getByRole('tab', { name: 'All' }).click();

  const contactArticle = page.getByRole('article', { name: 'Contact: John Channel' });
  await expect(contactArticle).toBeVisible();

  /*
  VERIFY COMPACT VIEW

  The compact row should include the SMS badge
  */

  await expect(contactArticle.getByText('SMS', { exact: true })).toBeVisible();

  /*
  UPDATE NEXT CONTACT CHANNEL INLINE

  Change from SMS to Email and verify both detail and compact views
  */

  await contactArticle.getByLabel('Expand contact details').click();

  const channelButton = contactArticle.getByRole('button', {
    name: 'Preferred next contact channel',
  });
  await channelButton.click();

  // The InlineEditableSelect renders a native select when editing
  await page.getByLabel('Preferred next contact channel').selectOption({ label: 'Email' });

  await contactArticle.getByLabel('Collapse contact details').click();

  // Compact row should now show Email instead of SMS
  await expect(contactArticle.getByText('Email', { exact: true })).toBeVisible();
});
