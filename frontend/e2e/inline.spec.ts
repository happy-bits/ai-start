import { test, expect } from '@playwright/test';

test.describe('Inline editing', () => {
    test('change name, email, phone', async ({ page }) => {

        await page.goto('http://localhost:5173/login');
        await page.getByRole('button', { name: 'Reset database to initial' }).click();
        await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();
        await page.getByRole('button', { name: 'Contact name for Erik' }).click();
        await page.getByRole('textbox', { name: 'Contact name for Erik' }).fill('Sven Larsson');
        await page.getByRole('button', { name: 'Company name for Erik' }).click();
        await page.getByRole('textbox', { name: 'Company name for Erik' }).fill('SAAB');
        await page.getByRole('button', { name: 'Email for Sven Larsson' }).click();
        await page.getByRole('textbox', { name: 'Email for Sven Larsson' }).fill('sven.larsson@saab.se');
        await page.getByRole('button', { name: 'Phone for Sven Larsson' }).click();
        await page.getByRole('textbox', { name: 'Phone for Sven Larsson' }).fill('+46 70 123 45 88');
        await page.getByRole('article', { name: 'Contact: Sven Larsson' }).click();
        await expect(page.getByLabel('Contact: Sven Larsson').getByRole('listitem')).toMatchAriaSnapshot(`
            - text: S
            - button "Contact name for Sven Larsson"
            - button "Company name for Sven Larsson"
            - button "Email for Sven Larsson"
            - button "Phone for Sven Larsson"
            `);
        await page.getByRole('button', { name: 'Logout' }).click();
        await page.getByRole('button', { name: 'Reset database to initial' }).click();

    })
})
