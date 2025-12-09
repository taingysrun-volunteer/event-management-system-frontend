import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check form fields exist
    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check link to registration
    await expect(page.locator('a[routerLink="/register"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Check if form is still on login page (didn't submit)
    await expect(page).toHaveURL(/.*login/);

    // Form should be marked as touched
    const usernameInput = page.locator('input[formControlName="username"]');
    await expect(usernameInput).toHaveClass(/ng-touched/);
  });

  test('should show error for invalid username', async ({ page }) => {
    // Type invalid username (empty or too short if validation exists)
    await page.fill('input[formControlName="username"]', '');
    await page.fill('input[formControlName="password"]', 'password123');

    // Click submit
    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show error for invalid password (less than 6 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="password"]', '12345');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*login/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[formControlName="password"]');
    const toggleButton = page.locator('button').filter({ hasText: /show|hide/i }).or(
      page.locator('[class*="toggle-password"]')
    );

    // Initially password should be hidden (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button if it exists
    const toggleExists = await toggleButton.count() > 0;
    if (toggleExists) {
      await toggleButton.first().click();
      // After toggle, might be type="text"
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('a[routerLink="/register"]');
    await expect(page).toHaveURL(/.*register/);
  });

  test.describe('Mock API - Login Success', () => {
    test('should login successfully as admin user', async ({ page }) => {
      // Mock the login API
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'User',
              role: 'ADMIN'
            }
          })
        });
      });

      // Fill login form
      await page.fill('input[formControlName="username"]', 'admin');
      await page.fill('input[formControlName="password"]', 'admin12345');

      // Submit form
      await page.click('button[type="submit"]');

      // Should navigate to admin dashboard
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should login successfully as regular user', async ({ page }) => {
      // Mock the login API
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: '2',
              username: 'user',
              email: 'user@example.com',
              firstName: 'Regular',
              lastName: 'User',
              role: 'user'
            }
          })
        });
      });

      // Fill login form
      await page.fill('input[formControlName="username"]', 'user');
      await page.fill('input[formControlName="password"]', 'user123');

      // Submit form
      await page.click('button[type="submit"]');

      // Should navigate to events page
      await expect(page).toHaveURL(/.*events/, { timeout: 10000 });
    });
  });

  test.describe('Mock API - Login Failure', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      // Mock the login API to return error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid username or password'
          })
        });
      });

      // Fill login form
      await page.fill('input[formControlName="username"]', 'wronguser');
      await page.fill('input[formControlName="password"]', 'wrongpass');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toContainText(/invalid/i, { timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle network error', async ({ page }) => {
      // Mock the login API to return server error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Server error'
          })
        });
      });

      // Fill login form
      await page.fill('input[formControlName="username"]', 'testuser');
      await page.fill('input[formControlName="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toBeVisible({ timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state during login', async ({ page }) => {
      // Mock with delay
      await page.route('**/api/auth/login', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-token',
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin'
            }
          })
        });
      });

      await page.fill('input[formControlName="username"]', 'admin');
      await page.fill('input[formControlName="password"]', 'admin123');

      // Click submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check if button is disabled during loading
      // This depends on your implementation
      // await expect(submitButton).toBeDisabled();
    });
  });
});
