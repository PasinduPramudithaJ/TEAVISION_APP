import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const publicIP = process.env.PUBLIC_IP || '10.48.190.90';
const port = process.env.PORT || 5173;

console.log('Playwright will use PUBLIC IP:', publicIP);

export default defineConfig({
  testDir: './e2e',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: `http://${publicIP}:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: `http://${publicIP}:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
