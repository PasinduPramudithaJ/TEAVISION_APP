# E2E Testing with Playwright

This directory contains end-to-end tests for the TeaQnet application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```
or
```bash
npx playwright test
```

### Run tests in UI mode (interactive) - RECOMMENDED
```bash
npm run test:e2e:ui
```
or
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```
or
```bash
npx playwright test --headed
```

### Debug tests
```bash
npm run test:e2e:debug
```
or
```bash
npx playwright test --debug
```

### View test report
```bash
npm run test:e2e:report
```
or
```bash
npx playwright show-report
```

### Run specific test file
```bash
npx playwright test navigation.spec.ts
```

### Run specific test by name
```bash
npx playwright test -g "should navigate to dashboard"
```

## Test Files

- `navigation.spec.ts` - Tests page navigation and routing
- `tea-classification.spec.ts` - Tests tea region classification functionality
- `example.spec.ts` - Basic homepage test

## Test Configuration

Tests are configured in `playwright.config.ts`. The configuration:
- Runs tests on Chromium, Firefox, and WebKit
- Automatically starts the dev server before tests
- Takes screenshots on failure
- Generates HTML reports

## Test Data

Tests use a test user account. Update credentials in test files:
- Email: `test@example.com`
- Password: `testpassword123`

Create a test image at `test-assets/test-tea-image.png` for image upload tests.

## CI/CD

Tests can be run in CI/CD pipelines. Set `CI=true` environment variable for CI-specific settings.

