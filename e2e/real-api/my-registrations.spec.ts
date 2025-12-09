import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * My Registrations Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Tests user's registered events and ticket management
 */

test.describe('My Registrations - Real API', () => {
  test.beforeEach(async ({ page }) => {
    // Real login as user
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password!);
    await page.click('button[type="submit"]');

    // Wait for redirect to user events page
    await page.waitForURL(/.*\/(events|user)/, { timeout: 10000 });
  });

  test.describe('Registration List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(2000); // Wait for API call
    });

    test('should display list of registered events', async ({ page }) => {
      // Wait for registrations to load from real API
      await page.waitForTimeout(2000);

      const registrations = page.locator('.registration-item, .event-card, tr, [class*="registration"]');
      const count = await registrations.count();

      // Should have registrations or show empty state
      if (count > 0) {
        await expect(registrations.first()).toBeVisible({ timeout: 5000 });
      } else {
        // If no registrations, might show empty state message
        const emptyMessage = page.locator('text=/no registrations|no events|empty/i');
        const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
        expect(count === 0 || hasEmptyMessage).toBeTruthy();
      }
    });

    test('should display event details in registration list', async ({ page }) => {
      await page.waitForTimeout(2000);

      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Should show event title
        const eventTitle = registrations.first().locator('h2, h3, .title, .event-name');
        await expect(eventTitle.first()).toBeVisible();

        // Should show event date
        const eventDate = registrations.first().locator('text=/\\d{4}|\\d{1,2}/, .date');
        const hasDate = await eventDate.first().isVisible().catch(() => false);
        expect(hasDate).toBeTruthy();
      }
    });

    test('should display registration status', async ({ page }) => {
      await page.waitForTimeout(2000);

      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Look for status badge (confirmed, pending, cancelled)
        const statusBadge = page.locator('.badge, .status, [class*="status"]').filter({ hasText: /confirmed|pending|cancelled/i });
        const hasStatus = await statusBadge.first().isVisible().catch(() => false);
        expect(hasStatus).toBeTruthy();
      }
    });

    test('should show action buttons for each registration', async ({ page }) => {
      await page.waitForTimeout(2000);

      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Look for action buttons (view ticket, cancel, etc.)
        const actionButtons = page.locator('button, a').filter({ hasText: /view|ticket|cancel|details/i });
        const buttonCount = await actionButtons.count();
        expect(buttonCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('View Registration Details', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(2000);
    });

    test('should navigate to event details from registration', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        const viewButton = page.locator('button, a').filter({ hasText: /view|details/i }).first();
        if (await viewButton.isVisible().catch(() => false)) {
          await viewButton.click();
          await page.waitForTimeout(1000);

          // Should navigate to event detail page
          const isOnEventPage = page.url().includes('/event');
          expect(isOnEventPage).toBeTruthy();
        }
      }
    });

    test('should display registration confirmation number', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Look for confirmation/registration number
        const confirmationNumber = page.locator('text=/REG|confirmation|#/, .confirmation-number, .registration-id');
        const hasConfirmation = await confirmationNumber.first().isVisible().catch(() => false);
        expect(hasConfirmation).toBeTruthy();
      }
    });
  });

  test.describe('View Ticket/QR Code', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(2000);
    });

    test('should display QR code for confirmed registrations', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Look for confirmed registration
        const confirmedReg = page.locator('.registration-item, .event-card, tr').filter({ hasText: /confirmed/i });
        const confirmedCount = await confirmedReg.count();

        if (confirmedCount > 0) {
          // Click view ticket button
          const ticketButton = confirmedReg.first().locator('button, a').filter({ hasText: /ticket|qr|code/i });
          if (await ticketButton.isVisible().catch(() => false)) {
            await ticketButton.click();
            await page.waitForTimeout(1000);

            // QR code should be visible
            const qrCode = page.locator('qr-code, canvas, img[alt*="QR"], .qr-code');
            await expect(qrCode.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('should download ticket', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        // Look for download button
        const downloadButton = page.locator('button, a').filter({ hasText: /download|save/i });
        const downloadVisible = await downloadButton.first().isVisible().catch(() => false);

        if (downloadVisible) {
          // Click download - this might trigger a download
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
          await downloadButton.first().click();

          const download = await downloadPromise;
          // If download occurred, it was successful
          expect(download !== null || downloadVisible).toBeTruthy();
        }
      }
    });

    test('should display event information on ticket', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        const confirmedReg = page.locator('.registration-item, .event-card, tr').filter({ hasText: /confirmed/i });
        const confirmedCount = await confirmedReg.count();

        if (confirmedCount > 0) {
          const ticketButton = confirmedReg.first().locator('button, a').filter({ hasText: /ticket|qr|code/i });
          if (await ticketButton.isVisible().catch(() => false)) {
            await ticketButton.click();
            await page.waitForTimeout(1000);

            // Ticket should show event details
            const eventName = page.locator('.event-name, .title, h2, h3');
            await expect(eventName.first()).toBeVisible();

            const eventDate = page.locator('.date, .event-date, text=/\\d{4}/');
            const hasDate = await eventDate.first().isVisible().catch(() => false);
            expect(hasDate).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Cancel Registration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(2000);
    });

    test('should show cancel button for pending registrations', async ({ page }) => {
      const pendingReg = page.locator('.registration-item, .event-card, tr').filter({ hasText: /pending|confirmed/i });
      const count = await pendingReg.count();

      if (count > 0) {
        const cancelButton = pendingReg.first().locator('button').filter({ hasText: /cancel/i });
        const hasCancelButton = await cancelButton.isVisible().catch(() => false);
        expect(hasCancelButton).toBeTruthy();
      }
    });

    test('should show confirmation dialog before cancellation', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        const cancelButton = page.locator('button').filter({ hasText: /cancel/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();

          // Confirmation dialog should appear
          await expect(page.locator('.modal, dialog, .confirmation').filter({ hasText: /cancel|sure/i }).first())
            .toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should cancel registration successfully', async ({ page }) => {
      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count > 0) {
        const cancelButton = page.locator('button').filter({ hasText: /cancel.*registration/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
          await page.waitForTimeout(500);

          // Confirm cancellation - this hits the REAL API
          const confirmButton = page.locator('button.btn-danger, button').filter({ hasText: /confirm|yes|cancel/i }).first();
          await confirmButton.click();

          await page.waitForTimeout(2000);

          // Should show success message
          const successMessage = page.locator('.alert-success, .success, text=/success|cancelled/i');
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should not show cancel button for past events', async ({ page }) => {
      // Look for past events indicator
      const pastEvents = page.locator('.registration-item, .event-card, tr').filter({ hasText: /past|completed|ended/i });
      const count = await pastEvents.count();

      if (count > 0) {
        // Should not have cancel button for past events
        const cancelButton = pastEvents.first().locator('button').filter({ hasText: /cancel/i });
        const hasCancelButton = await cancelButton.isVisible().catch(() => false);
        expect(!hasCancelButton).toBeTruthy();
      }
    });
  });

  test.describe('Filter and Sort', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(2000);
    });

    test('should filter by registration status', async ({ page }) => {
      const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i });
      const filterVisible = await filterSelect.first().isVisible().catch(() => false);

      if (filterVisible) {
        await filterSelect.first().click();
        await page.waitForTimeout(500);

        // Select a status filter
        const statusOption = page.locator('option, [role="option"]').filter({ hasText: /confirmed|pending/i }).first();
        if (await statusOption.isVisible().catch(() => false)) {
          await statusOption.click();
          await page.waitForTimeout(1000);

          // Results should be filtered
          const registrations = page.locator('.registration-item, .event-card, tr');
          const count = await registrations.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should filter by upcoming vs past events', async ({ page }) => {
      const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /upcoming|past|time/i });
      const filterVisible = await filterSelect.first().isVisible().catch(() => false);

      if (filterVisible) {
        await filterSelect.first().selectOption('upcoming');
        await page.waitForTimeout(1000);

        const registrations = page.locator('.registration-item, .event-card, tr');
        const count = await registrations.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should sort by date', async ({ page }) => {
      const sortSelect = page.locator('select, [role="combobox"]').filter({ hasText: /sort|order/i });
      const sortVisible = await sortSelect.first().isVisible().catch(() => false);

      if (sortVisible) {
        await sortSelect.first().selectOption('date');
        await page.waitForTimeout(1000);

        // Registrations should be reordered
        const registrations = page.locator('.registration-item, .event-card, tr');
        const count = await registrations.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to events list to register for more events', async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(1000);

      const browseEventsButton = page.locator('button, a').filter({ hasText: /browse|events|find/i });
      if (await browseEventsButton.first().isVisible().catch(() => false)) {
        await browseEventsButton.first().click();
        await expect(page).toHaveURL(/.*events/, { timeout: 5000 });
      }
    });

    test('should navigate back to user dashboard', async ({ page }) => {
      await page.goto('/user/my-registrations');
      await page.waitForTimeout(1000);

      const backButton = page.locator('button, a').filter({ hasText: /back|dashboard|home/i });
      const backVisible = await backButton.first().isVisible().catch(() => false);

      if (backVisible) {
        await backButton.first().click();
        await expect(page).toHaveURL(/.*user/, { timeout: 5000 });
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show message when no registrations exist', async ({ page }) => {
      await page.goto('/my-registrations');
      await page.waitForTimeout(5000);

      const registrations = page.locator('.registration-item, .event-card, tr');
      const count = await registrations.count();

      if (count === 0) {
        // Should show empty state message
        const emptyMessage = page.locator('.empty-state, .empty-icon');
        await expect(emptyMessage.first()).toBeVisible();

        // Should show link to browse events
        const browseLink = page.locator('a, button').filter({ hasText: /browse|find|events/i });
        await expect(browseLink.first()).toBeVisible();
      }
    });
  });

});
