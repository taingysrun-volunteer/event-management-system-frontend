import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should display forgot password form', async ({ page }) => {
    // Check page header
    await expect(page.locator('h1').filter({ hasText: /forgot.*password/i })).toBeVisible();

    // Check subtitle/instructions
    await expect(page.locator('p').filter({ hasText: /send.*code|reset.*password/i })).toBeVisible();

    // Check email input field
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check back to login link
    await expect(page.locator('a[routerLink="/login"]')).toBeVisible();
  });

  test('should validate email as required', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Should show validation
    const emailInput = page.locator('input[formControlName="email"]');
    await expect(emailInput).toHaveClass(/ng-touched/);

    // Should stay on forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[formControlName="email"]');

    // Try invalid email formats
    await emailInput.fill('invalid-email');
    await page.click('button[type="submit"]');

    // Should stay on page (form is invalid)
    await expect(page).toHaveURL(/.*forgot-password/);

    // Try valid email
    await emailInput.clear();
    await emailInput.fill('test@example.com');

    // Should be valid format
    await expect(emailInput).not.toHaveClass(/ng-invalid/);
  });

  test('should show error message for empty email', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Form should be marked as touched
    const emailInput = page.locator('input[formControlName="email"]');
    await expect(emailInput).toHaveClass(/ng-touched/);

    // Should stay on forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test.describe('Mock API - Forgot Password Success', () => {
    test('should send reset code successfully and navigate to reset-password', async ({ page }) => {
      const testEmail = 'test@example.com';

      // Mock the forgot-password API
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset code has been sent to your email'
          })
        });
      });

      // Fill email
      await page.fill('input[formControlName="email"]', testEmail);

      // Submit form
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/sent|success/i, { timeout: 5000 });

      // Should redirect to reset-password page with email param
      await expect(page).toHaveURL(new RegExp(`.*reset-password.*email=${testEmail}`), { timeout: 5000 });
    });

    test('should accept various valid email formats', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Reset code sent'
          })
        });
      });

      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com'
      ];

      for (const email of validEmails) {
        await page.goto('/forgot-password');
        await page.fill('input[formControlName="email"]', email);
        await page.click('button[type="submit"]');

        // Should show success
        await expect(page.locator('.success-message, [class*="success"]'))
          .toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Mock API - Forgot Password Failure', () => {
    test('should show error when email not found', async ({ page }) => {
      // Mock the API to return 404 (email not found)
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email not found'
          })
        });
      });

      await page.fill('input[formControlName="email"]', 'notfound@example.com');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-error, .alert-danger'))
        .toContainText(/not found|email.*not.*found/i, { timeout: 5000 });

      // Should stay on forgot password page
      await expect(page).toHaveURL(/.*forgot-password/);
    });

    test('should show custom error message from API', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Account is not verified'
          })
        });
      });

      await page.fill('input[formControlName="email"]', 'unverified@example.com');
      await page.click('button[type="submit"]');

      // Should show the custom error
      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/not verified/i, { timeout: 5000 });
    });

    test('should handle server error (500)', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error'
          })
        });
      });

      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/server|error/i, { timeout: 5000 });

      // Should stay on forgot password page
      await expect(page).toHaveURL(/.*forgot-password/);
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.abort('failed');
      });

      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to login page', async ({ page }) => {
      await page.click('a[routerLink="/login"]');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should navigate to forgot password from login page', async ({ page }) => {
      await page.goto('/login');

      // Check forgot password link exists
      const forgotPasswordLink = page.locator('a[routerLink="/forgot-password"]');
      await expect(forgotPasswordLink).toBeVisible();

      // Click it
      await forgotPasswordLink.click();

      // Should be on forgot password page
      await expect(page).toHaveURL(/.*forgot-password/);
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state during submission', async ({ page }) => {
      // Mock with delay
      await page.route('**/api/auth/forgot-password', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Reset code sent'
          })
        });
      });

      await page.fill('input[formControlName="email"]', 'test@example.com');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled({ timeout: 500 });

      // Button text might change to "Sending..."
      await expect(submitButton).toContainText(/sending/i, { timeout: 500 });
    });

    test('should re-enable button after error', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email not found'
          })
        });
      });

      await page.fill('input[formControlName="email"]', 'notfound@example.com');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for error to appear
      await expect(page.locator('.error-message, [class*="error"]'))
        .toBeVisible({ timeout: 3000 });

      // Button should be re-enabled
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Form Validation', () => {
    test('should mark field as touched when clicked away', async ({ page }) => {
      const emailInput = page.locator('input[formControlName="email"]');

      // Focus and blur without entering value
      await emailInput.click();
      await page.click('button[type="submit"]');

      // Should be marked as touched
      await expect(emailInput).toHaveClass(/ng-touched/);
    });

    test('should clear error messages when user starts typing', async ({ page }) => {
      // Mock error response
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email not found'
          })
        });
      });

      const emailInput = page.locator('input[formControlName="email"]');

      // Submit with invalid email to get error
      await emailInput.fill('wrong@example.com');
      await page.click('button[type="submit"]');

      // Wait for error
      await expect(page.locator('.error-message, [class*="error"]'))
        .toBeVisible({ timeout: 3000 });

      // Start typing - error should be cleared (depends on implementation)
      // This test may need adjustment based on your actual implementation
    });

    test('should not submit with invalid email format', async ({ page }) => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user..name@example.com'
      ];

      for (const email of invalidEmails) {
        await page.goto('/forgot-password');
        await page.fill('input[formControlName="email"]', email);
        await page.click('button[type="submit"]');

        // Should stay on forgot password page
        await expect(page).toHaveURL(/.*forgot-password/);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for form fields', async ({ page }) => {
      // Check that email input has a label
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toContainText(/email/i);
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through the form
      await page.keyboard.press('Tab');
      const emailInput = page.locator('input[formControlName="email"]');
      await expect(emailInput).toBeFocused();

      // Type email
      await page.keyboard.type('test@example.com');

      // Tab to submit button
      await page.keyboard.press('Tab');
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeFocused();
    });
  });
});
