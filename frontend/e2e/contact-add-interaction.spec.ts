import { expect, test } from '@playwright/test';

test('add interaction to contact', async ({ page }) => {
  /*
  STARTUP

  Reset database and login as Maria
  */

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Reset database to initial state' }).click();
  await page.getByRole('button', { name: 'Quick login as Maria (Seller)' }).click();

  /*
  ADD INTERACTION

  Expand Erik's details and add a new interaction via the notes field
  */

  const erikArticle = page.getByRole('article', { name: 'Contact: Erik Andersson' });
  await erikArticle.getByLabel('Expand contact details').click();

  await erikArticle.getByLabel('Click to add new interaction...').click();
  await erikArticle
    .getByRole('textbox', { name: 'Click to add new interaction...' })
    .fill('Had a great call about the project');
  await erikArticle.getByRole('heading', { name: 'Follow-up Date' }).click();

  /*
  VERIFY

  The new interaction should be visible with our notes
  */

  await expect(erikArticle).toContainText('Had a great call about the project');
});
