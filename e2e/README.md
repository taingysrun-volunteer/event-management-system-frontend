# E2E Testing with Playwright

This directory contains end-to-end tests for the Event Management Application using Playwright.

## Test Structure

```
e2e/
├── real-api/                           # Tests using real backend API
│   ├── login-real-api.spec.ts         # Login with real API
│   ├── registration-real-api.spec.ts  # Registration with real API
│   ├── event-management-hybrid.spec.ts # Event CRUD with real API
│   ├── event-detail.spec.ts           # Event detail view tests
│   ├── my-registrations.spec.ts       # User event registrations
│   ├── user-management.spec.ts        # User management (admin)
│   └── category-management.spec.ts    # Category management (admin)
├── mocked/                             # Tests using mocked API responses
│   ├── login.spec.ts                  # Login flow tests (13 tests)
│   ├── registration.spec.ts           # Registration flow tests (20 tests)
│   └── event-management.spec.ts       # Event CRUD operations (11 tests)
├── config/                             # Test configuration files
├── helpers/                            # Helper functions
└── README.md                          # This file
```

## Running Tests

### Run all tests (headless)
```bash
npm run e2e
```

### Run only real API tests (recommended for production validation)
```bash
npx playwright test e2e/real-api/
```

### Run only mocked tests (fast, for development)
```bash
npx playwright test e2e/mocked/
```

### Run tests with UI Mode (Recommended for development)
```bash
npm run e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run e2e:headed
```

### Run specific browser
```bash
npm run e2e:chromium   # Chrome only
npm run e2e:firefox    # Firefox only
npm run e2e:webkit     # Safari only
```

### Debug mode (step through tests)
```bash
npm run e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/real-api/login-real-api.spec.ts
npx playwright test e2e/mocked/login.spec.ts
```

### Run specific test by name
```bash
npx playwright test -g "should login successfully"
```

### View test report
```bash
npm run e2e:report
```

## Test Development

### Generate tests with Codegen
Playwright can record your actions and generate test code:

```bash
npm run e2e:codegen
```

This opens a browser where you can interact with your app, and Playwright will generate the test code.

### Watch mode
```bash
npx playwright test --watch
```

## Test Coverage

### Real API Tests (e2e/real-api/)
Tests that interact with the actual backend API deployed on production.

#### login-real-api.spec.ts
- Real authentication flow
- Token management and storage
- Admin and user login scenarios
- Error handling for invalid credentials
- Form validation integration
- Password visibility toggle
- Role-based redirect verification

#### registration-real-api.spec.ts
- Real user registration with backend
- Unique user creation with timestamp
- Form validation (username, email, names, password)
- Password matching validation
- Duplicate username/email detection
- Special characters handling
- Input trimming and sanitization

#### event-management-hybrid.spec.ts
- Complete event CRUD with real API
- Admin and user flows
- Real-time data persistence

#### event-detail.spec.ts
- Event detail page functionality
- Registration form integration
- QR code generation

#### my-registrations.spec.ts
- User event registrations view
- Registration management
- QR code display

#### user-management.spec.ts
- Admin user management
- User CRUD operations
- Role management

#### category-management.spec.ts
- Category CRUD operations
- Admin category management

### Mocked API Tests (e2e/mocked/)
Tests using mocked API responses for fast, isolated testing.

#### login.spec.ts
- Display login form
- Validation errors for empty fields
- Invalid username/password validation
- Password visibility toggle
- Navigation to registration
- Successful admin login (mocked)
- Successful user login (mocked)
- Error handling (401, 500)
- Loading states

#### registration.spec.ts
- Display registration form
- Field validations (username, email, names, password)
- Password match validation
- Password visibility toggles
- Email format validation
- Successful registration (mocked)
- Duplicate username/email handling (409)
- Server error handling (500)
- Network error handling
- Special characters in fields

#### event-management.spec.ts
- Admin dashboard access (mocked)
- Event list display (mocked)
- Create new event (mocked)
- Edit existing event (mocked)
- Delete event with confirmation (mocked)
- User view events (mocked)

## Test Patterns

### 1. Real API Tests
Tests in `e2e/real-api/` use the actual backend API:

```typescript
// No mocking - uses real API calls
await page.goto('/login');
await page.fill('[formControlName="username"]', 'admin');
await page.fill('[formControlName="password"]', 'Admin@123');
await page.click('button[type="submit"]');
// Waits for real API response
```

### 2. Mocked API Tests
Tests in `e2e/mocked/` use route mocking to simulate backend responses:

```typescript
await page.route('**/api/auth/login', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: 'mock-token', user: {...} })
  });
});
```

### 3. Before Each Setup
Common setup is done in `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  // Common setup...
});
```

### 4. Assertions
Use Playwright's auto-waiting assertions:

```typescript
await expect(page.locator('h2')).toContainText('Login');
await expect(page).toHaveURL(/.*admin/);
```

## Configuration

### Playwright Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `https://event-management-system-frontend-phi.vercel.app` (Production)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30s for navigation
- **Screenshots**: On failure only
- **Video**: On first retry
- **Trace**: On first retry
- **Web Server**: Disabled (testing against production deployment)

### Environment Variables

Test credentials are configured using environment variables. Create a `.env` file in the `e2e` directory:

```bash
cp e2e/.env.example e2e/.env
```

Edit the `.env` file with your test credentials:

```bash
# Test Admin User Credentials
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=admin12345
TEST_ADMIN_EMAIL=admin@example.com

# Test Regular User Credentials
TEST_USER_USERNAME=user_test
TEST_USER_PASSWORD=test123
TEST_USER_EMAIL=user@example.com

# Test Registration Password
TEST_REGISTRATION_PASSWORD=TestUser@123

# API Base URL
API_BASE_URL=http://localhost:8080

# Mock API Toggle
USE_MOCK_API=false
```

**Important Notes:**
- These credentials must match real users in your test database
- Never commit the `.env` file to version control
- For CI/CD, set these as environment variables or secrets
- The `.env.example` file is provided as a template

## Artifacts

After test runs, check these directories:

- `playwright-report/` - HTML report
- `test-results/` - Screenshots, videos, traces
- `playwright-report/results.xml` - JUnit XML for CI

## Debugging Failed Tests

### 1. View trace
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### 2. Run with debug mode
```bash
npm run e2e:debug
```

### 3. Check screenshots
Failed tests automatically capture screenshots in `test-results/`

### 4. Use UI Mode
```bash
npm run e2e:ui
```
This provides a visual interface to debug tests step-by-step.

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Use data-testid**: Add `data-testid` attributes for stable selectors
   ```html
   <button data-testid="login-submit">Login</button>
   ```
   ```typescript
   await page.click('[data-testid="login-submit"]');
   ```

2. **Separate concerns**:
   - Use `mocked/` tests for fast, isolated unit-like e2e tests
   - Use `real-api/` tests for production validation and integration testing

3. **Auto-waiting**: Playwright waits automatically, avoid manual `wait()` calls

4. **Page Object Model**: For larger apps, consider using POM pattern

5. **Parallel execution**: Tests run in parallel by default for speed

6. **Clean state**: Each test should be independent

7. **Real API testing**: When testing with real APIs, ensure:
   - Test data is predictable or use test accounts
   - Tests clean up after themselves
   - API is accessible from test environment

## UI Mode Features

When running `npm run e2e:ui`:

- Watch tests run in real-time
- Pause and step through tests
- Inspect DOM at any point
- See network requests
- Time travel through test execution
- Pick locators visually

## Useful Links

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## Troubleshooting

### Tests timing out?
- Increase timeout in `playwright.config.ts`
- Check production URL is accessible
- For real API tests: ensure backend is running and accessible
- For mocked tests: ensure route mocking is properly configured

### Browser not launching?
```bash
npx playwright install
```

## Metrics

**Real API Tests**: 7 test files
- login-real-api.spec.ts
- registration-real-api.spec.ts
- event-management-hybrid.spec.ts
- event-detail.spec.ts
- my-registrations.spec.ts
- user-management.spec.ts
- category-management.spec.ts

**Mocked Tests**: 3 test files
- login.spec.ts (13 tests)
- registration.spec.ts (20 tests)
- event-management.spec.ts (11 tests)

**Browsers tested**: 5 configurations
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5, iPhone 12

**Environment**: Production deployment on Vercel
- Frontend: https://event-management-system-frontend-phi.vercel.app
- Backend API: Connected to production backend
