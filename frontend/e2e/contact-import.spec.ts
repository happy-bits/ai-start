import { expect, test } from '@playwright/test';

test('import contacts - happy path', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT MODAL

  Click Import button on contacts page
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import contacts' })).toBeVisible();

  /*
  UPLOAD JSON

  Upload a valid JSON file with two new contacts
  */

  const jsonContent = JSON.stringify({
    contacts: [
      { name: 'Import Test One', email: 'import1@test.com', company: 'Import Corp' },
      { name: 'Import Test Two', email: 'import2@test.com', company: 'Beta Inc' },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY PREVIEW

  Preview shows 2 contacts.
  */

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('contacts.json')).toBeVisible();
  await expect(dialog.getByText(/\(2 contacts\)/)).toBeVisible();
  await expect(dialog.getByRole('table', { name: 'Import preview' })).toBeVisible();
  await expect(page.getByText('Import Test One')).toBeVisible();
  await expect(page.getByText('Import Test Two')).toBeVisible();

  /*
  IMPORT

  Click Import button (scoped to dialog, scroll into view)
  */

  const importBtn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeEnabled();
  await expect(importBtn).toHaveText('Import 2 contacts');
  await importBtn.scrollIntoViewIfNeeded();
  await importBtn.click();

  /*
  VERIFY

  Modal closes. New contacts appear in list.
  Switch to "All" to see imported contacts (they have no follow-up date, so hidden in "To contact").
  */

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'All' }).click();
  await expect(page.getByRole('article', { name: 'Contact: Import Test One' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Contact: Import Test Two' })).toBeVisible();
  await expect(page.getByText('Contacts32')).toBeVisible();
});

test('import contacts - with interactions', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT MODAL AND UPLOAD JSON WITH INTERACTIONS
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({
    contacts: [
      {
        name: 'Contact with Interactions',
        email: 'with-interactions@test.com',
        interactions: [
          { type: 'call', date: '2026-03-05', time: '14:30', notes: 'Test call' },
          { type: 'meeting', date: '2026-03-10', notes: 'Test meeting' },
        ],
      },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY PREVIEW SHOWS INTERACTIONS
  */

  const previewTable = page.getByRole('table', { name: 'Import preview' });
  await expect(previewTable).toBeVisible();
  await expect(previewTable.getByText('Phone Call')).toBeVisible();
  await expect(previewTable.getByText('Meeting')).toBeVisible();

  /*
  IMPORT
  */

  const importBtn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeEnabled();
  await expect(importBtn).toHaveText('Import 1 contact with 2 interactions');
  await importBtn.scrollIntoViewIfNeeded();
  await importBtn.click();

  /*
  VERIFY CONTACT AND INTERACTIONS CREATED
  */

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'All' }).click();
  const contactCard = page.getByRole('article', { name: 'Contact: Contact with Interactions' });
  await expect(contactCard).toBeVisible();
  await contactCard.click();

  // Wait for interactions to load and verify they exist
  // Use getByLabel to find interaction type buttons specifically
  const phoneCallButton = contactCard
    .getByLabel('Interaction type')
    .filter({ hasText: 'Phone Call' });
  await expect(phoneCallButton).toBeVisible();
  const meetingButton = contactCard.getByLabel('Interaction type').filter({ hasText: 'Meeting' });
  await expect(meetingButton).toBeVisible();
});

test('import contacts - invalid row shows error and no import', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD JSON WITH INVALID ROW

  One valid row, one without name (invalid)
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({
    contacts: [
      { name: 'Valid Import', email: 'valid@test.com', company: 'Acme' },
      { email: 'invalid@test.com', company: 'Bad Corp' },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY PREVIEW

  Invalid row is auto-deselected. Only valid row selected.
  */

  const previewTable = page.getByRole('table', { name: 'Import preview' });
  await expect(previewTable).toBeVisible();
  await expect(previewTable.getByText('Invalid', { exact: true })).toBeVisible();

  /*
  IMPORT

  Should succeed with 1 contact (invalid row auto-deselected)
  */

  const importBtn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeEnabled();
  await expect(importBtn).toHaveText('Import 1 contact');
  await importBtn.scrollIntoViewIfNeeded();
  await importBtn.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'All' }).click();
  await expect(page.getByRole('article', { name: 'Contact: Valid Import' })).toBeVisible();
});

test('import contacts - invalid interaction shows error', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD JSON WITH INVALID INTERACTION
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({
    contacts: [
      {
        name: 'Contact with Invalid Interaction',
        email: 'invalid-interaction@test.com',
        interactions: [{ type: 'call', date: '2026/03/05' }], // Invalid date format
      },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY PREVIEW SHOWS ERROR

  Contact row should show "Invalid" due to invalid interaction
  */

  const previewTable = page.getByRole('table', { name: 'Import preview' });
  await expect(previewTable).toBeVisible();
  await expect(previewTable.getByText('Invalid', { exact: true })).toBeVisible();

  /*
  VERIFY IMPORT BUTTON IS DISABLED
  */

  const importBtn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeDisabled();
});

test('import contacts - invalid interaction type shows error', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD JSON WITH INVALID INTERACTION TYPE
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({
    contacts: [
      {
        name: 'Contact with Invalid Interaction Type',
        email: 'invalid-type@test.com',
        interactions: [
          { type: 'dontexist', date: '2026-03-05', time: '14:30', notes: 'Test call' },
          { type: 'meeting', date: '2026-03-10', notes: 'Valid meeting' },
        ],
      },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY PREVIEW SHOWS ERROR

  Contact row should show "Invalid" due to invalid interaction type
  The invalid interaction should show error indicator (⚠)
  */

  const dialog = page.getByRole('dialog');
  const previewTable = dialog.getByRole('table', { name: 'Import preview' });
  await expect(previewTable).toBeVisible();

  // Contact should be marked as Invalid in status column
  await expect(previewTable.getByText('Invalid', { exact: true })).toBeVisible();

  // Find the row with the invalid contact
  const invalidRow = previewTable
    .getByRole('row')
    .filter({ hasText: 'Contact with Invalid Interaction Type' });
  await expect(invalidRow).toBeVisible();

  // Verify the invalid interaction type is displayed
  await expect(invalidRow.getByText('dontexist')).toBeVisible();

  // Verify error indicator (⚠) is shown for the invalid interaction
  const interactionWithError = invalidRow.getByText('⚠');
  await expect(interactionWithError).toBeVisible();

  // Verify error message in title attribute (hover to see)
  const invalidInteraction = invalidRow.getByText('⚠ dontexist');
  await expect(invalidInteraction).toHaveAttribute('title', 'Invalid interaction type: dontexist');

  /*
  VERIFY IMPORT BUTTON IS DISABLED

  Since the contact has invalid interaction, it should be auto-deselected
  and import button should be disabled
  */

  const importBtn = dialog.getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeDisabled();
});

test('import contacts - duplicate marked in preview', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Reset database and login as Maria. Erik Andersson exists in seed.
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD JSON WITH DUPLICATE

  Erik Andersson exists. New contact "Fresh Contact" does not.
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({
    contacts: [
      { name: 'Erik Andersson', email: 'erik.andersson@volvoab.se', company: 'Volvo AB' },
      { name: 'Fresh Contact', email: 'fresh@test.com', company: 'Fresh Inc' },
    ],
  });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'contacts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY DUPLICATE MARKED

  Erik Andersson row should show "Duplicate"
  */

  const previewTable = page.getByRole('table', { name: 'Import preview' });
  await expect(previewTable.getByText('Duplicate')).toBeVisible();

  /*
  DESELECT DUPLICATE AND IMPORT

  Import only Fresh Contact
  */

  const duplicateRow = previewTable.getByRole('row').filter({ hasText: 'Duplicate' });
  await duplicateRow.getByRole('checkbox').uncheck();

  const importBtn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Import selected contacts' });
  await expect(importBtn).toBeEnabled();
  await expect(importBtn).toHaveText('Import 1 contact');
  await importBtn.scrollIntoViewIfNeeded();
  await importBtn.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'All' }).click();
  await expect(page.getByRole('article', { name: 'Contact: Fresh Contact' })).toBeVisible();
});

test('import contacts - empty file shows error', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD EMPTY JSON

  Empty contacts array
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const jsonContent = JSON.stringify({ contacts: [] });
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'empty.json',
    mimeType: 'application/json',
    buffer: Buffer.from(jsonContent),
  });

  /*
  VERIFY ERROR

  File is empty or has no contacts
  */

  await expect(page.getByText('File is empty or has no contacts')).toBeVisible();
});

test('import contacts - invalid JSON shows error', async ({ page }) => {
  test.setTimeout(3000);
  /*
  STARTUP

  Login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
  await expect(page).toHaveURL(/\/contacts/);

  /*
  OPEN IMPORT AND UPLOAD INVALID JSON
  */

  await page.getByRole('button', { name: 'Import contacts from JSON' }).click();
  const invalidJson = '{ invalid json }';
  await page.getByLabel('Choose JSON file').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(invalidJson),
  });

  /*
  VERIFY ERROR

  Could not parse JSON file
  */

  await expect(page.getByText(/Could not parse JSON file/)).toBeVisible();
});
