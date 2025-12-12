import { test, expect } from '@playwright/test';

test.describe('OTP Verification Flow', () => {
  const testEmail = 'testuser@example.com';

  test.beforeEach(async ({ page }) => {
    // Navigate directly to OTP verification page with email param
    await page.goto(`/verify-otp?email=${testEmail}`);
  });

  test('should display OTP verification form', async ({ page }) => {
    // Check page title/header
    await expect(page.locator('h2, h1').filter({ hasText: /verify.*email|email.*verification/i })).toBeVisible();

    // Check email is displayed
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();

    // Check OTP input field exists
    await expect(page.locator('input[formControlName="otpCode"]')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check resend button
    await expect(page.locator('button').filter({ hasText: /resend/i })).toBeVisible();

    // Check back to login link
    await expect(page.locator('a[routerLink="/login"]')).toBeVisible();
  });

  test('should validate OTP code format (6 digits)', async ({ page }) => {
    const otpInput = page.locator('input[formControlName="otpCode"]');

    // Try invalid inputs
    await otpInput.fill('12345'); // Too short
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*verify-otp/); // Should stay on page

    await otpInput.clear();
    await otpInput.fill('1234567'); // Too long - should be trimmed
    const value = await otpInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(6);

    await otpInput.clear();
    await otpInput.fill('abc123'); // Contains letters - should be filtered
    const numericValue = await otpInput.inputValue();
    expect(/^\d*$/.test(numericValue)).toBeTruthy(); // Should only contain digits
  });

  test('should show validation error for empty OTP', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('input[formControlName="otpCode"]')).toHaveClass(/ng-touched/);

    // Should stay on verification page
    await expect(page).toHaveURL(/.*verify-otp/);
  });

  test.describe('Mock API - OTP Verification Success', () => {
    test('should verify OTP successfully and redirect to events', async ({ page }) => {
      // Mock the verify-otp API
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: '123',
              username: 'testuser',
              email: testEmail,
              firstName: 'Test',
              lastName: 'User',
              role: 'USER'
            }
          })
        });
      });

      // Fill OTP code
      await page.fill('input[formControlName="otpCode"]', '123456');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/verified|success/i, { timeout: 5000 });

      // Should redirect to events page
      await expect(page).toHaveURL(/.*events/, { timeout: 5000 });
    });

    test('should accept various valid 6-digit codes', async ({ page }) => {
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: '123',
              username: 'testuser',
              email: testEmail,
              firstName: 'Test',
              lastName: 'User',
              role: 'USER'
            }
          })
        });
      });

      const validCodes = ['000000', '123456', '999999', '100000'];

      for (const code of validCodes) {
        await page.goto(`/verify-otp?email=${testEmail}`);
        await page.fill('input[formControlName="otpCode"]', code);
        await page.click('button[type="submit"]');

        // Should succeed
        await expect(page.locator('.success-message, [class*="success"]'))
          .toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Mock API - OTP Verification Failure', () => {
    test('should show error for invalid OTP code', async ({ page }) => {
      // Mock the API to return error for invalid OTP
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid or expired OTP code'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '999999');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-error, .alert-danger'))
        .toContainText(/invalid|expired/i, { timeout: 5000 });

      // Should stay on verification page
      await expect(page).toHaveURL(/.*verify-otp/);
    });

    test('should show error for expired OTP code', async ({ page }) => {
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'OTP code has expired'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/expired/i, { timeout: 5000 });
    });

    test('should handle server error (500)', async ({ page }) => {
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toBeVisible({ timeout: 5000 });
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/auth/verify-otp', async (route) => {
        await route.abort('failed');
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Resend OTP Functionality', () => {
    test('should resend OTP successfully', async ({ page }) => {
      // Mock the resend-otp API
      await page.route('**/api/auth/resend-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'A new verification code has been sent to your email.',
            email: testEmail
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });

      // Click resend button
      await resendButton.click();

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/sent|new.*code/i, { timeout: 5000 });

      // Button should show cooldown timer
      await expect(resendButton).toContainText(/\d+s/, { timeout: 1000 });

      // Button should be disabled during cooldown
      await expect(resendButton).toBeDisabled();
    });

    test('should prevent rapid resend requests (cooldown)', async ({ page }) => {
      await page.route('**/api/auth/resend-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'A new verification code has been sent.',
            email: testEmail
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });

      // First resend
      await resendButton.click();

      // Wait a moment for cooldown to start
      await page.waitForTimeout(500);

      // Should be disabled
      await expect(resendButton).toBeDisabled();

      // Should show countdown
      await expect(resendButton).toContainText(/\d+s/);
    });

    test('should handle resend error', async ({ page }) => {
      await page.route('**/api/auth/resend-otp', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email is already verified'
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });
      await resendButton.click();

      // Should show error
      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to login page', async ({ page }) => {
      await page.click('a[routerLink="/login"]');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should redirect to register if no email in query params', async ({ page }) => {
      // Navigate to OTP page without email parameter
      await page.goto('/verify-otp');

      // Should redirect to register page
      await expect(page).toHaveURL(/.*register/, { timeout: 3000 });
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state during verification', async ({ page }) => {
      await page.route('**/api/auth/verify-otp', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-token',
            user: { id: '123', username: 'test' }
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled({ timeout: 500 });
    });

    test('should show loading state during resend', async ({ page }) => {
      await page.route('**/api/auth/resend-otp', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success', email: testEmail })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });
      await resendButton.click();

      // Button should be disabled during loading
      await expect(resendButton).toBeDisabled({ timeout: 500 });
    });
  });

  test.describe('Auto-formatting', () => {
    test('should only accept numeric input', async ({ page }) => {
      const otpInput = page.locator('input[formControlName="otpCode"]');

      // Try typing letters and special characters
      await otpInput.fill('abc!@#123');

      // Should only contain numbers
      const value = await otpInput.inputValue();
      expect(/^\d*$/.test(value)).toBeTruthy();
      expect(value).toBe('123');
    });

    test('should limit to 6 digits', async ({ page }) => {
      const otpInput = page.locator('input[formControlName="otpCode"]');

      // Try entering more than 6 digits
      await otpInput.fill('1234567890');

      // Should be trimmed to 6 digits
      const value = await otpInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(6);
    });
  });
});
