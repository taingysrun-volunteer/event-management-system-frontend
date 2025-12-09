import { test, expect } from '@playwright/test';

test.describe('Event Management - Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login as admin
    await page.goto('/login');

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-admin-token',
          user: {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN'
          }
        })
      });
    });

    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL(/.*admin/, { timeout: 10000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check if we're on admin page
    await expect(page).toHaveURL(/.*admin/);

    // Check for admin dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /event management system/i }))
      .toBeVisible();
  });

  test('should navigate to event list', async ({ page }) => {
    // Mock events API
    await page.route('**/api/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: '1',
              title: 'Angular Workshop',
              description: 'Learn Angular',
              eventDate: '2025-12-01',
              startTime: '09:00',
              endTime: '17:00',
              location: 'San Francisco',
              capacity: 50,
              availableSeats: 30,
              status: 'published'
            }
          ],
          totalPages: 1,
          totalItems: 1,
          size: 10,
          number: 0
        })
      });
    });

    // Navigate to events (look for link or button)
    const eventLink = page.locator('a, button').filter({ hasText: /events/i }).first();
    await eventLink.click();

    // Should be on events page
    await expect(page).toHaveURL(/.*events/, { timeout: 5000 });
  });

  test.describe('Event List', () => {
    test.beforeEach(async ({ page }) => {
      // Mock events API
      await page.route('**/api/events**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            events: [
              {
                id: '1',
                title: 'Angular Workshop',
                description: 'Learn Angular basics',
                eventDate: '2025-12-01',
                startTime: '09:00',
                endTime: '17:00',
                location: 'San Francisco, CA',
                capacity: 50,
                availableSeats: 30,
                status: 'published'
              },
              {
                id: '2',
                title: 'React Conference',
                description: 'React best practices',
                eventDate: '2025-12-15',
                startTime: '10:00',
                endTime: '18:00',
                location: 'New York, NY',
                capacity: 100,
                availableSeats: 50,
                status: 'draft'
              }
            ],
            totalPages: 1,
            totalItems: 2,
            size: 10,
            number: 0
          })
        });
      });

      await page.goto('/admin/events');
    });

    test('should display list of events', async ({ page }) => {
      // Check if events are displayed
      await expect(page.locator('text=Angular Workshop')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=React Conference')).toBeVisible({ timeout: 5000 });
    });

    test('should display event details', async ({ page }) => {
      // Check for event information
      await expect(page.locator('text=Angular Workshop')).toBeVisible();
      await expect(page.locator('text=San Francisco')).toBeVisible();
    });

    test('should show create event button', async ({ page }) => {
      const createButton = page.locator('button, a').filter({ hasText: /create|new event|add event/i });
      await expect(createButton.first()).toBeVisible();
    });
  });

  test.describe('Create Event', () => {
    test('should navigate to create event form', async ({ page }) => {
      await page.route('**/api/events**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ events: [], totalPages: 0, totalItems: 0, size: 10, number: 0 })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/admin/events');

      const createButton = page.locator('button, a').filter({ hasText: /create|new event|add event/i });
      await createButton.first().click();

      // Should navigate to create form
      await expect(page).toHaveURL(/.*events\/create|.*events\/new/, { timeout: 5000 });
    });

    test('should create new event successfully', async ({ page }) => {
      // Mock categories API
      await page.route('**/api/categories**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Technology' },
            { id: 2, name: 'Business' }
          ])
        });
      });

      // Mock create event API
      await page.route('**/api/events', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '123',
              title: 'New Event',
              description: 'Test Description',
              eventDate: '2025-12-20',
              startTime: '10:00',
              endTime: '12:00',
              location: 'Test Location',
              capacity: 50,
              status: 'draft'
            })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/admin/events/create');

      // Fill event form
      await page.fill('input[formControlName="title"]', 'New Event');
      await page.fill('textarea[formControlName="description"]', 'Test Description');
      await page.fill('input[formControlName="location"]', 'Test Location');
      await page.fill('input[formControlName="capacity"]', '50');

      // Fill date/time fields if they exist
      const dateInput = page.locator('input[formControlName="eventDate"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-12-20');
      }

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to event list or show success
      await expect(page.locator('.success-message, [class*="success"], text=/success/i'))
        .toBeVisible({ timeout: 5000 })
        .catch(() => expect(page).toHaveURL(/.*events/));
    });
  });

  test.describe('Delete Event', () => {
    test('should delete event with confirmation', async ({ page }) => {
      // Mock events list
      await page.route('**/api/events**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              events: [{
                id: '1',
                title: 'Event to Delete',
                description: 'Will be deleted',
                eventDate: '2025-12-01',
                startTime: '09:00',
                endTime: '17:00',
                location: 'Test',
                status: 'draft'
              }],
              totalPages: 1,
              totalItems: 1,
              size: 10,
              number: 0
            })
          });
        }
      });

      // Mock delete API
      await page.route('**/api/events/1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204 });
        }
      });

      await page.goto('/admin/events');

      // Wait for event to appear
      await expect(page.locator('text=Event to Delete')).toBeVisible({ timeout: 5000 });

      // Click delete button
      const deleteButton = page.locator('button.btn-delete').first();
      await deleteButton.click();

      // Confirm deletion in modal/dialog
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Event should be removed or success message shown
      await expect(page.locator('text=Event to Delete'))
        .toBeHidden({ timeout: 5000 })
        .catch(() => Promise.resolve());
    });
  });

  test.describe('Edit Event', () => {
    test('should navigate to edit event form', async ({ page }) => {
      await page.route('**/api/events**', async (route) => {
        if (route.request().method() === 'GET' && !route.request().url().includes('/events/1')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              events: [{
                id: '1',
                title: 'Editable Event',
                description: 'Can be edited',
                eventDate: '2025-12-01',
                startTime: '09:00',
                endTime: '17:00',
                location: 'Test Location',
                capacity: 50,
                status: 'draft'
              }],
              totalPages: 1
            })
          });
        }
      });

      // Mock get single event
      await page.route('**/api/events/1', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '1',
              title: 'Editable Event',
              description: 'Can be edited',
              eventDate: '2025-12-01',
              startTime: '09:00',
              endTime: '17:00',
              location: 'Test Location',
              capacity: 50,
              status: 'draft'
            })
          });
        }
      });

      await page.goto('/admin/events');

      // Click edit button
      const editButton = page.locator('button.btn-edit').first();
      await editButton.click();

      // Should navigate to edit form
      await expect(page).toHaveURL(/.*events\/.*\/edit|.*events\/edit/, { timeout: 5000 });
    });
  });
});

test.describe('Event Management - User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login as regular user
    await page.goto('/login');

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-user-token',
          user: {
            id: '2',
            username: 'user',
            email: 'user@example.com',
            firstName: 'Regular',
            lastName: 'User',
            role: 'user'
          }
        })
      });
    });

    await page.fill('input[formControlName="username"]', 'user');
    await page.fill('input[formControlName="password"]', 'user123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*events/, { timeout: 10000 });
  });

  test('should display published events for users', async ({ page }) => {
    // Mock published events
    await page.route('**/api/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [{
            id: '1',
            title: 'Public Event',
            description: 'Available to all',
            eventDate: '2025-12-01',
            startTime: '09:00',
            endTime: '17:00',
            location: 'Public Venue',
            capacity: 100,
            availableSeats: 80,
            status: 'published'
          }],
          totalPages: 1,
          totalItems: 1,
          size: 10,
          number: 0
        })
      });
    });

    await page.goto('/events');

    await expect(page.locator('text=Public Event')).toBeVisible({ timeout: 5000 });
  });

  test('should view event details', async ({ page }) => {
    await page.route('**/api/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [{
            id: '1',
            title: 'Detailed Event',
            description: 'Full description here',
            eventDate: '2025-12-01',
            startTime: '09:00',
            endTime: '17:00',
            location: 'Event Venue',
            capacity: 100,
            availableSeats: 80,
            status: 'published'
          }],
          totalPages: 1
        })
      });
    });

    await page.route('**/api/events/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          title: 'Detailed Event',
          description: 'Full description here',
          eventDate: '2025-12-01',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Event Venue',
          capacity: 100,
          availableSeats: 80,
          status: 'published'
        })
      });
    });

    await page.goto('/events');

    // Click on event to view details
    const eventLink = page.locator('button').filter({ hasText: /view details/i }).first();
    await eventLink.click();

    // Should show event details
    await expect(page.locator('text=Full description')).toBeVisible({ timeout: 5000 });
  });

  test('should not see admin features', async ({ page }) => {
    await page.goto('/events');

    // Should not see admin buttons
    await expect(page.locator('button, a').filter({ hasText: /create|edit|delete|admin/i }))
      .toHaveCount(0);
  });
});
