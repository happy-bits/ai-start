import { test, expect } from '@playwright/test';

test.describe('Inline Editing Functionality', () => {
  test('all inline editing components work correctly', async ({ page }) => {
    
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

    // 3. Create a contact with an interaction
    await test.step('Create contact and interaction', async () => {
      // Create new contact (use first() since empty state also has an Add Contact button)
      await page.getByRole('button', { name: 'Add new contact' }).first().click();
      
      // Wait for URL to change to contact form page
      await page.waitForURL('**/contacts/new');
      
      // Use getByRole('textbox') to find form inputs (more specific than getByLabel)
      await page.getByRole('textbox', { name: 'Name' }).fill('Test Contact');
      await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Phone' }).fill('+46701234567');
      await page.getByRole('button', { name: 'Create Contact' }).click();
      
      // Verify contact appears in list
      await expect(page.getByText('Test Contact')).toBeVisible();
      
      // Open contact detail
      await page.getByRole('button', { name: 'View interactions for Test Contact' }).click();
      await expect(page.getByRole('heading', { name: 'Test Contact' })).toBeVisible();
      
      // Add new interaction
      await page.getByRole('button', { name: 'Log new interaction' }).click();
      
      // Wait for interaction form heading to be visible
      await expect(page.getByRole('heading', { name: 'Log New Interaction' })).toBeVisible();
      
      // Use getByRole('textbox') for textarea
      await page.getByRole('textbox', { name: 'Notes' }).fill('Initial test interaction');
      await page.getByRole('button', { name: 'Log Interaction' }).click();
      
      // Verify interaction was added
      await expect(page.getByText('Initial test interaction')).toBeVisible();
    });

    // 4. Test inline editing on contact detail page
    await test.step('Test inline editing on contact detail page', async () => {
      // Find the interaction article using aria-label (more robust than text matching)
      const interactionArticle = page.getByRole('article', { name: /interaction on/ }).filter({ hasText: 'Initial test interaction' }).first();
      await expect(interactionArticle).toBeVisible();

      // Test editing interaction type (InlineEditableSelect)
      await test.step('Edit interaction type', async () => {
        // Find the interaction type badge using aria-label and role
        const typeBadge = interactionArticle.getByRole('button', { name: /Interaction type/ }).first();
        await typeBadge.click();
        
        // Wait for select to appear using aria-label
        const select = interactionArticle.getByLabel('Interaction type');
        await expect(select).toBeVisible();
        
        // Select a different type from dropdown
        await select.selectOption('Meeting');
        
        // Wait for the change to be saved (select auto-saves)
        await expect(interactionArticle.getByText('Meeting')).toBeVisible();
      });

      // Test editing interaction date (InlineEditableDate)
      await test.step('Edit interaction date', async () => {
        // Find the date field using aria-label
        const dateField = interactionArticle.getByLabel('Interaction date');
        await dateField.click();
        
        // Wait for date input to appear using aria-label (wait for it to become an input)
        const dateInput = interactionArticle.getByLabel('Interaction date');
        await expect(dateInput).toBeVisible();
        // Ensure it's actually an input element
        await expect(dateInput).toHaveAttribute('type', 'date');
        
        // Change the date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        await dateInput.fill(tomorrowStr);
        
        // Blur to save
        await dateInput.blur();
        
        // Wait for the change to be saved
        await expect(interactionArticle.getByText(tomorrowStr)).toBeVisible();
      });

      // Test editing interaction time (InlineEditableTime)
      await test.step('Edit interaction time', async () => {
        // Find the time field using aria-label
        const timeField = interactionArticle.getByLabel('Interaction time');
        await timeField.click();
        
        // Wait for time input to appear using aria-label
        const timeInput = interactionArticle.getByLabel('Interaction time');
        await expect(timeInput).toBeVisible();
        
        // Set a time
        await timeInput.fill('14:30');
        
        // Blur to save
        await timeInput.blur();
        
        // Wait for the change to be saved
        await expect(interactionArticle.getByText('14:30')).toBeVisible();
      });

      // Test editing interaction notes (InlineEditableTextarea)
      await test.step('Edit interaction notes', async () => {
        // Find the notes field using aria-label
        const notesField = interactionArticle.getByLabel('Interaction notes');
        await notesField.click();
        
        // Wait for textarea to appear and be editable
        const textarea = interactionArticle.getByLabel('Interaction notes');
        await expect(textarea).toBeEditable({ timeout: 2000 });
        
        // Edit the notes (fill() already gives focus)
        await textarea.fill('Updated test interaction notes');
        
        // Save by clicking on page heading to trigger blur (handleBlur triggers save)
        await page.getByRole('heading', { name: 'Test Contact' }).click();
        
        // Wait for the change to be saved - re-query article since text content changed
        // (the original interactionArticle locator filtered for 'Initial test interaction' which no longer exists)
        const updatedInteractionArticle = page.getByRole('article', { name: /interaction on/ }).filter({ hasText: 'Updated test interaction notes' }).first();
        await expect(updatedInteractionArticle).toBeVisible();
      });
    });

    // 5. Navigate back to contacts list and test inline editing on contact card
    await test.step('Test inline editing on contact card', async () => {
      await page.getByRole('link', { name: 'Contacts' }).click();
      await page.waitForURL('**/contacts');
      
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
      
      // Find the contact - it might be in priority contacts (card) or other contacts (table)
      let contactName = 'Test Contact';
      let contactCard = await findContactCard(contactName);
      await expect(contactCard).toBeVisible();

      // Test editing contact name (InlineEditable - text)
      await test.step('Edit contact name', async () => {
        // Use aria-label pattern to find the name field
        const nameField = contactCard.getByLabel(/Contact name for/);
        await nameField.click();
        
        // Wait for the input to appear - use page-level focused input (avoids scoping issues with :focus)
        const nameInput = page.locator('input:focus');
        await expect(nameInput).toBeVisible();
        
        contactName = 'Updated Test Contact';
        await nameInput.fill(contactName);
        await nameInput.press('Enter');
        
        // Wait for the change to be saved
        await expect(page.getByText(contactName)).toBeVisible();
        
        // Update contactCard reference since name changed
        contactCard = await findContactCard(contactName);
        await expect(contactCard).toBeVisible();
      });

      // Test editing company (InlineEditable - text)
      await test.step('Edit company', async () => {
        // Use aria-label pattern that matches any contact name (since name may have changed)
        const companyField = contactCard.getByLabel(/Company name for/);
        await companyField.click();
        
        // Wait for the input to appear - use page-level focused input
        const companyInput = page.locator('input:focus');
        await expect(companyInput).toBeVisible();
        
        await companyInput.fill('Test Company AB');
        await companyInput.press('Enter');
        
        // Wait for the change to be saved
        await expect(contactCard.getByText('Test Company AB')).toBeVisible();
      });

      // Test editing email (InlineEditable - email)
      await test.step('Edit email', async () => {
        // Use aria-label pattern that matches any contact name
        const emailField = contactCard.getByLabel(/Email for/);
        await emailField.click();
        
        // Wait for the input to appear - use page-level focused input
        const emailInput = page.locator('input:focus');
        await expect(emailInput).toBeVisible();
        
        await emailInput.fill('updated@example.com');
        await emailInput.press('Enter');
        
        // Wait for the change to be saved
        await expect(contactCard.getByText('updated@example.com')).toBeVisible();
      });

      // Test editing phone (InlineEditable - tel)
      await test.step('Edit phone', async () => {
        // Use aria-label pattern that matches any contact name
        const phoneField = contactCard.getByLabel(/Phone for/);
        await phoneField.click();
        
        // Wait for the input to appear - use page-level focused input
        const phoneInput = page.locator('input:focus');
        await expect(phoneInput).toBeVisible();
        
        await phoneInput.fill('+46709876543');
        await phoneInput.press('Enter');
        
        // Wait for the change to be saved
        await expect(contactCard.getByText('+46709876543')).toBeVisible();
      });

      // Note: Interaction field editing (type, date, time, notes) is only available on:
      // 1. Contact detail page - already tested in "Test inline editing on contact detail page" section
      // 2. Priority contact cards (not table rows)
      // Since this contact ends up in "Other Contacts" table, we skip interaction editing here
    });

    // 6. Reset database (Cleanup)
    await test.step('Reset database after test', async () => {
      await page.getByRole('button', { name: 'Logout' }).click();
      await page.waitForURL('**/login');
      await page.getByRole('button', { name: 'Reset database' }).click();
      await expect(page.getByText('Database has been reset!')).toBeVisible();
    });
  });
});
