import { expect, test } from '@playwright/test';

test('edit a contact', async ({ page }) => {
  // Login as Maria

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();

  // Edit a contact's name, email, phonenumber

  await page
    .getByRole('article', { name: 'Contact: Erik Andersson' })
    .getByLabel('Expand contact details')
    .click();
  await page.getByRole('button', { name: 'Contact name for Erik' }).click();
  await page.getByRole('textbox', { name: 'Contact name for Erik' }).fill('Erik Anderssonnnn');
  await page.getByRole('button', { name: 'Company name for Erik' }).click();
  await page.getByRole('textbox', { name: 'Company name for Erik' }).fill('Volvo ABBBB');
  await page.getByRole('button', { name: 'Email for Erik Anderssonnnn' }).click();
  await page
    .getByRole('textbox', { name: 'Email for Erik Anderssonnnn' })
    .fill('erik.andersson@volvoab.see');
  await page.getByRole('button', { name: 'Phone for Erik Anderssonnnn' }).click();
  await page.getByRole('textbox', { name: 'Phone for Erik Anderssonnnn' }).fill('+46 70 123 45 88');
  await page.getByRole('heading', { name: 'Follow-up Date' }).click();

  // Verify

  await expect(page.getByLabel('Contact: Erik Anderssonnnn')).toMatchAriaSnapshot(`
    - button "Contact name for Erik Anderssonnnn"
    - button "Company name for Erik Anderssonnnn"
    - button "Email for Erik Anderssonnnn"
    - button "Phone for Erik Anderssonnnn"
    `);
});
