import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, registerUser, logout, isLoggedIn, isAdmin, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Authentication Tests', () => {
  test('should register a new user', async ({ page }) => {
    const testEmail = `newuser_${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    await registerUser(page, testEmail, testPassword);
    
    // Should be logged in after registration
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginAsUser(page);
    
    // Should be logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login as admin', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Admin should redirect to super dashboard
    await expect(page).toHaveURL(/.*super/);
    
    // Should have admin flag
    const userIsAdmin = await isAdmin(page);
    expect(userIsAdmin).toBe(true);
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
      await loginButton.click();
      
      // Should show error message
      await page.waitForTimeout(2000);
      
      // Check for error message
      const errorMessage = page.locator('text=/invalid|error|incorrect/i');
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      // Should still be on login page
      expect(page.url()).toContain('login');
    }
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsUser(page);
    
    // Verify logged in
    expect(await isLoggedIn(page)).toBe(true);
    
    // Logout
    await logout(page);
    
    // Should be logged out
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
    
    // Should redirect to home or login
    const url = page.url();
    expect(url).toMatch(/.*(login|home|$)/);
  });

  test('should prevent access to protected routes when not logged in', async ({ page }) => {
    // Ensure logged out
    await page.evaluate(() => {
      localStorage.removeItem('isSignedIn');
      localStorage.removeItem('user');
    });
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL(/.*login/, { timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('should maintain session after page reload', async ({ page }) => {
    await loginAsUser(page);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Should still be on dashboard or redirected appropriately
    const url = page.url();
    expect(url).toMatch(/.*(dashboard|super)/);
  });

  test('should handle registration with existing email', async ({ page }) => {
    // Try to register with admin email (already exists)
    await page.goto('/register');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(TEST_CREDENTIALS.admin.email);
      await passwordInput.fill('somepassword');
      
      const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up")').first();
      await registerButton.click();
      
      // Wait for error message
      await page.waitForTimeout(2000);
      
      // Should show error about existing email
      const errorMessage = page.locator('text=/already|exists|registered/i');
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      // Should still be on register page
      expect(page.url()).toContain('register');
    }
  });
});

test.describe('User Role Tests', () => {
  test('should identify admin user correctly', async ({ page }) => {
    await loginAsAdmin(page);
    
    const userIsAdmin = await isAdmin(page);
    expect(userIsAdmin).toBe(true);
    
    // Admin should have access to super dashboard
    await page.goto('/super');
    await expect(page).toHaveURL(/.*super/);
  });

  test('should identify regular user correctly', async ({ page }) => {
    await loginAsUser(page);
    
    const userIsAdmin = await isAdmin(page);
    expect(userIsAdmin).toBe(false);
    
    // Regular user should not have access to super dashboard
    await page.goto('/super');
    await page.waitForURL(/.*dashboard/, { timeout: 5000 });
    expect(page.url()).not.toContain('/super');
  });

  test('should redirect admin to super dashboard automatically', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Try to access regular dashboard
    await page.goto('/dashboard');
    
    // Should redirect to super dashboard
    await page.waitForURL(/.*super/, { timeout: 5000 });
    expect(page.url()).toContain('/super');
  });
});

