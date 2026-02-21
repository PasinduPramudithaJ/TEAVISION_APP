# Automated Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
cd TeaQnet
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

Or install just Chromium (faster):
```bash
npx playwright install chromium
```

### 3. Run Tests

**Option 1: UI Mode (Recommended for first time)**
```bash
npm run test:e2e:ui
```

**Option 2: Headless Mode**
```bash
npm run test:e2e
```

**Option 3: See Browser (Headed Mode)**
```bash
npm run test:e2e:headed
```

**Option 4: Debug Mode**
```bash
npm run test:e2e:debug
```

## Prerequisites

1. **Backend Server Running**: Make sure Flask backend is running on `http://localhost:5000`
   ```bash
   cd Tea_Region_Classifier
   python app.py
   ```

2. **Admin Credentials**: Admin user is automatically created by the backend on startup
   - Default Admin: `pramudithapasindu48@gmail.com` / `1234`
   - These credentials are used automatically in tests via `e2e/helpers/auth.ts`

3. **Test User Account**: Create a test user or update credentials via environment variables
   - Default: `test@example.com` / `testpassword123`
   - Can be overridden with environment variables: `TEST_EMAIL` and `TEST_PASSWORD`
   - Or update in: `e2e/helpers/auth.ts`

4. **Environment Variables (Optional)**: Create a `.env` file in `TeaQnet/` directory:
   ```env
   ADMIN_EMAIL=pramudithapasindu48@gmail.com
   ADMIN_PASSWORD=1234
   TEST_EMAIL=test@example.com
   TEST_PASSWORD=testpassword123
   ```

5. **Test Image (Optional)**: Create `test-assets/test-tea-image.png` for image upload tests

## Troubleshooting

### "playwright is not recognized"
- Use `npx playwright` instead of `playwright`
- Or use npm scripts: `npm run test:e2e`
- Make sure you're in the `TeaQnet` directory

### "Cannot find module '@playwright/test'"
```bash
npm install @playwright/test --save-dev
npx playwright install
```

### Tests timeout
- Ensure backend server is running
- Check that ports 5000 (backend) and 5173 (frontend) are available
- Increase timeout in `playwright.config.ts` if needed

### Login fails
- Admin credentials are automatically created by backend on startup
- For regular test user, register one first or update credentials in `e2e/helpers/auth.ts`
- Check backend is accessible at `http://localhost:5000`
- Verify environment variables are set correctly if using custom credentials

## Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:ui` | Run tests with interactive UI |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:debug` | Debug tests step-by-step |
| `npm run test:e2e:report` | View HTML test report |
| `npx playwright test navigation.spec.ts` | Run specific test file |
| `npx playwright test -g "dashboard"` | Run tests matching name |

## Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

Reports are saved in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots and traces

## What Gets Tested

✅ **Navigation Tests** (`e2e/navigation.spec.ts`)
- All page routes
- Login/Register flow
- Protected route access
- Admin dashboard access control

✅ **Authentication Tests** (`e2e/auth.spec.ts`)
- User registration
- User login
- Admin login
- Logout functionality
- Session persistence
- Protected route access
- Role-based access control

✅ **Admin Tests** (`e2e/admin.spec.ts`)
- Admin dashboard access
- User management (view, update, delete, toggle admin)
- Admin statistics
- Admin history access
- Settings page (admin only)
- Admin API endpoints
- Non-admin access prevention

✅ **Classification Tests** (`e2e/tea-classification.spec.ts`)
- Dashboard prediction
- Multiple predictions
- Model comparison
- Crop and predict
- Chatbot interaction
- History viewing

✅ **Comprehensive Tests** (`e2e/comprehensive.spec.ts`)
- Full user workflows
- Admin workflows
- API integration tests
- Error handling
- Cross-browser compatibility
- Responsive design tests

## Test Helper Utilities

All tests use centralized authentication helpers in `e2e/helpers/auth.ts`:
- `loginAsUser()` - Login as regular user
- `loginAsAdmin()` - Login as admin user
- `registerUser()` - Register new user
- `logout()` - Logout current user
- `isLoggedIn()` - Check login status
- `isAdmin()` - Check admin status
- `TEST_CREDENTIALS` - Centralized credential configuration

## Admin Testing

Admin credentials are **automatically configured** for testing:
- Admin email and password are set in `e2e/helpers/auth.ts`
- Admin user is automatically created by backend on startup
- All admin tests use `loginAsAdmin()` helper function
- Admin API endpoints are tested with proper authentication headers

### Running Admin Tests Only
```bash
npx playwright test admin.spec.ts
```

### Running Authentication Tests Only
```bash
npx playwright test auth.spec.ts
```

