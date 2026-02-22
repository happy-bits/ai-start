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

  await page.getByRole('button', { name: 'Import contacts from CSV' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import contacts' })).toBeVisible();

  /*
  UPLOAD CSV

  Upload a valid CSV file with two new contacts
  */

  const csvContent =
    'name,email,company\nImport Test One,import1@test.com,Import Corp\nImport Test Two,import2@test.com,Beta Inc';
  await page.getByLabel('Choose CSV file').setInputFiles({
    name: 'contacts.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  });

  /*
  VERIFY PREVIEW

  Column mapping should auto-detect. Preview shows 2 rows.
  */

  await expect(page.getByText('contacts.csv')).toBeVisible();
  await expect(page.getByText('2 rows')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Import preview' })).toBeVisible();
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
  OPEN IMPORT AND UPLOAD CSV WITH INVALID ROW

  One valid row, one without name (invalid)
  */

  await page.getByRole('button', { name: 'Import contacts from CSV' }).click();
  const csvContent =
    'name,email,company\nValid Import,valid@test.com,Acme\n,invalid@test.com,Bad Corp';
  await page.getByLabel('Choose CSV file').setInputFiles({
    name: 'contacts.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
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
  OPEN IMPORT AND UPLOAD CSV WITH DUPLICATE

  Erik Andersson exists. New contact "Fresh Contact" does not.
  */

  await page.getByRole('button', { name: 'Import contacts from CSV' }).click();
  const csvContent =
    'name,email,company\nErik Andersson,erik.andersson@volvoab.se,Volvo AB\nFresh Contact,fresh@test.com,Fresh Inc';
  await page.getByLabel('Choose CSV file').setInputFiles({
    name: 'contacts.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
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
  OPEN IMPORT AND UPLOAD EMPTY CSV

  Only headers, no data rows
  */

  await page.getByRole('button', { name: 'Import contacts from CSV' }).click();
  const csvContent = 'name,email\n';
  await page.getByLabel('Choose CSV file').setInputFiles({
    name: 'empty.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  });

  /*
  VERIFY ERROR

  File is empty or has no data rows
  */

  await expect(page.getByText('File is empty or has no data rows')).toBeVisible();
});
