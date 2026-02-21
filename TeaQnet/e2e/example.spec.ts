import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check page title or main heading
  await expect(page).toHaveTitle(/tea|teaqnet/i);
  
  // Check for main content
  const mainContent = page.locator('h1, h2').first();
  await expect(mainContent).toBeVisible();
});

