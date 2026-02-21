# Test Helpers

This directory contains reusable helper functions for Playwright tests.

## Authentication Helpers (`auth.ts`)

Centralized authentication utilities for all tests.

### Credentials Configuration

```typescript
TEST_CREDENTIALS = {
  admin: {
    email: 'pramudithapasindu48@gmail.com',
    password: '1234',
  },
  regular: {
    email: 'test@example.com',
    password: 'testpassword123',
  },
}
```

Credentials can be overridden via environment variables:
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password
- `TEST_EMAIL` - Regular test user email
- `TEST_PASSWORD` - Regular test user password

### Functions

#### `loginAsUser(page, email?, password?)`
Login as a regular user. Uses default test credentials if not provided.

```typescript
await loginAsUser(page);
// or with custom credentials
await loginAsUser(page, 'custom@example.com', 'password123');
```

#### `loginAsAdmin(page)`
Login as admin user. Automatically uses admin credentials.

```typescript
await loginAsAdmin(page);
```

#### `registerUser(page, email, password)`
Register a new user account.

```typescript
await registerUser(page, 'newuser@example.com', 'password123');
```

#### `logout(page)`
Logout the current user.

```typescript
await logout(page);
```

#### `isLoggedIn(page)`
Check if user is currently logged in.

```typescript
const loggedIn = await isLoggedIn(page);
```

#### `isAdmin(page)`
Check if current user is admin.

```typescript
const userIsAdmin = await isAdmin(page);
```

#### `getCurrentUser(page)`
Get current user object from localStorage.

```typescript
const user = await getCurrentUser(page);
```

## Usage Example

```typescript
import { loginAsAdmin, loginAsUser, logout } from './helpers/auth';

test('my test', async ({ page }) => {
  // Login as admin
  await loginAsAdmin(page);
  
  // Do admin stuff
  await page.goto('/super');
  
  // Logout
  await logout(page);
  
  // Login as regular user
  await loginAsUser(page);
  
  // Do user stuff
  await page.goto('/dashboard');
});
```

