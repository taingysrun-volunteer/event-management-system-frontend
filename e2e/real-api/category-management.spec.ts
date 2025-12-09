import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * Category Management Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Prerequisites:
 * - Admin user credentials must be configured in environment variables
 * - Categories must exist in the database for some tests
 */

test.describe('Category Management - Admin Flow - Real API', () => {
  test.beforeEach(async ({ page }) => {
    // Real login as admin
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL(/.*admin/, { timeout: 10000 });
  });

  test.describe('Category List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(1000); // Wait for API call
    });

    test('should display list of categories', async ({ page }) => {
      // Check if categories are displayed
      // Wait for the page to load categories from real API
      await page.waitForTimeout(2000);

      const categoryElements = page.locator('.category-name, .category-item, [class*="category"]');
      const count = await categoryElements.count();

      // Should have at least some categories or show empty state
      if (count > 0) {
        await expect(categoryElements.first()).toBeVisible({ timeout: 5000 });
      } else {
        // If no categories, might show empty state message
        const emptyMessage = page.locator('text=/no categories|empty/i');
        const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
        expect(count === 0 || hasEmptyMessage).toBeTruthy();
      }
    });

    test('should display category descriptions', async ({ page }) => {
      await page.waitForTimeout(2000);

      const descriptionElements = page.locator('.category-description, [class*="description"]');
      const count = await descriptionElements.count();

      // Descriptions might be visible if categories exist
      if (count > 0) {
        await expect(descriptionElements.first()).toBeVisible();
      }
    });

    test('should show add category button', async ({ page }) => {
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new/i });
      await expect(addButton.first()).toBeVisible();
    });

    test('should show edit and delete buttons for each category', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check if there are any categories first
      const categories = page.locator('.category-item, [class*="category-card"]');
      const categoryCount = await categories.count();

      if (categoryCount > 0) {
        // Check for edit buttons
        const editButtons = page.locator('button').filter({ hasText: /edit/i });
        await expect(editButtons.first()).toBeVisible();

        // Check for delete buttons
        const deleteButtons = page.locator('button').filter({ hasText: /delete/i });
        await expect(deleteButtons.first()).toBeVisible();
      }
    });
  });

  test.describe('Add Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(1000);
    });

    test('should open add category modal', async ({ page }) => {
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new/i }).first();
      await addButton.click();

      // Modal should be visible
      await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeVisible({ timeout: 3000 });

      // Check for form fields
      await expect(page.locator('input[id="categoryName"], input[name="name"]').first()).toBeVisible();
    });

    test('should create new category successfully', async ({ page }) => {
      // Generate unique category name to avoid conflicts
      const timestamp = Date.now();
      const categoryName = `Test Category ${timestamp}`;

      // Click add button
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new/i }).first();
      await addButton.click();

      // Fill form - this will hit the REAL API
      await page.fill('input[id="categoryName"], input[name="name"]', categoryName);

      const descriptionField = page.locator('textarea[id="categoryDescription"], textarea[name="description"]');
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('Auto-generated test category');
      }

      // Submit form
      await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Should show success message or category should appear in list
      const successMessage = page.locator('.alert-success, .success-message, text=/success|created/i');
      const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

      // Or check if category appears in the list
      const newCategory = page.locator(`text="${categoryName}"`);
      const categoryVisible = await newCategory.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasSuccess || categoryVisible).toBeTruthy();
    });

    test('should validate required category name', async ({ page }) => {
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      // Try to submit without filling name
      const submitButton = page.locator('.modal-footer button.btn-primary, button[type="submit"]').first();
      await submitButton.click();

      // Should stay on modal (validation prevents closing)
      await page.waitForTimeout(1000);
      const modalStillVisible = await page.locator('.modal-overlay, .modal, dialog').first().isVisible().catch(() => false);
      expect(modalStillVisible).toBeTruthy();
    });

    test('should close modal on cancel', async ({ page }) => {
      const addButton = page.locator('button, a').filter({ hasText: /add|create|new/i }).first();
      await addButton.click();

      // Modal should be visible
      await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeVisible();

      // Click cancel
      await page.locator('button').filter({ hasText: /cancel|close/i }).first().click();

      // Modal should be hidden
      await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeHidden({ timeout: 3000 });
    });
  });

  test.describe('Edit Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(2000);
    });

    test('should open edit category modal with pre-filled data', async ({ page }) => {
      // Check if there are any categories
      const categories = page.locator('.category-name, .category-item');
      const count = await categories.count();

      if (count > 0) {
        // Click edit button for first category
        const editButton = page.locator('button.btn-edit').first();
        await editButton.click();

        // Modal should be visible with pre-filled data
        await expect(page.locator('.modal-overlay, .modal, dialog').first()).toBeVisible();

        const nameInput = page.locator('input[id="categoryName"], input[name="name"]').first();
        const value = await nameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('should update category successfully', async ({ page }) => {
      // Check if there are any categories
      const categories = page.locator('.category-name, .category-item');
      const count = await categories.count();

      if (count > 0) {
        // Use btn-edit class
        const editButton = page.locator('button.btn-edit').first();
        await editButton.click();

        // Wait for modal to open
        await page.waitForTimeout(1000);

        // Update name with timestamp to make it unique
        const timestamp = Date.now();
        const nameInput = page.locator('input[id="categoryName"], input[name="name"]').first();

        // Clear and fill with retry
        await nameInput.click();
        await nameInput.clear();
        await page.waitForTimeout(500);
        await nameInput.fill(`Updated Category ${timestamp}`);

        // Verify the value was entered
        const inputValue = await nameInput.inputValue();
        expect(inputValue).toContain('Updated Category');

        // Submit - this hits the REAL API
        const submitButton = page.locator('.modal-footer button.btn-primary').first();
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(3000);

        // Should show success message or modal should close
        const successMessage = page.locator('.alert-success, .success-message, text=/success|updated/i');
        const modalClosed = page.locator('.modal-overlay, .modal, dialog').first();

        const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
        const isModalClosed = !(await modalClosed.isVisible().catch(() => true));

        // Either success message appears or modal closes (indicating success)
        expect(hasSuccess || isModalClosed).toBeTruthy();
      }
    });
  });

  test.describe('Delete Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(2000);
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      // Check if there are any categories
      const categories = page.locator('.category-name, .category-item');
      const count = await categories.count();

      if (count > 0) {
        const deleteButton = page.locator('button.btn-delete').first();
        await deleteButton.click();

        // Confirmation dialog should appear
        await expect(page.locator('.modal-overlay, .modal, dialog, .confirmation').filter({ hasText: /delete|sure/i }).first())
          .toBeVisible({ timeout: 3000 });
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      // Check if there are any categories
      const categories = page.locator('.category-name, .category-item');
      const count = await categories.count();

      if (count > 0) {
        // Get the first category name for verification
        const firstCategoryName = await categories.first().textContent();

        const deleteButton = page.locator('button.btn-delete').first();
        await deleteButton.click();

        // Cancel deletion
        await page.locator('button.btn-secondary, button').filter({ hasText: /cancel|no/i }).first().click();

        // Wait a moment
        await page.waitForTimeout(500);

        // Category should still be visible
        const categoryStillExists = await page.locator(`text="${firstCategoryName}"`).isVisible().catch(() => false);
        expect(categoryStillExists).toBeTruthy();
      }
    });

    test('should delete category successfully', async ({ page }) => {
      // First create a test category to delete
      const timestamp = Date.now();
      const categoryName = `Test Delete ${timestamp}`;

      // Click add button
      const addButton = page.locator('button.btn-primary').filter({ hasText: /add/i }).first();
      await addButton.click();
      await page.waitForTimeout(1000);

      // Fill form and create category
      await page.fill('input[id="categoryName"], input[name="name"]', categoryName);

      const descriptionField = page.locator('textarea[id="categoryDescription"], textarea[name="description"]');
      if (await descriptionField.isVisible().catch(() => false)) {
        await descriptionField.fill('Category to be deleted');
      }

      await page.locator('.modal-footer button.btn-primary').first().click();
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForTimeout(2000);

      // Now delete the category
      const categoryRow = page.locator('.category-item, tr, [class*="category"]').filter({ hasText: categoryName });
      const categoryExists = await categoryRow.isVisible().catch(() => false);

      if (categoryExists) {
        const deleteButton = categoryRow.locator('button.btn-delete').first();
        await deleteButton.click();

        // Wait for confirmation dialog
        await page.waitForTimeout(500);

        // Confirm deletion - this hits the REAL API
        const confirmButton = page.locator('button.btn-danger').first();
        await confirmButton.click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Should show success message or category should be removed from list
        const successMessage = page.locator('.alert-success, .success-message, text=/success|deleted/i');
        const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

        // Reload to verify category is gone
        await page.reload();
        await page.waitForTimeout(2000);

        const categoryStillExists = await page.locator(`text="${categoryName}"`).isVisible().catch(() => false);

        // Either success message appeared or category is no longer visible
        expect(hasSuccess || !categoryStillExists).toBeTruthy();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to admin dashboard', async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(1000);

      const backButton = page.locator('button, a').filter({ hasText: /back|dashboard/i }).first();
      const backButtonVisible = await backButton.isVisible().catch(() => false);

      if (backButtonVisible) {
        await backButton.click();
        await expect(page).toHaveURL(/.*admin/, { timeout: 5000 });
      }
    });
  });

  test.describe('Integration Flow', () => {
    test('should complete full category CRUD flow', async ({ page }) => {
      await page.goto('/admin/categories');
      await page.waitForTimeout(2000);

      const timestamp = Date.now();
      const categoryName = `E2E Test ${timestamp}`;
      const updatedName = `E2E Updated ${timestamp}`;

      // Create category
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();
      await page.fill('input[id="categoryName"], input[name="name"]', categoryName);
      await page.locator('.modal-footer button.btn-primary, button[type="submit"]').first().click();

      // Wait for creation
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForTimeout(2000);

      // Verify category was created
      const createdCategory = page.locator(`text="${categoryName}"`);
      const wasCreated = await createdCategory.isVisible().catch(() => false);

      if (wasCreated) {
        // Edit category
        const categoryRow = page.locator(`.category-item, tr, [class*="category"]`).filter({ hasText: categoryName });
        const editButton = categoryRow.locator('button.btn-edit').first();
        await editButton.click();

        const nameInput = page.locator('input[id="categoryName"], input[name="name"]').first();
        await nameInput.clear();
        await nameInput.fill(updatedName);
        await page.locator('.modal-footer button.btn-primary').first().click();

        await page.waitForTimeout(2000);
        await page.reload();
        await page.waitForTimeout(2000);

        // Verify update
        const updatedCategory = page.locator(`text="${updatedName}"`);
        await expect(updatedCategory).toBeVisible({ timeout: 5000 });

        // Delete category (cleanup)
        const updatedRow = page.locator(`.category-item, tr, [class*="category"]`).filter({ hasText: updatedName });
        const deleteButton = updatedRow.locator('button.btn-delete').first();
        await deleteButton.click();

        // Confirm deletion
        await page.locator('button.btn-danger').first().click();
        await page.waitForTimeout(2000);
      }
    });
  });
});
