import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from './helpers/auth';

test.describe('Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login link
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link if available, or navigate directly
    const registerLink = page.locator('text=/register|sign up/i').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
    } else {
      await page.goto('/register');
    }
    await expect(page).toHaveURL(/.*register/);
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    // Login using helper function
    await loginAsUser(page);
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to chatbot page', async ({ page }) => {
    // Login using helper
    await loginAsUser(page);
    
    // Navigate to chatbot
    await page.goto('/chatbot');
    await expect(page).toHaveURL(/.*chatbot/);
    await expect(page.locator('h1, h2, h4')).toContainText(/chat|assistant/i);
  });

  test('should navigate to multiple predict page', async ({ page }) => {
    await loginAsUser(page);
    
    // Navigate to multi predict
    await page.goto('/multi');
    await expect(page).toHaveURL(/.*multi/);
  });

  test('should navigate to model comparison page', async ({ page }) => {
    await loginAsUser(page);
    
    // Navigate to comparison
    await page.goto('/comparison');
    await expect(page).toHaveURL(/.*comparison/);
  });

  test('should navigate to crop images page', async ({ page }) => {
    await loginAsUser(page);
    
    // Navigate to crop
    await page.goto('/crop');
    await expect(page).toHaveURL(/.*crop/);
  });

  test('should navigate to polyphenol page', async ({ page }) => {
    await loginAsUser(page);
    
    // Navigate to polyphenol
    await page.goto('/polyphenol');
    await expect(page).toHaveURL(/.*polyphenol/);
  });

  test('should navigate to history page', async ({ page }) => {
    await loginAsUser(page);
    
    // Navigate to history
    await page.goto('/history');
    await expect(page).toHaveURL(/.*history/);
  });

  test('should navigate to admin super dashboard (admin only)', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to super dashboard
    await page.goto('/super');
    await expect(page).toHaveURL(/.*super/);
  });

  test('should redirect non-admin users away from super dashboard', async ({ page }) => {
    await loginAsUser(page);
    
    // Try to access admin dashboard
    await page.goto('/super');
    
    // Should redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 5000 });
    expect(page.url()).not.toContain('/super');
  });
});

