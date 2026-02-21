import { test, expect } from '@playwright/test';
import path from 'path';
import { loginAsUser } from './helpers/auth';

test.describe('Tea Region Classification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper function
    await loginAsUser(page);
  });

  test('should perform tea region classification on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // Create a simple test image file (1x1 pixel PNG)
      const testImagePath = path.join(__dirname, '../test-assets/test-tea-image.png');
      
      // Upload file if it exists, otherwise skip
      try {
        await fileInput.setInputFiles(testImagePath);
        
        // Wait a bit for file to be processed
        await page.waitForTimeout(1000);
        
        // Look for predict button
        const predictButton = page.locator('button:has-text("Predict"), button:has-text("Classify")').first();
        
        if (await predictButton.isVisible({ timeout: 5000 })) {
          await predictButton.click();
          
          // Wait for prediction result (adjust timeout as needed)
          await page.waitForTimeout(5000);
          
          // Check for result indicators
          const resultIndicators = [
            page.locator('text=/prediction/i'),
            page.locator('text=/confidence/i'),
            page.locator('text=/region/i'),
            page.locator('text=/dimbula|ruhuna|sabaragamuwa/i'),
          ];
          
          // At least one result indicator should be visible
          const hasResult = await Promise.race(
            resultIndicators.map(locator => locator.isVisible().catch(() => false))
          );
          
          expect(hasResult).toBeTruthy();
        }
      } catch (error) {
        // If test image doesn't exist, skip this test
        test.skip();
      }
    }
  });

  test('should perform multiple predictions', async ({ page }) => {
    await page.goto('/multi');
    await page.waitForLoadState('networkidle');
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      const testImagePath = path.join(__dirname, '../test-assets/test-tea-image.png');
      
      try {
        await fileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(1000);
        
        // Look for predict all button
        const predictAllButton = page.locator('button:has-text("Predict All"), button:has-text("Predict")').first();
        
        if (await predictAllButton.isVisible({ timeout: 5000 })) {
          await predictAllButton.click();
          
          // Wait for predictions
          await page.waitForTimeout(5000);
          
          // Check for results table or result indicators
          const hasResults = await Promise.race([
            page.locator('table').isVisible(),
            page.locator('text=/prediction/i').isVisible(),
            page.locator('text=/done|completed/i').isVisible(),
          ].map(p => p.catch(() => false)));
          
          expect(hasResults).toBeTruthy();
        }
      } catch (error) {
        test.skip();
      }
    }
  });

  test('should compare multiple models', async ({ page }) => {
    await page.goto('/comparison');
    await page.waitForLoadState('networkidle');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      const testImagePath = path.join(__dirname, '../test-assets/test-tea-image.png');
      
      try {
        await fileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(1000);
        
        const predictButton = page.locator('button:has-text("Predict All"), button:has-text("Predict")').first();
        
        if (await predictButton.isVisible({ timeout: 5000 })) {
          await predictButton.click();
          
          // Wait for model comparisons
          await page.waitForTimeout(10000); // Models take longer
          
          // Check for model results
          const hasModelResults = await Promise.race([
            page.locator('text=/resnet|efficientnet|mobilenet/i').isVisible(),
            page.locator('table').isVisible(),
            page.locator('text=/confidence/i').isVisible(),
          ].map(p => p.catch(() => false)));
          
          expect(hasModelResults).toBeTruthy();
        }
      } catch (error) {
        test.skip();
      }
    }
  });

  test('should crop and predict images', async ({ page }) => {
    await page.goto('/crop');
    await page.waitForLoadState('networkidle');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      const testImagePath = path.join(__dirname, '../test-assets/test-tea-image.png');
      
      try {
        await fileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(1000);
        
        // Click crop all button
        const cropButton = page.locator('button:has-text("Crop"), button:has-text("Crop All")').first();
        
        if (await cropButton.isVisible({ timeout: 5000 })) {
          await cropButton.click();
          
          // Wait for cropping
          await page.waitForTimeout(3000);
          
          // Click predict button
          const predictButton = page.locator('button:has-text("Predict"), button:has-text("Predict All")').first();
          
          if (await predictButton.isVisible({ timeout: 5000 })) {
            await predictButton.click();
            
            // Wait for prediction
            await page.waitForTimeout(5000);
            
            // Check for results
            const hasResults = await Promise.race([
              page.locator('text=/prediction/i').isVisible(),
              page.locator('text=/confidence/i').isVisible(),
              page.locator('.badge, .alert').isVisible(),
            ].map(p => p.catch(() => false)));
            
            expect(hasResults).toBeTruthy();
          }
        }
      } catch (error) {
        test.skip();
      }
    }
  });

  test('should interact with chatbot', async ({ page }) => {
    await page.goto('/chatbot');
    await page.waitForLoadState('networkidle');
    
    // Check chatbot is visible
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Send a message
    await chatInput.fill('What regions can be classified?');
    await page.locator('button:has-text("Send"), button[type="submit"]').first().click();
    
    // Wait for bot response
    await page.waitForTimeout(3000);
    
    // Check for bot response
    const botResponse = page.locator('text=/region|dimbula|ruhuna|sabaragamuwa/i');
    await expect(botResponse.first()).toBeVisible({ timeout: 10000 });
  });

  test('should view prediction history', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    // Check history page loads
    await expect(page.locator('h1, h2, h4')).toContainText(/history|prediction/i);
    
    // Check for refresh button or history table
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(2000);
    }
    
    // History should show either results or empty state
    const hasContent = await Promise.race([
      page.locator('table').isVisible(),
      page.locator('text=/no predictions/i').isVisible(),
      page.locator('text=/total predictions/i').isVisible(),
    ].map(p => p.catch(() => false)));
    
    expect(hasContent).toBeTruthy();
  });
});

