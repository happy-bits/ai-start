import { test, expect } from '@playwright/test';

test.describe('Contact Editing', () => {
  test('edit contact inline on contacts list', async ({ page }) => {
    // 1. Reset database (Setup)
    await test.step('Reset database before test', async () => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });

    // 2. Login as Lars (seller)
    await test.step('Login as Lars', async () => {
      await page.getByLabel('Email').fill('lars@hotmail.com');
      await page.getByLabel('Password').fill('seller123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/contacts');
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    });

    // 3. Create a contact
    await test.step('Create contact', async () => {
      // Create new contact (use first() since empty state also has an Add Contact button)
      await page.getByRole('button', { name: 'Add new contact' }).first().click();
      
      // Wait for URL to change to contact form page
      await page.waitForURL('**/contacts/new');
      
      // Use getByRole('textbox') to find form inputs
      await page.getByRole('textbox', { name: 'Name' }).fill('New Contact');
      await page.getByRole('textbox', { name: 'Email' }).fill('new@example.com');
      await page.getByRole('textbox', { name: 'Phone' }).fill('+46701111111');
      await page.getByRole('button', { name: 'Create Contact' }).click();
      
      // After creation, we're redirected to contact detail page - navigate back to contacts list
      await page.waitForURL('**/contacts/**');
      await page.getByRole('link', { name: 'Contacts' }).click();
      await page.waitForURL('**/contacts');
      await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    });

    // 4. Edit contact inline
    await test.step('Edit contact inline', async () => {
      // Helper function to find contact card/row by name
      const findContactCard = async (name: string) => {
        // Try article first (priority contacts)
        const articleCard = page.getByRole('article', { name: `Contact: ${name}` });
        if (await articleCard.count() > 0 && await articleCard.isVisible()) {
          return articleCard;
        }
        // Fallback to table row - use getByRole with row role
        return page.getByRole('row').filter({ hasText: name }).first();
      };
      
      // Find the contact and verify it's visible
      let contactName = 'New Contact';
      let contactCard = await findContactCard(contactName);
      await expect(contactCard).toBeVisible();

      // Test editing contact name
      await test.step('Edit contact name', async () => {
        const nameField = contactCard.getByLabel(/Contact name for/);
        await nameField.click();
        
        const nameInput = page.locator('input:focus');
        await expect(nameInput).toBeVisible();
        
        contactName = 'Updated Contact Name';
        await nameInput.fill(contactName);
        await nameInput.press('Enter');
        
        // Verify the change
        await expect(page.getByText(contactName)).toBeVisible();
        
        // Update contactCard reference since name changed
        contactCard = await findContactCard(contactName);
        await expect(contactCard).toBeVisible();
      });

      // Test editing company
      await test.step('Edit company', async () => {
        const companyField = contactCard.getByLabel(/Company name for/);
        await companyField.click();
        
        const companyInput = page.locator('input:focus');
        await expect(companyInput).toBeVisible();
        
        await companyInput.fill('Test Company');
        await companyInput.press('Enter');
        
        // Verify the change
        await expect(contactCard.getByText('Test Company')).toBeVisible();
      });

      // Test editing email
      await test.step('Edit email', async () => {
        const emailField = contactCard.getByLabel(/Email for/);
        await emailField.click();
        
        const emailInput = page.locator('input:focus');
        await expect(emailInput).toBeVisible();
        
        await emailInput.fill('edited@example.com');
        await emailInput.press('Enter');
        
        // Verify the change
        await expect(contactCard.getByText('edited@example.com')).toBeVisible();
      });

      // Test editing phone
      await test.step('Edit phone', async () => {
        const phoneField = contactCard.getByLabel(/Phone for/);
        await phoneField.click();
        
        const phoneInput = page.locator('input:focus');
        await expect(phoneInput).toBeVisible();
        
        await phoneInput.fill('+46702222222');
        await phoneInput.press('Enter');
        
        // Verify the change
        await expect(contactCard.getByText('+46702222222')).toBeVisible();
      });
    });

    // 5. Reset database (Cleanup)
    await test.step('Reset database after test', async () => {
      await page.getByRole('button', { name: 'Logout' }).click();
      await page.waitForURL('**/login');
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });
  });
});
