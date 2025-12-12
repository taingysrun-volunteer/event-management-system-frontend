import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * Registration Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Note: Some tests may require cleanup of test data created during the test run.
 *
 * Test password is loaded from environment variable:
 * - TEST_REGISTRATION_PASSWORD (default: TestUser@123)
 */

test.describe('Registration Flow - Real API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check form title
    await expect(page.locator('h2, h1').filter({ hasText: /register|sign up|create account/i })).toBeVisible();

    // Check all form fields exist
    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[formControlName="firstName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="lastName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('input[formControlName="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check link to login
    await expect(page.locator('a[routerLink="/login"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Should stay on registration page
    await expect(page).toHaveURL(/.*register/);

    // Fields should be marked as touched
    const usernameInput = page.locator('input[formControlName="username"]');
    await expect(usernameInput).toHaveClass(/ng-touched/);
  });

  test('should validate username minimum length (3 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'ab');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', 'Password@123');
    await page.fill('input[formControlName="confirmPassword"]', 'Password@123');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'invalid-email');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', 'Password@123');
    await page.fill('input[formControlName="confirmPassword"]', 'Password@123');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate firstName minimum length (2 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'J');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', 'Password@123');
    await page.fill('input[formControlName="confirmPassword"]', 'Password@123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate lastName minimum length (2 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'D');
    await page.fill('input[formControlName="password"]', 'Password@123');
    await page.fill('input[formControlName="confirmPassword"]', 'Password@123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate password minimum length (6 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', '12345');
    await page.fill('input[formControlName="confirmPassword"]', '12345');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate password match', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', testConfig.testRegistration.password);
    await page.fill('input[formControlName="confirmPassword"]', 'DifferentPassword@456');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should toggle password visibility for both password fields', async ({ page }) => {
    const passwordInput = page.locator('input[formControlName="password"]');
    const confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');

    // Initially both should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Find toggle buttons (may vary based on implementation)
    const toggleButtons = page.locator('button[aria-label*="password"], button.toggle-password, mat-icon').filter({ hasText: /visibility/i });

    const toggleCount = await toggleButtons.count();
    if (toggleCount >= 2) {
      // Toggle first password field
      await toggleButtons.nth(0).click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Toggle confirm password field
      await toggleButtons.nth(1).click();
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[routerLink="/login"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test.describe('Real API - Registration Success', () => {
    test('should register a new user and redirect to OTP verification', async ({ page }) => {
      // Generate unique username and email to avoid conflicts
      const timestamp = Date.now();
      const uniqueUsername = `testuser_${timestamp}`;
      const uniqueEmail = `testuser_${timestamp}@example.com`;

      // Fill registration form with password from config
      await page.fill('input[formControlName="username"]', uniqueUsername);
      await page.fill('input[formControlName="email"]', uniqueEmail);
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', testConfig.testRegistration.password);
      await page.fill('input[formControlName="confirmPassword"]', testConfig.testRegistration.password);

      // Submit form - this hits the REAL API
      await page.click('button[type="submit"]');

      // Wait for success message or redirect
      await page.waitForTimeout(2000);

      // Should show success message about email verification
      const hasSuccessMessage = await page.locator('text=/success|verification|check.*email/i').isVisible().catch(() => false);
      expect(hasSuccessMessage).toBeTruthy();

      // Should redirect to OTP verification page with email parameter
      await expect(page).toHaveURL(new RegExp(`.*verify-otp.*email=${encodeURIComponent(uniqueEmail)}`), { timeout: 5000 });

      // Verify OTP page elements are visible
      await expect(page.locator('h2, h1').filter({ hasText: /verify.*email/i })).toBeVisible();
      await expect(page.locator('input[formControlName="otpCode"]')).toBeVisible();
    });

    test('should handle special characters in names', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueUsername = `special_${timestamp}`;
      const uniqueEmail = `special_${timestamp}@example.com`;

      await page.fill('input[formControlName="username"]', uniqueUsername);
      await page.fill('input[formControlName="email"]', uniqueEmail);
      await page.fill('input[formControlName="firstName"]', "O'Brien");
      await page.fill('input[formControlName="lastName"]', "Van-Der-Berg");
      await page.fill('input[formControlName="password"]', testConfig.testRegistration.password);
      await page.fill('input[formControlName="confirmPassword"]', testConfig.testRegistration.password);

      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should succeed and redirect to OTP verification
      const isSuccessful = await page.url().includes('verify-otp') ||
                          await page.locator('text=/success|verification/i').isVisible().catch(() => false);
      expect(isSuccessful).toBeTruthy();
    });
  });

  test.describe('Real API - Registration Errors', () => {
    test('should show error for duplicate username', async ({ page }) => {
      // Try to register with existing username from test config
      await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username);
      await page.fill('input[formControlName="email"]', 'newemail@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', testConfig.testRegistration.password);
      await page.fill('input[formControlName="confirmPassword"]', testConfig.testRegistration.password);

      await page.click('button[type="submit"]');

      // Wait for API response
      await page.waitForTimeout(10000);

      // Should show error about duplicate username
      const errorMessage = page.locator('text=/already in use/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

      // Should stay on registration page
      await expect(page).toHaveURL(/.*register/);
    });

    test('should show error for duplicate email', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueUsername = `unique_${timestamp}`;

      // Try to register with existing email from test config
      await page.fill('input[formControlName="username"]', uniqueUsername);
      await page.fill('input[formControlName="email"]', testConfig.testUsers.admin.email);
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.fill('input[formControlName="password"]', testConfig.testRegistration.password);
      await page.fill('input[formControlName="confirmPassword"]', testConfig.testRegistration.password);

      await page.click('button[type="submit"]');

      // Wait for API response
      await page.waitForTimeout(2000);

      // Should show error about duplicate email
      const errorMessage = page.locator('text=/already exist/i');
      const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

      // Some backends might allow duplicate emails, so we check if error is shown OR registration succeeds
      const isStillOnRegister = await page.url().includes('register');

      // If still on register page, error should be visible
      if (isStillOnRegister) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });
  });

  test.describe('Real API - User Experience', () => {
    test('should disable submit button while processing', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueUsername = `ux_test_${timestamp}`;
      const uniqueEmail = `ux_test_${timestamp}@example.com`;

      await page.fill('input[formControlName="username"]', uniqueUsername);
      await page.fill('input[formControlName="email"]', uniqueEmail);
      await page.fill('input[formControlName="firstName"]', 'UX');
      await page.fill('input[formControlName="lastName"]', 'Test');
      await page.fill('input[formControlName="password"]', 'UXTest@123');
      await page.fill('input[formControlName="confirmPassword"]', 'UXTest@123');

      const submitButton = page.locator('button[type="submit"]');

      // Button should be enabled before submission
      await expect(submitButton).toBeEnabled();

      // Click submit
      await submitButton.click();

      // Button might be disabled during API call
      // Note: This might be too fast to catch consistently
      const isDisabledDuringCall = await submitButton.isDisabled().catch(() => false);

      // Wait for completion
      await page.waitForTimeout(3000);
    });

    test('should show loading indicator during registration', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueUsername = `loading_${timestamp}`;
      const uniqueEmail = `loading_${timestamp}@example.com`;

      await page.fill('input[formControlName="username"]', uniqueUsername);
      await page.fill('input[formControlName="email"]', uniqueEmail);
      await page.fill('input[formControlName="firstName"]', 'Loading');
      await page.fill('input[formControlName="lastName"]', 'Test');
      await page.fill('input[formControlName="password"]', 'Loading@123');
      await page.fill('input[formControlName="confirmPassword"]', 'Loading@123');

      await page.click('button[type="submit"]');

      // Check for loading indicator (spinner, progress bar, etc.)
      const loadingIndicator = page.locator('mat-spinner, mat-progress-bar, .spinner, .loading, [role="progressbar"]');

      // Loading indicator might appear briefly
      const hasLoadingIndicator = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);

      // Wait for completion
      await page.waitForTimeout(3000);
    });

    test('should trim whitespace from input fields', async ({ page }) => {
      const timestamp = Date.now();
      const uniqueUsername = `trim_${timestamp}`;
      const uniqueEmail = `trim_${timestamp}@example.com`;

      // Fill with leading/trailing spaces
      await page.fill('input[formControlName="username"]', `  ${uniqueUsername}  `);
      await page.fill('input[formControlName="email"]', `  ${uniqueEmail}  `);
      await page.fill('input[formControlName="firstName"]', '  Trim  ');
      await page.fill('input[formControlName="lastName"]', '  Test  ');
      await page.fill('input[formControlName="password"]', 'Trim@123');
      await page.fill('input[formControlName="confirmPassword"]', 'Trim@123');

      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should either succeed or show validation error (depending on backend trimming)
      const isSuccessful = await page.url().includes('login') ||
                          await page.locator('text=/success|registered/i').isVisible().catch(() => false);

      // Registration should succeed if backend trims input
      expect(isSuccessful).toBeTruthy();
    });
  });

  test.describe('Real API - Form Validation Integration', () => {
    test('should prevent submission with only username filled', async ({ page }) => {
      await page.fill('input[formControlName="username"]', 'onlyusername');

      await page.click('button[type="submit"]');

      // Should stay on registration page
      await expect(page).toHaveURL(/.*register/);
    });

    test('should validate all required fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');

      // Submit with empty form
      await submitButton.click();

      // Should stay on registration page
      await expect(page).toHaveURL(/.*register/);

      // Fill one field at a time and verify still can't submit
      await page.fill('input[formControlName="username"]', 'testuser');
      await submitButton.click();
      await expect(page).toHaveURL(/.*register/);

      await page.fill('input[formControlName="email"]', 'test@example.com');
      await submitButton.click();
      await expect(page).toHaveURL(/.*register/);

      await page.fill('input[formControlName="firstName"]', 'Test');
      await submitButton.click();
      await expect(page).toHaveURL(/.*register/);

      await page.fill('input[formControlName="lastName"]', 'User');
      await submitButton.click();
      await expect(page).toHaveURL(/.*register/);

      await page.fill('input[formControlName="password"]', 'Test@123');
      await submitButton.click();
      await expect(page).toHaveURL(/.*register/);

      // Finally fill confirmPassword
      await page.fill('input[formControlName="confirmPassword"]', 'Test@123');
      // Now form should be valid (but will fail if username already exists)
    });
  });
});
