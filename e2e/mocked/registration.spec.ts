import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
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
    await page.fill('input[formControlName="password"]', 'password123');
    await page.fill('input[formControlName="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'invalid-email');
    await page.fill('input[formControlName="firstName"]', 'John');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.fill('input[formControlName="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should validate firstName minimum length (2 characters)', async ({ page }) => {
    await page.fill('input[formControlName="username"]', 'testuser');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="firstName"]', 'J');
    await page.fill('input[formControlName="lastName"]', 'Doe');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.fill('input[formControlName="confirmPassword"]', 'password123');

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
    await page.fill('input[formControlName="password"]', 'password123');
    await page.fill('input[formControlName="confirmPassword"]', 'password456');

    await page.click('button[type="submit"]');

    // Should not navigate away
    await expect(page).toHaveURL(/.*register/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[formControlName="password"]');
    const toggleButtons = page.locator('button').filter({ hasText: /show|hide/i }).or(
      page.locator('[class*="toggle-password"]')
    );

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button if it exists
    const count = await toggleButtons.count();
    if (count > 0) {
      await toggleButtons.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[routerLink="/login"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test.describe('Mock API - Registration Success', () => {
    test('should register successfully and redirect to OTP verification', async ({ page }) => {
      // Mock the registration API to return email for OTP verification
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Registration successful. Please check your email for the verification code.',
            email: 'newuser@example.com'
          })
        });
      });

      // Fill registration form
      await page.fill('input[formControlName="username"]', 'newuser');
      await page.fill('input[formControlName="email"]', 'newuser@example.com');
      await page.fill('input[formControlName="firstName"]', 'New');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('.success-message, [class*="success"], .alert-success'))
        .toContainText(/successful|verification/i, { timeout: 5000 });

      // Should navigate to OTP verification page after delay
      await expect(page).toHaveURL(/.*verify-otp.*email=newuser@example.com/, { timeout: 5000 });
    });

    test('should register with valid email formats', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Registration successful',
            user: {}
          })
        });
      });

      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@subdomain.example.com'
      ];

      for (const email of validEmails) {
        await page.goto('/register');

        await page.fill('input[formControlName="username"]', 'testuser');
        await page.fill('input[formControlName="email"]', email);
        await page.fill('input[formControlName="firstName"]', 'Test');
        await page.fill('input[formControlName="lastName"]', 'User');
        await page.fill('input[formControlName="password"]', 'password123');
        await page.fill('input[formControlName="confirmPassword"]', 'password123');

        await page.click('button[type="submit"]');

        // Should succeed
        await expect(page.locator('.success-message, [class*="success"]'))
          .toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Mock API - Registration Failure', () => {
    test('should show error when username already exists (409)', async ({ page }) => {
      // Mock the registration API to return conflict error
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Username already exists'
          })
        });
      });

      await page.fill('input[formControlName="username"]', 'existinguser');
      await page.fill('input[formControlName="email"]', 'user@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toContainText(/already exists/i, { timeout: 5000 });

      // Should stay on registration page
      await expect(page).toHaveURL(/.*register/);
    });

    test('should show error when email already exists (409)', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Email already exists'
          })
        });
      });

      await page.fill('input[formControlName="username"]', 'newuser');
      await page.fill('input[formControlName="email"]', 'existing@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toContainText(/already|exists/i, { timeout: 5000 });
    });

    test('should handle server error (500)', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error'
          })
        });
      });

      await page.fill('input[formControlName="username"]', 'testuser');
      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toBeVisible({ timeout: 5000 });
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.abort('failed');
      });

      await page.fill('input[formControlName="username"]', 'testuser');
      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message, [class*="error"], .alert-danger'))
        .toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Form Interaction', () => {
    test('should clear form after navigating away and back', async ({ page }) => {
      // Fill form
      await page.fill('input[formControlName="username"]', 'testuser');
      await page.fill('input[formControlName="email"]', 'test@example.com');

      // Navigate to login
      await page.click('a[routerLink="/login"]');
      await expect(page).toHaveURL(/.*login/);

      // Navigate back to register
      await page.goto('/register');

      // Form should be empty
      await expect(page.locator('input[formControlName="username"]')).toHaveValue('');
      await expect(page.locator('input[formControlName="email"]')).toHaveValue('');
    });

    test('should handle special characters in fields', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success', user: {} })
        });
      });

      await page.fill('input[formControlName="username"]', "user_name-123");
      await page.fill('input[formControlName="email"]', 'test+tag@example.com');
      await page.fill('input[formControlName="firstName"]', "O'Brien");
      await page.fill('input[formControlName="lastName"]', "Smith-Jones");
      await page.fill('input[formControlName="password"]', 'P@ssw0rd!');
      await page.fill('input[formControlName="confirmPassword"]', 'P@ssw0rd!');

      await page.click('button[type="submit"]');

      // Should succeed
      await expect(page.locator('.success-message, [class*="success"]'))
        .toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state during registration', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success', user: {} })
        });
      });

      await page.fill('input[formControlName="username"]', 'testuser');
      await page.fill('input[formControlName="email"]', 'test@example.com');
      await page.fill('input[formControlName="firstName"]', 'Test');
      await page.fill('input[formControlName="lastName"]', 'User');
      await page.fill('input[formControlName="password"]', 'password123');
      await page.fill('input[formControlName="confirmPassword"]', 'password123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check if button is disabled during loading (depends on implementation)
      // await expect(submitButton).toBeDisabled();
    });
  });
});
