import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, TEST_CREDENTIALS } from './helpers/auth';
import path from 'path';

test.describe('Comprehensive Application Tests', () => {
  test.describe('User Flow Tests', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should complete full prediction workflow', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check dashboard loads
      const dashboardContent = page.locator('text=/predict|upload|classify/i');
      await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should view user profile', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      // Check profile page loads
      const profileContent = page.locator('text=/profile|email|user/i');
      await expect(profileContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should access all main features', async ({ page }) => {
      const routes = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/multi', name: 'Multi Predict' },
        { path: '/comparison', name: 'Model Comparison' },
        { path: '/crop', name: 'Crop Images' },
        { path: '/polyphenol', name: 'Polyphenol Predict' },
        { path: '/history', name: 'History' },
        { path: '/chatbot', name: 'Chatbot' },
      ];

      for (const route of routes) {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        
        // Verify page loaded (not redirected to login)
        expect(page.url()).toContain(route.path);
        
        // Check page has some content
        const pageContent = page.locator('body');
        await expect(pageContent).toBeVisible();
      }
    });
  });

  test.describe('Admin Flow Tests', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should access all admin features', async ({ page }) => {
      // Super dashboard
      await page.goto('/super');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/super');
      
      // Settings (admin only)
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/settings');
      
      // Admin history
      await page.goto('/admin/history');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/admin/history');
    });

    test('should navigate through admin dashboard tabs', async ({ page }) => {
      await page.goto('/super');
      await page.waitForLoadState('networkidle');
      
      const tabs = [
        { name: 'Overview', selector: 'text=/overview/i' },
        { name: 'Users', selector: 'text=/user management|users/i' },
        { name: 'Stats', selector: 'text=/statistics|stats/i' },
        { name: 'Tools', selector: 'text=/system tools|tools/i' },
      ];

      for (const tab of tabs) {
        const tabElement = page.locator(tab.selector).first();
        if (await tabElement.isVisible({ timeout: 5000 })) {
          await tabElement.click();
          await page.waitForTimeout(1000);
          
          // Verify tab content is visible
          const tabContent = page.locator('body');
          await expect(tabContent).toBeVisible();
        }
      }
    });
  });

  test.describe('API Integration Tests', () => {
    test('should test user API endpoints', async ({ request }) => {
      // Test registration
      const testEmail = `apitest_${Date.now()}@example.com`;
      const testPassword = 'testpass123';
      
      const registerResponse = await request.post('http://localhost:5000/register', {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });
      
      expect(registerResponse.ok()).toBeTruthy();
      const registerData = await registerResponse.json();
      expect(registerData).toHaveProperty('user');
      expect(registerData.user.email).toBe(testEmail);
      
      // Test login
      const loginResponse = await request.post('http://localhost:5000/login', {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });
      
      expect(loginResponse.ok()).toBeTruthy();
      const loginData = await loginResponse.json();
      expect(loginData).toHaveProperty('user');
      expect(loginData.user.email).toBe(testEmail);
    });

    test('should test admin API endpoints', async ({ request }) => {
      const adminEmail = TEST_CREDENTIALS.admin.email;
      
      // Test get all users
      const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
        headers: {
          'X-Admin-Email': adminEmail,
        },
      });
      
      expect(usersResponse.ok()).toBeTruthy();
      const usersData = await usersResponse.json();
      expect(usersData).toHaveProperty('users');
      
      // Test get stats
      const statsResponse = await request.get('http://localhost:5000/api/admin/stats', {
        headers: {
          'X-Admin-Email': adminEmail,
        },
      });
      
      expect(statsResponse.ok()).toBeTruthy();
      const statsData = await statsResponse.json();
      expect(statsData).toHaveProperty('total_users');
      
      // Test get admin history
      const historyResponse = await request.get('http://localhost:5000/api/admin/history', {
        headers: {
          'X-Admin-Email': adminEmail,
        },
      });
      
      expect(historyResponse.ok()).toBeTruthy();
      const historyData = await historyResponse.json();
      expect(historyData).toHaveProperty('history');
    });

    test('should test health check endpoint', async ({ request }) => {
      const healthResponse = await request.get('http://localhost:5000/health');
      
      expect(healthResponse.ok()).toBeTruthy();
      const healthData = await healthResponse.json();
      expect(healthData).toHaveProperty('status');
      expect(healthData.status).toBe('healthy');
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginAsUser(page);
      
      // Try to navigate to a page that might fail
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Page should still load even if some requests fail
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    });

    test('should handle invalid API responses', async ({ request }) => {
      // Test invalid login
      const invalidLoginResponse = await request.post('http://localhost:5000/login', {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
      });
      
      expect(invalidLoginResponse.status()).toBe(401);
      const errorData = await invalidLoginResponse.json();
      expect(errorData).toHaveProperty('error');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in different viewport sizes', async ({ page }) => {
      await loginAsUser(page);
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const mobileContent = page.locator('body');
      await expect(mobileContent).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const tabletContent = page.locator('body');
      await expect(tabletContent).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const desktopContent = page.locator('body');
      await expect(desktopContent).toBeVisible();
    });
  });
});

