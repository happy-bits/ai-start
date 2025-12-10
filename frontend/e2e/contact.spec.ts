import { test, expect } from '@playwright/test';

test.describe('Contact Creation', () => {
  test('login as Lars, create a contact, and verify it is visible in the contact list', async ({ page }) => {
    
    // 1. Reset database (Setup)
    await test.step('Reset database before test', async () => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });

    // 2. Login as Lars
    await test.step('Login as Lars', async () => {
      await page.getByLabel('Email').fill('lars@hotmail.com');
      await page.getByLabel('Password').fill('seller123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/contacts');
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    });

    // 3. Create a contact
    await test.step('Create a new contact', async () => {
      // Navigate to create contact page
      await page.getByRole('button', { name: 'Add new contact' }).first().click();
      await page.waitForURL('**/contacts/new');
      
      // Fill in contact form
      await page.getByLabel('Name').fill('Test Contact');
      await page.getByLabel('Email').fill('testcontact@example.com');
      await page.getByLabel('Phone').fill('+46 73 123 45 67');
      await page.getByLabel('Company').fill('Test Company');
      
      // Submit the form
      await page.getByRole('button', { name: 'Create Contact' }).click();
      
      // Wait for redirect back to contacts list
      await page.waitForURL('**/contacts');
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    });

    // 4. Verify contact is visible in the contact list
    await test.step('Verify contact is visible in the contact list', async () => {
      await expect(page.getByText('Test Contact')).toBeVisible();
      await expect(page.getByText('testcontact@example.com')).toBeVisible();
      await expect(page.getByText('Test Company')).toBeVisible();
    });

    // 5. Logout
    await test.step('Logout', async () => {
      await page.getByRole('button', { name: 'Logout' }).click();
      await page.waitForURL('**/login');
      await expect(page.getByRole('button', { name: 'Quick login as Admin' })).toBeVisible();
    });

    // 6. Reset database (Cleanup)
    await test.step('Reset database after test', async () => {
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });
  });
});
