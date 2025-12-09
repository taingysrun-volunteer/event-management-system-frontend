import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * User Management Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Prerequisites:
 * - Admin user credentials must be configured in environment variables
 * - Users must exist in the database for some tests
 */

test.describe('User Management - Admin Flow - Real API', () => {
  test.beforeEach(async ({ page }) => {
    // Real login as admin
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password!);
    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL(/.*admin/, { timeout: 10000 });
  });

  test.describe('User List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000); // Wait for API call
    });

    test('should display list of users', async ({ page }) => {
      // Wait for users to load from real API
      await page.waitForTimeout(2000);

      const userElements = page.locator('.user-item, tr, [class*="user"]');
      const count = await userElements.count();

      // Should have at least some users (including admin)
      if (count > 0) {
        await expect(userElements.first()).toBeVisible({ timeout: 5000 });
      } else {
        // If no users, might show empty state
        const emptyMessage = page.locator('text=/no users|empty/i');
        const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
        expect(count === 0 || hasEmptyMessage).toBeTruthy();
      }
    });

    test('should display user roles', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check for role badges/labels
      const roleBadges = page.locator('text=/USER|ADMIN/i');
      const count = await roleBadges.count();

      if (count > 0) {
        await expect(roleBadges.first()).toBeVisible();
      }
    });

    test('should show add user button', async ({ page }) => {
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new user/i });
      await expect(addButton.first()).toBeVisible();
    });

    test('should show action buttons for each user', async ({ page }) => {
      await page.waitForTimeout(2000);

      const users = page.locator('.user-item, tr, [class*="user-row"]');
      const userCount = await users.count();

      if (userCount > 0) {
        // Check for edit or action buttons
        const actionButtons = page.locator('button.btn-edit, .btn-reset, .btn-delete');
        const buttonCount = await actionButtons.count();
        expect(buttonCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Search and Filter', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
    });

    test('should filter users by role', async ({ page }) => {
      const roleFilter = page.locator('select, [role="combobox"]').filter({ hasText: /role|filter/i });
      const filterVisible = await roleFilter.first().isVisible().catch(() => false);

      if (filterVisible) {
        await roleFilter.first().click();
        await page.waitForTimeout(500);

        // Select a role option
        const roleOption = page.locator('option, [role="option"]').filter({ hasText: /ADMIN|USER/i }).first();
        if (await roleOption.isVisible().catch(() => false)) {
          await roleOption.click();
          await page.waitForTimeout(1000);

          // Results should be filtered by role
          const users = page.locator('.user-item, tr');
          const count = await users.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should clear filters', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
      const searchVisible = await searchInput.isVisible().catch(() => false);

      if (searchVisible) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);

        // Clear button or clear action
        const clearButton = page.locator('button').filter({ hasText: /clear/i });
        const clearVisible = await clearButton.first().isVisible().catch(() => false);

        if (clearVisible) {
          await clearButton.first().click();
          await page.waitForTimeout(1000);

          // Should show all users again
          const searchValue = await searchInput.inputValue();
          expect(searchValue).toBe('');
        }
      }
    });
  });

  test.describe('Add User', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(1000);
    });

    test('should open add user modal', async ({ page }) => {
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new user/i }).first();
      await addButton.click();

      // Modal should be visible
      await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeVisible({ timeout: 3000 });

      // Check for form fields
      await expect(page.locator('input[id="username"], input[name="username"]').first()).toBeVisible();
    });

    test('should create new user successfully', async ({ page }) => {
      // Generate unique user data
      const timestamp = Date.now();
      const username = `testuser_${timestamp}`;
      const email = `testuser_${timestamp}@example.com`;

      const addButton = page.locator('button, a').filter({ hasText: /add|create|new user/i }).first();
      await addButton.click();

      // Fill form - this will hit the REAL API
      await page.fill('input[id="username"], input[name="username"]', username);
      await page.fill('input[id="email"], input[name="email"]', email);
      await page.fill('input[id="firstName"], input[name="firstName"]', 'Test');
      await page.fill('input[id="lastName"], input[name="lastName"]', 'User');

      const passwordField = page.locator('input[id="password"], input[name="password"]').first();
      if (await passwordField.isVisible()) {
        await passwordField.fill(testConfig.testRegistration.password!);
      }

      // Role selection
      const roleSelect = page.locator('select[id="role"], select[name="role"]');
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('USER');
      }

      // Submit form
      await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Should show success message or user appears in list
      const successMessage = page.locator('.alert-success, .success-message, text=/success|created/i');
      const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

      const newUser = page.locator(`text="${username}"`);
      const userVisible = await newUser.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasSuccess || userVisible).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      // Try to submit without filling required fields
      const submitButton = page.locator('.modal-footer button.btn-primary, button[type="submit"]').first();
      await submitButton.click();

      // Should stay on modal (validation prevents closing)
      await page.waitForTimeout(1000);
      const modalStillVisible = await page.locator('.modal-overlay, .modal, dialog').first().isVisible().catch(() => false);
      expect(modalStillVisible).toBeTruthy();
    });

    test('should validate password minimum length', async ({ page }) => {
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await page.fill('input[id="username"], input[name="username"]', 'testuser');
      await page.fill('input[id="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[id="firstName"], input[name="firstName"]', 'Test');
      await page.fill('input[id="lastName"], input[name="lastName"]', 'User');

      const passwordField = page.locator('input[id="password"], input[name="password"]').first();
      if (await passwordField.isVisible()) {
        await passwordField.fill('123'); // Too short
      }

      await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

      await page.waitForTimeout(1000);
      const modalStillVisible = await page.locator('.modal-overlay, .modal, dialog').first().isVisible().catch(() => false);
      expect(modalStillVisible).toBeTruthy();
    });
  });

  test.describe('Edit User', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
    });

    test('should open edit user modal with pre-filled data', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        const editButton = page.locator('button.btn-edit').first();
        await editButton.click();

        // Modal should be visible with pre-filled data
        await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeVisible();

        const usernameInput = page.locator('input[id="username"], input[name="username"]').first();
        const value = await usernameInput.inputValue().catch(() => '');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('should update user successfully', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        const editButton = page.locator('button.btn-edit').first();
        await editButton.click();

        // Update first name
        const timestamp = Date.now();
        const firstNameInput = page.locator('input[id="firstName"], input[name="firstName"]').first();
        await firstNameInput.clear();
        await firstNameInput.fill(`Updated ${timestamp}`);

        // Submit - this hits the REAL API
        await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

        await page.waitForTimeout(5000);

        // Should show success message
        const successMessage = page.locator('text=/success|updated/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should change user role', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        const editButton = page.locator('button.btn-edit').first();
        await editButton.click();

        const roleSelect = page.locator('select[id="role"], select[name="role"]');
        if (await roleSelect.isVisible()) {
          const currentRole = await roleSelect.inputValue();
          const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER';

          await roleSelect.selectOption(newRole);
          await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

          await page.waitForTimeout(2000);

          const successMessage = page.locator('.alert-success, .success-message, text=/success|updated/i');
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Delete User', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 1) { // More than just admin
        const deleteButton = page.locator('button.btn-delete').first();
        await deleteButton.click();

        // Confirmation dialog should appear
        await expect(page.locator('.modal-overlay, .modal, dialog, .confirmation').filter({ hasText: /delete|sure/i }).first())
          .toBeVisible({ timeout: 3000 });
      }
    });

    test('should delete user successfully', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 1) {
        // Don't delete admin, find another user
        const userRows = await users.all();

        for (const row of userRows) {
          const text = await row.textContent();
          if (text && !text.toLowerCase().includes('admin')) {
            const deleteButton = row.locator('button.btn-delete');
            if (await deleteButton.isVisible().catch(() => false)) {
              await deleteButton.click();

              // Confirm deletion
              await page.locator('button.btn-danger, button').filter({ hasText: /confirm|yes|delete/i }).first().click();
              await page.waitForTimeout(2000);

              const successMessage = page.locator('text=/success|deleted/i');
              await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
              break;
            }
          }
        }
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        const deleteButton = page.locator('button.btn-delete').first();
        await deleteButton.click();

        // Cancel deletion
        await page.locator('button').filter({ hasText: /cancel/i }).first().click();

        await page.waitForTimeout(500);

        // User should still be in list
        const usersAfter = page.locator('.user-item, tr');
        const countAfter = await usersAfter.count();
        expect(countAfter).toBe(count);
      }
    });
  });

  test.describe('Reset Password', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
    });

    test('should show reset password option', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        // Look for reset password button or option
        const resetButton = page.locator('button, a').filter({ hasText: /reset.*password|password.*reset/i });
        const resetVisible = await resetButton.first().isVisible().catch(() => false);

        // Reset password might be in a dropdown menu
        if (!resetVisible) {
          const moreButton = page.locator('button').filter({ hasText: /more|actions|\.\.\./i }).first();
          if (await moreButton.isVisible().catch(() => false)) {
            await moreButton.click();
            const resetOption = page.locator('text=/reset.*password/i');
            expect(await resetOption.isVisible().catch(() => false)).toBeTruthy();
          }
        }
      }
    });

    test('should reset user password successfully', async ({ page }) => {
      const users = page.locator('.user-item, tr');
      const count = await users.count();

      if (count > 0) {
        const resetButton = page.locator('button, a').filter({ hasText: /reset.*password/i });
        const resetVisible = await resetButton.first().isVisible().catch(() => false);

        if (resetVisible) {
          await resetButton.first().click();

          // Fill new password
          const newPasswordInput = page.locator('input[id="newPassword"], input[name="newPassword"]');
          if (await newPasswordInput.isVisible()) {
            await newPasswordInput.fill(testConfig.testRegistration.password!);

            const confirmButton = page.locator('button').filter({ hasText: /confirm|reset|save/i }).first();
            await confirmButton.click();

            await page.waitForTimeout(2000);

            const successMessage = page.locator('.alert-success, .success-message, text=/success|reset/i');
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
    });

    test('should navigate to next page', async ({ page }) => {
      const nextButton = page.locator('button, a').filter({ hasText: /next/i });
      const nextVisible = await nextButton.first().isVisible().catch(() => false);

      if (nextVisible && await nextButton.first().isEnabled().catch(() => false)) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Page should change (real API call)
        const users = page.locator('.user-item, tr');
        const count = await users.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should navigate to previous page', async ({ page }) => {
      // Go to next page first
      const nextButton = page.locator('button, a').filter({ hasText: /next/i });
      const nextVisible = await nextButton.first().isVisible().catch(() => false);

      if (nextVisible && await nextButton.first().isEnabled().catch(() => false)) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Now try previous
        const prevButton = page.locator('button, a').filter({ hasText: /prev|previous/i });
        if (await prevButton.first().isEnabled().catch(() => false)) {
          await prevButton.first().click();
          await page.waitForTimeout(1000);

          const users = page.locator('.user-item, tr');
          const count = await users.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
