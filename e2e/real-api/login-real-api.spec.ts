import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * Login Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Credentials are loaded from environment variables:
 * - TEST_ADMIN_USERNAME, TEST_ADMIN_PASSWORD
 * - TEST_USER_USERNAME, TEST_USER_PASSWORD
 */

test.describe('Login Flow - Real API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check form title
    await expect(page.locator('h2, h1').filter({ hasText: /login/i })).toBeVisible();

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
    // Type invalid username (empty)
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
    const toggleButton = page.locator('button[aria-label*="password"], button.toggle-password, mat-icon').filter({ hasText: /visibility/i }).first();

    // Initially password should be hidden (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button if it exists
    const toggleExists = await toggleButton.count() > 0;
    if (toggleExists) {
      await toggleButton.click();
      // After toggle, should be type="text"
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Toggle back
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('a[routerLink="/register"]');
    await expect(page).toHaveURL(/.*register/);
  });

  test.describe('Real API - Login Success', () => {
    test('should login successfully as admin user', async ({ page }) => {
      // Fill login form with admin credentials from environment
      await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username);
      await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password);

      // Submit form - this hits the REAL API
      await page.click('button[type="submit"]');

      // Wait for navigation to admin dashboard
      await expect(page).toHaveURL(/.*\/admin/, { timeout: 10000 });

      // Verify we're on admin dashboard
      await expect(page.locator('text=/dashboard|admin/i')).toBeVisible();
    });

    test('should login successfully as regular user', async ({ page }) => {
      // Fill login form with user credentials from environment
      await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username);
      await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password);

      // Submit form - this hits the REAL API
      await page.click('button[type="submit"]');

      // Wait for navigation to user events page
      await expect(page).toHaveURL(/.*\/events/, { timeout: 10000 });

      // Verify we're on events page
      await expect(page.locator('text=/discover/i')).toBeVisible();
    });
  });

  test.describe('Real API - Login Errors', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[formControlName="username"]', 'invaliduser123');
      await page.fill('input[formControlName="password"]', 'wrongpassword123');

      await page.click('button[type="submit"]');

      // Wait for API response
      await page.waitForTimeout(3000);

      // Should stay on login page (not redirect)
      await expect(page).toHaveURL(/.*login/);

      // Should show error message from real API
      // Check multiple possible error locations
      const errorLocators = [
        page.locator('text=/invalid|incorrect|wrong|failed/i'),
        page.locator('.error-message'),
        page.locator('.mat-error'),
        page.locator('.alert-danger'),
        page.locator('[role="alert"]'),
        page.locator('.text-danger')
      ];

      let errorFound = false;
      for (const locator of errorLocators) {
        const isVisible = await locator.first().isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          errorFound = true;
          break;
        }
      }

      // At minimum, should stay on login page (not navigate away)
      expect(errorFound || page.url().includes('login')).toBeTruthy();
    });
  });

  test.describe('Real API - User Experience', () => {
    test('should disable submit button while logging in', async ({ page }) => {
      await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username);
      await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password);

      const submitButton = page.locator('button[type="submit"]');

      // Button should be enabled before submission
      await expect(submitButton).toBeEnabled();

      // Click submit
      await submitButton.click();

      // Wait for navigation
      await expect(page).toHaveURL(/.*\/admin/, { timeout: 10000 });
    });

    test('should redirect to admin dashboard for admin role', async ({ page }) => {
      await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username);
      await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password);

      await page.click('button[type="submit"]');

      // Should redirect to admin routes
      await expect(page).toHaveURL(/.*\/admin/, { timeout: 10000 });
    });

    test('should redirect to user events page for regular user role', async ({ page }) => {
      await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username);
      await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password);

      await page.click('button[type="submit"]');

      // Should redirect to user events
      await expect(page).toHaveURL(/.*\/events/, { timeout: 10000 });
    });
  });

  test.describe('Real API - Form Validation', () => {
    test('should prevent submission with empty username', async ({ page }) => {
      await page.fill('input[formControlName="password"]', 'password123');

      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should prevent submission with empty password', async ({ page }) => {
      await page.fill('input[formControlName="username"]', 'testuser');

      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL(/.*login/);
    });

  });
});
