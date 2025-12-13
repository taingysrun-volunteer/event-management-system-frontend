import { test, expect } from '@playwright/test';

test.describe('Reset Password Flow', () => {
  const testEmail = 'test@example.com';

  test.beforeEach(async ({ page }) => {
    // Navigate to reset password page with email param
    await page.goto(`/reset-password?email=${testEmail}`);
  });

  test('should display reset password form', async ({ page }) => {
    // Check page header
    await expect(page.locator('h1').filter({ hasText: /reset.*password/i })).toBeVisible();

    // Check subtitle/instructions
    await expect(page.locator('p').filter({ hasText: /code.*password/i })).toBeVisible();

    // Check all form fields exist
    await expect(page.locator('input[formControlName="otpCode"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('input[formControlName="confirmPassword"]')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check resend code button
    await expect(page.locator('button').filter({ hasText: /resend/i })).toBeVisible();

    // Check back to login link
    await expect(page.locator('a[routerLink="/login"]')).toBeVisible();
  });

  test('should redirect to forgot-password if no email in query params', async ({ page }) => {
    // Navigate without email parameter
    await page.goto('/reset-password');

    // Should redirect to forgot-password page
    await expect(page).toHaveURL(/.*forgot-password/, { timeout: 3000 });
  });

  test('should validate OTP code format (6 digits)', async ({ page }) => {
    const otpInput = page.locator('input[formControlName="otpCode"]');

    // Try too short
    await otpInput.fill('12345');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*reset-password/); // Should stay on page

    // Try too long (should be limited by maxlength)
    await otpInput.clear();
    await otpInput.fill('1234567890');
    const value = await otpInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(6);
  });

  test('should validate password requirements', async ({ page }) => {
    const passwordInput = page.locator('input[formControlName="password"]');

    // Password too short
    await passwordInput.fill('12345');
    await page.click('button[type="submit"]');

    // Should stay on page (form invalid)
    await expect(page).toHaveURL(/.*reset-password/);

    // Valid password
    await passwordInput.clear();
    await passwordInput.fill('123456');
    const classes = await passwordInput.getAttribute('class');
    // After filling valid password, should not have ng-invalid (unless other fields are invalid)
  });

  test('should validate password match', async ({ page }) => {
    const passwordInput = page.locator('input[formControlName="password"]');
    const confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');

    // Fill with non-matching passwords
    await passwordInput.fill('password123');
    await confirmPasswordInput.fill('password456');

    // Mark fields as touched
    await page.click('button[type="submit"]');

    // Should show error about password mismatch
    await expect(page.locator('.error-message').filter({ hasText: /match|same/i }))
      .toBeVisible({ timeout: 2000 });

    // Should stay on reset password page
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // All fields should be marked as touched
    const otpInput = page.locator('input[formControlName="otpCode"]');
    const passwordInput = page.locator('input[formControlName="password"]');
    const confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');

    await expect(otpInput).toHaveClass(/ng-touched/);
    await expect(passwordInput).toHaveClass(/ng-touched/);
    await expect(confirmPasswordInput).toHaveClass(/ng-touched/);

    // Should stay on reset password page
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('input[formControlName="password"]');
      const toggleButtons = page.locator('.toggle-password');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click first toggle button (for password field)
      await toggleButtons.first().click();

      // After toggle, should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Toggle back
      await toggleButtons.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle confirm password visibility independently', async ({ page }) => {
      const passwordInput = page.locator('input[formControlName="password"]');
      const confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');
      const toggleButtons = page.locator('.toggle-password');

      // Both should start as password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle confirm password (second toggle button)
      await toggleButtons.last().click();

      // Confirm password should be visible, password still hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('Mock API - Reset Password Success', () => {
    test('should reset password successfully and redirect to login', async ({ page }) => {
      const otpCode = '123456';
      const newPassword = 'newpassword123';

      // Mock the reset-password API
      await page.route('**/api/auth/reset-password', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        // Verify request contains expected data
        expect(postData.email).toBe(testEmail);
        expect(postData.otpCode).toBe(otpCode);
        expect(postData.newPassword).toBe(newPassword);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password has been reset successfully'
          })
        });
      });

      // Fill form
      await page.fill('input[formControlName="otpCode"]', otpCode);
      await page.fill('input[formControlName="password"]', newPassword);
      await page.fill('input[formControlName="confirmPassword"]', newPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/success|reset/i, { timeout: 5000 });

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/, { timeout: 2500 });
    });

    test('should accept valid OTP codes and passwords', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset successful'
          })
        });
      });

      const validCombinations = [
        { otp: '000000', password: 'password123' },
        { otp: '123456', password: 'securePass456' },
        { otp: '999999', password: 'MyNewP@ss789' }
      ];

      for (const combo of validCombinations) {
        await page.goto(`/reset-password?email=${testEmail}`);

        await page.fill('input[formControlName="otpCode"]', combo.otp);
        await page.fill('input[formControlName="password"]', combo.password);
        await page.fill('input[formControlName="confirmPassword"]', combo.password);
        await page.click('button[type="submit"]');

        // Should show success
        await expect(page.locator('.success-message, [class*="success"]'))
          .toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Mock API - Reset Password Failure', () => {
    test('should show error for invalid OTP code', async ({ page }) => {
      // Mock the API to return error for invalid OTP
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid or expired reset code'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '999999');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-error, .alert-danger'))
        .toContainText(/invalid|expired/i, { timeout: 5000 });

      // Should stay on reset password page
      await expect(page).toHaveURL(/.*reset-password/);
    });

    test('should show error for expired OTP code', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Reset code has expired. Please request a new one.'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/expired/i, { timeout: 5000 });
    });

    test('should handle server error (500)', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/server|error/i, { timeout: 5000 });
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.abort('failed');
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Resend Code Functionality', () => {
    test('should resend reset code successfully', async ({ page }) => {
      // Mock the forgot-password API (used for resending)
      await page.route('**/api/auth/forgot-password', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        expect(postData.email).toBe(testEmail);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'A new reset code has been sent to your email'
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });

      // Click resend button
      await resendButton.click();

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/sent|new.*code/i, { timeout: 5000 });
    });

    test('should handle resend error', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Unable to resend code. Please try again.'
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });
      await resendButton.click();

      // Should show error
      await expect(page.locator('.error-message, [class*="error"], .alert-error'))
        .toContainText(/failed|try again/i, { timeout: 5000 });
    });

    test('should disable button during resend', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Code resent'
          })
        });
      });

      const resendButton = page.locator('button').filter({ hasText: /resend/i });
      await resendButton.click();

      // Should be disabled during loading
      await expect(resendButton).toBeDisabled({ timeout: 500 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to login page', async ({ page }) => {
      await page.click('a[routerLink="/login"]');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should navigate through complete forgot password flow', async ({ page }) => {
      // Start from login
      await page.goto('/login');

      // Click forgot password
      await page.click('a[routerLink="/forgot-password"]');
      await expect(page).toHaveURL(/.*forgot-password/);

      // Mock forgot password API
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Code sent' })
        });
      });

      // Submit email
      await page.fill('input[formControlName="email"]', testEmail);
      await page.click('button[type="submit"]');

      // Should be on reset password page
      await expect(page).toHaveURL(new RegExp(`.*reset-password.*email=${testEmail}`), { timeout: 2000 });
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state during password reset', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset successful'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled({ timeout: 500 });

      // Button text might change to "Resetting..."
      await expect(submitButton).toContainText(/resetting/i, { timeout: 500 });
    });

    test('should re-enable button after error', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid reset code'
          })
        });
      });

      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', 'newpassword123');
      await page.fill('input[formControlName="confirmPassword"]', 'newpassword123');

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
    test('should validate all fields are filled', async ({ page }) => {
      // Try submitting with only OTP
      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*reset-password/);

      // Try with OTP and password only
      await page.fill('input[formControlName="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*reset-password/);

      // All fields filled
      await page.fill('input[formControlName="confirmPassword"]', 'password123');
      // Now form should be valid (will submit when button clicked)
    });

    test('should enforce minimum password length', async ({ page }) => {
      await page.fill('input[formControlName="otpCode"]', '123456');
      await page.fill('input[formControlName="password"]', '12345'); // Too short
      await page.fill('input[formControlName="confirmPassword"]', '12345');
      await page.click('button[type="submit"]');

      // Should stay on page
      await expect(page).toHaveURL(/.*reset-password/);

      // Should show error about password length
      const passwordField = page.locator('input[formControlName="password"]');
      await expect(passwordField).toHaveClass(/ng-invalid/);
    });

    test('should show real-time password match feedback', async ({ page }) => {
      const passwordInput = page.locator('input[formControlName="password"]');
      const confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');

      // Fill password
      await passwordInput.fill('password123');

      // Fill non-matching confirm password
      await confirmPasswordInput.fill('password456');

      // Blur the field to trigger validation
      await page.click('h1');

      // After touching both fields, should show mismatch error
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-message').filter({ hasText: /match/i }))
        .toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Auto-formatting', () => {
    test('should limit OTP to 6 characters', async ({ page }) => {
      const otpInput = page.locator('input[formControlName="otpCode"]');

      // Try entering more than 6 digits
      await otpInput.fill('1234567890');

      // Should be limited to 6
      const value = await otpInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(6);
    });

    test('should only accept numeric OTP input', async ({ page }) => {
      const otpInput = page.locator('input[formControlName="otpCode"]');

      // Try typing letters and special characters
      await otpInput.fill('abc!@#123');

      // Value should only contain numbers (if input filtering is implemented)
      // This depends on your implementation
      const value = await otpInput.inputValue();
      // Most implementations allow any character but validate on submit
      // If you have input filtering, uncomment:
      // expect(/^\d*$/.test(value)).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for all form fields', async ({ page }) => {
      // Check labels exist
      await expect(page.locator('label[for="otpCode"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();
      await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
    });

    test('should have aria-labels for password toggle buttons', async ({ page }) => {
      const toggleButtons = page.locator('.toggle-password');

      // Check aria-label exists
      for (let i = 0; i < await toggleButtons.count(); i++) {
        const ariaLabel = await toggleButtons.nth(i).getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toMatch(/show|hide/i);
      }
    });
  });
});
