import { Page } from '@playwright/test';

/**
 * Test credentials configuration
 * Admin credentials are automatically created by the backend on startup
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'pramudithapasindu48@gmail.com',
    password: process.env.ADMIN_PASSWORD || '1234',
  },
  regular: {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'testpassword123',
  },
};

/**
 * Login as a regular user
 */
export async function loginAsUser(page: Page, email?: string, password?: string): Promise<void> {
  const userEmail = email || TEST_CREDENTIALS.regular.email;
  const userPassword = password || TEST_CREDENTIALS.regular.password;

  await page.goto('/login');
  
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.fill(userEmail);
    await passwordInput.fill(userPassword);
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    // Wait for navigation to dashboard or super dashboard
    await page.waitForURL(/.*(dashboard|super)/, { timeout: 10000 });
  }
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsUser(
    page,
    TEST_CREDENTIALS.admin.email,
    TEST_CREDENTIALS.admin.password
  );
  
  // Admin users are redirected to /super dashboard
  await page.waitForURL(/.*super/, { timeout: 10000 });
}

/**
 * Register a new test user
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/register');
  
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up")').first();
    await registerButton.click();
    
    // Wait for navigation after registration
    await page.waitForURL(/.*(dashboard|super|login)/, { timeout: 10000 });
  }
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button/link
  const logoutButton = page.locator('text=/logout|sign out/i').first();
  
  if (await logoutButton.isVisible({ timeout: 5000 })) {
    await logoutButton.click();
    await page.waitForURL(/.*(login|home|$)/, { timeout: 5000 });
  } else {
    // Clear localStorage if logout button not found
    await page.evaluate(() => {
      localStorage.removeItem('isSignedIn');
      localStorage.removeItem('user');
    });
    await page.goto('/');
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const isSignedIn = await page.evaluate(() => {
    return localStorage.getItem('isSignedIn') === 'true';
  });
  return isSignedIn;
}

/**
 * Get current user from localStorage
 */
export async function getCurrentUser(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
}

/**
 * Check if current user is admin
 */
export async function isAdmin(page: Page): Promise<boolean> {
  const user = await getCurrentUser(page);
  if (!user) return false;
  
  return user.is_admin === true || user.email === TEST_CREDENTIALS.admin.email;
}

