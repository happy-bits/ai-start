import { test, expect } from '@playwright/test';

test.describe('Seller Editing', () => {
  test('create and edit and delete seller', async ({ page }) => {
    
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

    // 4. Edit seller
    await test.step('Edit seller', async () => {
      // Find the seller row and click Edit button
      const sellerRow = page.getByRole('row').filter({ hasText: 'Test Seller' }).first();
      await expect(sellerRow).toBeVisible();
      
      await sellerRow.getByRole('button', { name: 'Edit Test Seller' }).click();
      
      // Wait for edit form to load
      await page.waitForURL('**/sellers/**/edit');
      await expect(page.getByRole('heading', { name: 'Edit Seller' })).toBeVisible();
      
      // Edit name
      await test.step('Edit seller name', async () => {
        const nameInput = page.getByLabel('Name');
        await expect(nameInput).toHaveValue('Test Seller');
        await nameInput.clear();
        await nameInput.fill('Updated Seller Name');
      });

      // Edit email
      await test.step('Edit seller email', async () => {
        const emailInput = page.getByLabel('Email');
        await expect(emailInput).toHaveValue('testseller@example.com');
        await emailInput.clear();
        await emailInput.fill('updated@example.com');
      });

      // Save changes
      await test.step('Save seller changes', async () => {
        await page.getByRole('button', { name: 'Save Changes' }).click();
        
        // Wait for redirect back to sellers list
        await page.waitForURL('**/sellers');
        await expect(page.getByRole('heading', { name: 'Sellers', exact: true })).toBeVisible();
        
        // Verify updated seller appears in list
        await expect(page.getByText('Updated Seller Name')).toBeVisible();
        await expect(page.getByText('updated@example.com')).toBeVisible();
      });
    });

    // 5. Delete seller
    await test.step('Delete seller and verify it is gone', async () => {
      // Find the seller row and click Delete button
      const sellerRow = page.getByRole('row').filter({ hasText: 'Updated Seller Name' }).first();
      await expect(sellerRow).toBeVisible();
      
      await sellerRow.getByRole('button', { name: 'Delete Updated Seller Name' }).click();
      
      // Verify seller is no longer in the list
      await expect(page.getByText('Updated Seller Name')).not.toBeVisible();
      await expect(page.getByText('updated@example.com')).not.toBeVisible();
    });

    // 6. Logout
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
