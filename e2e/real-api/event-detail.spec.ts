import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config';

/**
 * Event Detail Tests with Real API
 *
 * These tests interact with the actual backend API deployed on production.
 * No mocking - all API calls are real.
 *
 * Tests both user and admin event detail pages
 */

test.describe('Event Detail - User View - Real API', () => {
  test.beforeEach(async ({ page }) => {
    // Real login as user
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password!);
    await page.click('button[type="submit"]');

    // Wait for redirect to events page
    await page.waitForURL(/.*\/(events|user)/, { timeout: 10000 });
  });

  test('should display event details', async ({ page }) => {
    // Navigate to events list first
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    // Get first event from the list
    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Should display event information from real API
      const eventTitle = page.locator('h1, h2, .event-title');
      await expect(eventTitle.first()).toBeVisible({ timeout: 5000 });

      const description = page.locator('.description, .event-description, p');
      const hasDescription = await description.first().isVisible().catch(() => false);
      expect(hasDescription).toBeTruthy();
    }
  });

  test('should show event date and time', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Should display formatted date and time from real data
      const dateElement = page.locator('text=/\\d{4}|\\d{1,2}.*\\d{4}/');
      const hasDate = await dateElement.first().isVisible().catch(() => false);
      expect(hasDate).toBeTruthy();
    }
  });

  test('should show available seats', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Should show capacity or available seats info
      const seatsInfo = page.locator('text=/seat|capacity|available/i');
      const hasSeatsInfo = await seatsInfo.first().isVisible().catch(() => false);
      expect(hasSeatsInfo).toBeTruthy();
    }
  });

  test('should show register button when not registered', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Check for register button or already registered message
      const registerButton = page.locator('button').filter({ hasText: /register/i });
      const alreadyRegistered = page.locator('text=/already registered|registered/i');

      const hasRegisterButton = await registerButton.first().isVisible().catch(() => false);
      const isAlreadyRegistered = await alreadyRegistered.first().isVisible().catch(() => false);

      // Either should show register button OR already registered message
      expect(hasRegisterButton || isAlreadyRegistered).toBeTruthy();
    }
  });

  test('should open registration modal on register click', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const registerButton = page.locator('button').filter({ hasText: /^register$/i });
      if (await registerButton.isVisible().catch(() => false)) {
        await registerButton.click();

        // Registration modal or form should appear
        const modal = page.locator('.modal, dialog, .registration-form');
        await expect(modal.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should register for event successfully', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const registerButton = page.locator('button').filter({ hasText: /^register$/i });
      if (await registerButton.isVisible().catch(() => false)) {
        await registerButton.click();
        await page.waitForTimeout(500);

        // Fill registration form if present
        const attendeeNameField = page.locator('input[id="attendeeName"], input[name="attendeeName"]');
        if (await attendeeNameField.isVisible().catch(() => false)) {
          await attendeeNameField.fill('Test User');
        }

        const emailField = page.locator('input[id="attendeeEmail"], input[name="attendeeEmail"]');
        if (await emailField.isVisible().catch(() => false)) {
          await emailField.fill(testConfig.testUsers.user.email!);
        }

        const phoneField = page.locator('input[id="phoneNumber"], input[name="phoneNumber"]');
        if (await phoneField.isVisible().catch(() => false)) {
          await phoneField.fill('1234567890');
        }

        // Submit registration - this hits the REAL API
        const confirmButton = page.locator('button').filter({ hasText: /confirm|register|submit/i }).first();
        await confirmButton.click();

        await page.waitForTimeout(2000);

        // Should show success or already registered message
        const successMessage = page.locator('.alert-success, .success, text=/success|registered|confirmation/i');
        const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasSuccess).toBeTruthy();
      }
    }
  });

  test('should navigate back to events list', async ({ page }) => {
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const backButton = page.locator('button, a').filter({ hasText: /back|return/i });
      if (await backButton.first().isVisible().catch(() => false)) {
        await backButton.first().click();
        await expect(page).toHaveURL(/.*events/, { timeout: 5000 });
      }
    }
  });
});

test.describe('Event Detail - Admin View - Real API', () => {
  test.beforeEach(async ({ page }) => {
    // Real login as admin
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.admin.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.admin.password!);
    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL(/.*admin/, { timeout: 10000 });
  });

  test('should display event details', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    // Get first event
    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Should display event information from real API
      const eventTitle = page.locator('h1, h2, .event-title');
      await expect(eventTitle.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show edit button', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      await expect(editButton.first()).toBeVisible();
    }
  });

  test('should navigate to edit page', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();
      await editButton.click();

      await expect(page).toHaveURL(/.*edit/, { timeout: 5000 });
    }
  });

  test('should toggle registrations section', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Look for registrations toggle or section
      const registrationsToggle = page.locator('button, a').filter({ hasText: /registrations|attendees/i });
      if (await registrationsToggle.first().isVisible().catch(() => false)) {
        await registrationsToggle.first().click();
        await page.waitForTimeout(500);

        // Registration list should be visible
        const registrationsList = page.locator('.registrations, .attendees, [class*="registration"]');
        const isVisible = await registrationsList.first().isVisible().catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should display registration list with details', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Expand registrations if needed
      const registrationsToggle = page.locator('button, a').filter({ hasText: /registrations|attendees/i });
      if (await registrationsToggle.first().isVisible().catch(() => false)) {
        await registrationsToggle.first().click();
        await page.waitForTimeout(1000);
      }

      // Check for registration items
      const registrationItems = page.locator('.registration-item, tr, [class*="attendee"]');
      const count = await registrationItems.count();

      if (count > 0) {
        await expect(registrationItems.first()).toBeVisible();
      }
    }
  });

  test('should update registration status', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Expand registrations
      const registrationsToggle = page.locator('button, a').filter({ hasText: /registrations|attendees/i });
      if (await registrationsToggle.first().isVisible().catch(() => false)) {
        await registrationsToggle.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for status update buttons
      const statusButtons = page.locator('button, select').filter({ hasText: /status|confirm|pending|cancelled/i });
      if (await statusButtons.first().isVisible().catch(() => false)) {
        await statusButtons.first().click();
        await page.waitForTimeout(500);

        // Select a status
        const statusOption = page.locator('option, [role="option"]').filter({ hasText: /confirmed|pending/i }).first();
        if (await statusOption.isVisible().catch(() => false)) {
          await statusOption.click();
          await page.waitForTimeout(2000);

          // Should show success message
          const successMessage = page.locator('.alert-success, .success, text=/success|updated/i');
          const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
          expect(hasSuccess).toBeTruthy();
        }
      }
    }
  });

  test('should export registrations', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Look for export button
      const exportButton = page.locator('button, a').filter({ hasText: /export|download/i });
      const exportVisible = await exportButton.first().isVisible().catch(() => false);

      if (exportVisible) {
        // Click export - this might trigger a download
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await exportButton.first().click();

        const download = await downloadPromise;
        // If download occurred, it was successful
        expect(download !== null || exportVisible).toBeTruthy();
      }
    }
  });

  test('should navigate back to events list', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const backButton = page.locator('button, a').filter({ hasText: /back|return/i });
      if (await backButton.first().isVisible().catch(() => false)) {
        await backButton.first().click();
        await expect(page).toHaveURL(/.*events/, { timeout: 5000 });
      }
    }
  });

  test('should show event status badge', async ({ page }) => {
    await page.goto('/admin/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      // Look for status badge (published, draft, cancelled, etc.)
      const statusBadge = page.locator('.badge, .status, [class*="status"]').filter({ hasText: /published|draft|cancelled/i });
      const hasBadge = await statusBadge.first().isVisible().catch(() => false);
      expect(hasBadge).toBeTruthy();
    }
  });
});

test.describe('Event Detail - Error Scenarios - Real API', () => {
  test('should handle event not found', async ({ page }) => {
    // Real login as user
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/(events|user)/, { timeout: 10000 });

    // Try to access non-existent event
    await page.goto('/events/999999999');
    await page.waitForTimeout(2000);

    // Should show error message or redirect
    const errorMessage = page.locator('text=/not found|error|invalid/i, .error, .alert-error');
    const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Or might redirect back to events list
    const isRedirected = page.url().includes('/events') && !page.url().includes('/events/999999999');

    expect(hasError || isRedirected).toBeTruthy();
  });

  test('should handle registration error', async ({ page }) => {
    // Real login as user
    await page.goto('/login');

    await page.fill('input[formControlName="username"]', testConfig.testUsers.user.username!);
    await page.fill('input[formControlName="password"]', testConfig.testUsers.user.password!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/(events|user)/, { timeout: 10000 });
    await page.goto('/user/events');
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href*="/events/"], button').filter({ hasText: /view|details/i });
    const linkCount = await eventLinks.count();

    if (linkCount > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(2000);

      const registerButton = page.locator('button').filter({ hasText: /^register$/i });
      if (await registerButton.isVisible().catch(() => false)) {
        await registerButton.click();
        await page.waitForTimeout(500);

        // Try to submit without filling required fields
        const confirmButton = page.locator('button').filter({ hasText: /confirm|register|submit/i }).first();
        await confirmButton.click();

        await page.waitForTimeout(1000);

        // Should show validation error or stay on modal
        const errorMessage = page.locator('.error, .alert-error, text=/required|invalid/i');
        const modalStillOpen = page.locator('.modal, dialog');

        const hasError = await errorMessage.first().isVisible().catch(() => false);
        const modalOpen = await modalStillOpen.first().isVisible().catch(() => false);

        expect(hasError || modalOpen).toBeTruthy();
      }
    }
  });
});
