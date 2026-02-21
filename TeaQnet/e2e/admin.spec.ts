import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, TEST_CREDENTIALS, isAdmin } from './helpers/auth';

test.describe('Admin Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('should access admin super dashboard', async ({ page }) => {
    await page.goto('/super');
    await page.waitForLoadState('networkidle');
    
    // Check admin dashboard is visible
    await expect(page).toHaveURL(/.*super/);
    
    // Check for admin-specific content
    const adminContent = page.locator('text=/user management|statistics|system tools/i');
    await expect(adminContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should view all users in admin dashboard', async ({ page }) => {
    await page.goto('/super');
    await page.waitForLoadState('networkidle');
    
    // Navigate to users tab
    const usersTab = page.locator('text=/user management|users/i').first();
    if (await usersTab.isVisible({ timeout: 5000 })) {
      await usersTab.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for users table or list
    const usersTable = page.locator('table, .user-list, [data-testid="users-list"]').first();
    await expect(usersTable).toBeVisible({ timeout: 10000 });
    
    // Check for at least one user (admin user should exist)
    const userRows = page.locator('tr, .user-item, [data-testid="user-item"]');
    const count = await userRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view admin statistics', async ({ page }) => {
    await page.goto('/super');
    await page.waitForLoadState('networkidle');
    
    // Navigate to stats tab
    const statsTab = page.locator('text=/statistics|stats/i').first();
    if (await statsTab.isVisible({ timeout: 5000 })) {
      await statsTab.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for statistics content
    const statsContent = page.locator('text=/total users|admin users|regular users/i');
    await expect(statsContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access admin history page', async ({ page }) => {
    await page.goto('/admin/history');
    await page.waitForLoadState('networkidle');
    
    // Check admin history page loads
    await expect(page).toHaveURL(/.*admin.*history/);
    
    // Check for history content
    const historyContent = page.locator('text=/history|predictions|all users/i');
    await expect(historyContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access settings page (admin only)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Check settings page loads
    await expect(page).toHaveURL(/.*settings/);
    
    // Check for settings content
    const settingsContent = page.locator('text=/api|settings|configuration/i');
    await expect(settingsContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should not allow regular users to access admin dashboard', async ({ page }) => {
    // First logout admin
    await page.evaluate(() => {
      localStorage.removeItem('isSignedIn');
      localStorage.removeItem('user');
    });
    
    // Try to access admin dashboard without login
    await page.goto('/super');
    
    // Should redirect to login or dashboard
    await page.waitForURL(/.*(login|dashboard)/, { timeout: 5000 });
    expect(page.url()).not.toContain('/super');
  });

  test('should verify admin status in localStorage', async ({ page }) => {
    const isUserAdmin = await isAdmin(page);
    expect(isUserAdmin).toBe(true);
    
    // Verify user object has admin flag
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    expect(user).not.toBeNull();
    expect(user.is_admin).toBe(true);
  });

  test('should test admin API endpoints via direct API calls', async ({ request }) => {
    const adminEmail = TEST_CREDENTIALS.admin.email;
    
    // Test get all users endpoint
    const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    expect(usersResponse.ok()).toBeTruthy();
    const usersData = await usersResponse.json();
    expect(usersData).toHaveProperty('users');
    expect(Array.isArray(usersData.users)).toBe(true);
    
    // Test get admin stats endpoint
    const statsResponse = await request.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    expect(statsResponse.ok()).toBeTruthy();
    const statsData = await statsResponse.json();
    expect(statsData).toHaveProperty('total_users');
    expect(statsData).toHaveProperty('admin_users');
    expect(statsData).toHaveProperty('regular_users');
    
    // Test get admin history endpoint
    const historyResponse = await request.get('http://localhost:5000/api/admin/history', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    expect(historyResponse.ok()).toBeTruthy();
    const historyData = await historyResponse.json();
    expect(historyData).toHaveProperty('history');
    expect(Array.isArray(historyData.history)).toBe(true);
  });

  test('should prevent non-admin access to admin API endpoints', async ({ request }) => {
    const regularEmail = 'test@example.com';
    
    // Try to access admin endpoint with regular user
    const response = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': regularEmail,
      },
    });
    
    // Should return 403 Forbidden
    expect(response.status()).toBe(403);
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Admin');
  });
});

test.describe('Admin User Management Tests', () => {
  let testUserId: number | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create a test user for management tests', async ({ page, request }) => {
    // Register a new test user
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    const registerResponse = await request.post('http://localhost:5000/register', {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    testUserId = registerData.user.id;
    
    // Verify user was created
    const adminEmail = TEST_CREDENTIALS.admin.email;
    const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    const usersData = await usersResponse.json();
    const createdUser = usersData.users.find((u: any) => u.email === testEmail);
    expect(createdUser).toBeDefined();
    expect(createdUser.is_admin).toBe(false);
  });

  test('should update user email via admin API', async ({ request }) => {
    if (!testUserId) {
      test.skip();
      return;
    }
    
    const adminEmail = TEST_CREDENTIALS.admin.email;
    const newEmail = `updated_${Date.now()}@example.com`;
    
    const updateResponse = await request.put(`http://localhost:5000/api/admin/users/${testUserId}`, {
      headers: {
        'X-Admin-Email': adminEmail,
        'Content-Type': 'application/json',
      },
      data: {
        email: newEmail,
      },
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    
    // Verify update
    const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    const usersData = await usersResponse.json();
    const updatedUser = usersData.users.find((u: any) => u.id === testUserId);
    expect(updatedUser).toBeDefined();
    expect(updatedUser.email).toBe(newEmail);
  });

  test('should toggle user admin status', async ({ request }) => {
    if (!testUserId) {
      test.skip();
      return;
    }
    
    const adminEmail = TEST_CREDENTIALS.admin.email;
    
    // Get current admin status
    const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    const usersData = await usersResponse.json();
    const user = usersData.users.find((u: any) => u.id === testUserId);
    const originalAdminStatus = user.is_admin;
    
    // Toggle admin status
    const toggleResponse = await request.post(`http://localhost:5000/api/admin/users/${testUserId}/toggle-admin`, {
      headers: {
        'X-Admin-Email': adminEmail,
        'Content-Type': 'application/json',
      },
    });
    
    expect(toggleResponse.ok()).toBeTruthy();
    const toggleData = await toggleResponse.json();
    expect(toggleData.is_admin).toBe(!originalAdminStatus);
    
    // Verify toggle
    const usersResponse2 = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    const usersData2 = await usersResponse2.json();
    const updatedUser = usersData2.users.find((u: any) => u.id === testUserId);
    expect(updatedUser.is_admin).toBe(!originalAdminStatus);
  });

  test('should delete user via admin API', async ({ request }) => {
    // Create a user to delete
    const testEmail = `todelete_${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    const registerResponse = await request.post('http://localhost:5000/register', {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    const userIdToDelete = registerData.user.id;
    
    // Delete the user
    const adminEmail = TEST_CREDENTIALS.admin.email;
    const deleteResponse = await request.delete(`http://localhost:5000/api/admin/users/${userIdToDelete}`, {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    expect(deleteResponse.ok()).toBeTruthy();
    
    // Verify deletion
    const usersResponse = await request.get('http://localhost:5000/api/admin/users', {
      headers: {
        'X-Admin-Email': adminEmail,
      },
    });
    
    const usersData = await usersResponse.json();
    const deletedUser = usersData.users.find((u: any) => u.id === userIdToDelete);
    expect(deletedUser).toBeUndefined();
  });
});

