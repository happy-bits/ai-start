import { test, expect } from '@playwright/test';

test.describe('Complete CRM User Journey', () => {
  test('admin manages full workflow', async ({ page }) => {
    
    // 1. Reset database (Setup)
    await test.step('Reset database before test', async () => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });

    // 2. Login as admin
    await test.step('Login as admin', async () => {
      await page.getByLabel('Email').fill('admin@keepwarm.com');
      await page.getByLabel('Password').fill('admin123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/contacts');
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    });

    // 3. Seller management
    await test.step('Navigate to sellers and create new seller', async () => {
      await page.getByRole('link', { name: 'Sellers' }).click();
      await page.waitForURL('**/sellers');
      
      // Create new seller
      await page.getByRole('button', { name: 'Add new seller' }).click();
      await page.getByLabel('Name').fill('Test Seller');
      await page.getByLabel('Email').fill('testseller@example.com');
      await page.getByLabel('Password').fill('test123');
      await page.getByRole('button', { name: 'Create Seller' }).click();
      
      // Verify seller appears in list
      await expect(page.getByText('Test Seller')).toBeVisible();
    });

  

    // 4. Logout
    await test.step('Logout', async () => {
      await page.getByRole('button', { name: 'Logout' }).click();
      await page.waitForURL('**/login');
      await expect(page.getByRole('button', { name: 'Quick login as Admin' })).toBeVisible();
    });

    // 7. Reset database (Cleanup)
    await test.step('Reset database after test', async () => {
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });
  });
});
