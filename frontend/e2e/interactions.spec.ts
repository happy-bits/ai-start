import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

    // Login as Maria

    await page.goto('http://localhost:5173/login');
    await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();

    // Add interaction

    await page.getByRole('article', { name: 'Contact: Ida Gustafsson' }).getByLabel('Expand contact details').click();
    await expect(page.locator('div').filter({ hasText: /Click to add new interaction\.\.\.$/ }).first()).toBeVisible();
    await page.getByLabel('Contact: Ida Gustafsson').getByText('-12-17').click();
    await page.getByRole('textbox', { name: 'Add follow-up date' }).fill('2028-03-04');
    await page.getByRole('button', { name: 'Add time' }).click(); // click outside to save
    await page.getByRole('button', { name: 'Add time' }).click();
    await page.getByRole('textbox', { name: 'Add time' }).fill('15:30');
    await page.getByRole('button', { name: 'Click to add new interaction' }).click();// click outside to save
    await page.getByRole('button', { name: 'Click to add new interaction' }).click();

    await page.getByRole('textbox', { name: 'Click to add new interaction' }).fill('Bla bla');
    await page.getByText('Note2028-03-0415:30Bla').click();
    await page.locator('div').filter({ hasText: 'ContactsManage your contact' }).nth(2).click();

    // Verify

    await expect(page.getByLabel('Contact: Ida Gustafsson')).toMatchAriaSnapshot(`
    - 'button "Interaction type: Note"'
    - button "Add follow-up date"
    - button "Add time"
    - button "Click to add new interaction..."
    - button "Interaction type"
    - button "Interaction date"
    - button "Interaction time"
    - button "Interaction notes"
    - button /Delete interaction from \\d+-\\d+-\\d+/
    `);
    await page.getByRole('button', { name: 'Delete interaction from 2028-03-' }).click();
    await expect(page.getByLabel('Contact: Ida Gustafsson')).toMatchAriaSnapshot(`
    - 'button "Interaction type: Note"'
    - button "Add follow-up date"
    - button "Add time"
    - button "Click to add new interaction..."
    `);
});