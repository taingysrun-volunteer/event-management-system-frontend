// import { test, expect } from '@playwright/test';
// import { testConfig } from './config/test.config';
//
// /**
//  * Event Management Tests - Hybrid Approach
//  *
//  * These tests can run with either mocked or real API
//  *
//  * Mocked API (default):
//  *   npm run e2e -- event-management-hybrid.spec.ts
//  *
//  * Real API:
//  *   USE_MOCK_API=false npm run e2e -- event-management-hybrid.spec.ts
//  */
//
// test.describe('Event Management - Admin Flow', () => {
//   test.beforeEach(async ({ page }) => {
//     // Setup API mocking if configured
//     if (testConfig.useMockApi) {
//       await setupMockedApis(page);
//     }
//
//     // Login as admin
//     await page.goto('/login');
//     await page.fill('input[formControlName="username"]',
//       testConfig.useMockApi ? 'admin' : testConfig.testUsers.admin.username);
//     await page.fill('input[formControlName="password"]',
//       testConfig.useMockApi ? 'password123' : testConfig.testUsers.admin.password);
//     await page.click('button[type="submit"]');
//
//     // Wait for admin dashboard
//     await expect(page).toHaveURL(/.*\/admin/);
//   });
//
//   test('should display event list', async ({ page }) => {
//     // Navigate to events
//     await page.click('a[href*="/admin/events"]');
//
//     // Wait for events to load
//     await expect(page.locator('h2:has-text("Event Management")')).toBeVisible();
//
//     // Should display events
//     if (testConfig.useMockApi) {
//       // With mocked API, we know exactly what events exist
//       await expect(page.locator('text=Angular Workshop')).toBeVisible();
//     } else {
//       // With real API, just verify the table exists
//       await expect(page.locator('table, .event-list')).toBeVisible();
//     }
//   });
//
//   test('should create new event', async ({ page }) => {
//     await page.click('a[href*="/admin/events"]');
//     await page.click('button:has-text("Create Event")');
//
//     // Fill event form
//     const eventTitle = testConfig.useMockApi
//       ? 'New Test Event'
//       : `Integration Test Event ${Date.now()}`;
//
//     await page.fill('input[formControlName="title"]', eventTitle);
//     await page.fill('textarea[formControlName="description"]', 'Test event description');
//     await page.fill('input[formControlName="eventDate"]', '2025-12-15');
//     await page.fill('input[formControlName="startTime"]', '09:00');
//     await page.fill('input[formControlName="endTime"]', '17:00');
//     await page.fill('input[formControlName="location"]', 'Test Location');
//     await page.fill('input[formControlName="capacity"]', '100');
//
//     // Select status
//     await page.click('select[formControlName="status"]');
//     await page.selectOption('select[formControlName="status"]', 'published');
//
//     // Submit
//     await page.click('button[type="submit"]');
//
//     // Verify success
//     await expect(page.locator('text=/created successfully|success/i')).toBeVisible();
//
//     // Should redirect back to event list
//     await expect(page).toHaveURL(/.*\/admin\/events/);
//
//     // Verify event appears in list
//     await expect(page.locator(`text=${eventTitle}`)).toBeVisible();
//   });
//
//   test('should edit existing event', async ({ page }) => {
//     await page.click('a[href*="/admin/events"]');
//
//     // Wait for events to load
//     await page.waitForSelector('table tbody tr', { timeout: 5000 });
//
//     // Click edit on first event
//     await page.click('button[title="Edit"], button:has-text("Edit")');
//
//     // Update title
//     const updatedTitle = testConfig.useMockApi
//       ? 'Updated Workshop'
//       : `Updated Event ${Date.now()}`;
//
//     const titleInput = page.locator('input[formControlName="title"]');
//     await titleInput.clear();
//     await titleInput.fill(updatedTitle);
//
//     // Submit
//     await page.click('button[type="submit"]');
//
//     // Verify success
//     await expect(page.locator('text=/updated successfully|success/i')).toBeVisible();
//
//     // Verify updated title appears
//     await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
//   });
//
//   test('should delete event with confirmation', async ({ page }) => {
//     await page.click('a[href*="/admin/events"]');
//
//     // Wait for events to load
//     await page.waitForSelector('table tbody tr', { timeout: 5000 });
//
//     // Get initial event count
//     const initialCount = await page.locator('table tbody tr').count();
//
//     // Click delete button
//     await page.click('button[title="Delete"], button:has-text("Delete")');
//
//     // Confirm deletion in modal
//     await expect(page.locator('text=/are you sure|confirm/i')).toBeVisible();
//     await page.click('button:has-text("Confirm"), button:has-text("Delete")');
//
//     // Wait for success message
//     await expect(page.locator('text=/deleted successfully|success/i')).toBeVisible();
//
//     // Verify event count decreased
//     const newCount = await page.locator('table tbody tr').count();
//     expect(newCount).toBeLessThan(initialCount);
//   });
//
//   test('should navigate through pages', async ({ page }) => {
//     await page.click('a[href*="/admin/events"]');
//
//     // Wait for events to load
//     await page.waitForSelector('table tbody tr', { timeout: 5000 });
//
//     // Check if pagination exists (only if there are multiple pages)
//     const hasNextPage = await page.locator('button:has-text("Next"), .pagination-next').isVisible();
//
//     if (hasNextPage) {
//       // Get first event title on page 1
//       const firstEventPage1 = await page.locator('table tbody tr:first-child td:first-child').textContent();
//
//       // Go to next page
//       await page.click('button:has-text("Next"), .pagination-next');
//
//       // Wait for page to load
//       await page.waitForTimeout(500);
//
//       // Get first event title on page 2
//       const firstEventPage2 = await page.locator('table tbody tr:first-child td:first-child').textContent();
//
//       // Events should be different
//       expect(firstEventPage1).not.toBe(firstEventPage2);
//
//       // Go back to previous page
//       await page.click('button:has-text("Previous"), .pagination-prev');
//
//       // Should show original event
//       await expect(page.locator('table tbody tr:first-child')).toContainText(firstEventPage1 || '');
//     }
//   });
// });
//
// test.describe('Event Management - User Flow', () => {
//   test.beforeEach(async ({ page }) => {
//     if (testConfig.useMockApi) {
//       await setupMockedApis(page);
//     }
//
//     // Login as regular user
//     await page.goto('/login');
//     await page.fill('input[formControlName="username"]',
//       testConfig.useMockApi ? 'user' : testConfig.testUsers.user.username);
//     await page.fill('input[formControlName="password"]',
//       testConfig.useMockApi ? 'password123' : testConfig.testUsers.user.password);
//     await page.click('button[type="submit"]');
//
//     // Wait for user events page
//     await expect(page).toHaveURL(/.*\/user\/events/);
//   });
//
//   test('should view published events only', async ({ page }) => {
//     // Should see event list
//     await expect(page.locator('h2, h1')).toContainText(/events|available events/i);
//
//     // Should see events (if any)
//     const hasEvents = await page.locator('.event-card, table tbody tr').count() > 0;
//
//     if (hasEvents) {
//       // Verify events are visible
//       await expect(page.locator('.event-card, table tbody tr').first()).toBeVisible();
//     }
//   });
//
//   test('should not see admin controls', async ({ page }) => {
//     // Should NOT see Create Event button
//     await expect(page.locator('button:has-text("Create Event")')).not.toBeVisible();
//
//     // Should NOT see Edit buttons
//     await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
//
//     // Should NOT see Delete buttons
//     await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
//   });
//
//   test('should view event details', async ({ page }) => {
//     // Click on first event (if exists)
//     const hasEvents = await page.locator('.event-card, table tbody tr').count() > 0;
//
//     if (hasEvents) {
//       await page.click('.event-card:first-child, table tbody tr:first-child');
//
//       // Should navigate to event details
//       await expect(page).toHaveURL(/.*\/events\/\w+/);
//
//       // Should see event details
//       await expect(page.locator('h1, h2')).toBeVisible();
//     }
//   });
// });
//
// /**
//  * Helper function to set up mocked APIs
//  */
// async function setupMockedApis(page: any) {
//   // Mock login
//   await page.route('**/api/auth/login', async (route: any) => {
//     const request = route.request();
//     const postData = JSON.parse(request.postData() || '{}');
//
//     if (postData.username === 'admin') {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           token: 'mock-admin-token',
//           user: {
//             id: '1',
//             username: 'admin',
//             email: 'admin@example.com',
//             firstName: 'Admin',
//             lastName: 'User',
//             role: 'ADMIN'
//           }
//         })
//       });
//     } else {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           token: 'mock-user-token',
//           user: {
//             id: '2',
//             username: 'user',
//             email: 'user@example.com',
//             firstName: 'Regular',
//             lastName: 'User',
//             role: 'USER'
//           }
//         })
//       });
//     }
//   });
//
//   // Mock get events
//   await page.route('**/api/events**', async (route: any) => {
//     if (route.request().method() === 'GET') {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           events: [
//             {
//               id: '1',
//               title: 'Angular Workshop',
//               description: 'Learn Angular basics',
//               eventDate: '2025-12-01',
//               startTime: '09:00',
//               endTime: '17:00',
//               location: 'San Francisco',
//               capacity: 50,
//               availableSeats: 30,
//               status: 'published'
//             },
//             {
//               id: '2',
//               title: 'React Conference',
//               description: 'React best practices',
//               eventDate: '2025-12-15',
//               startTime: '10:00',
//               endTime: '18:00',
//               location: 'New York',
//               capacity: 100,
//               availableSeats: 50,
//               status: 'published'
//             }
//           ],
//           totalItems: 2,
//           currentPage: 1,
//           totalPages: 1
//         })
//       });
//     }
//   });
//
//   // Mock create event
//   await page.route('**/api/events', async (route: any) => {
//     if (route.request().method() === 'POST') {
//       const postData = JSON.parse(route.request().postData() || '{}');
//       await route.fulfill({
//         status: 201,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           id: `${Date.now()}`,
//           ...postData,
//           availableSeats: postData.capacity
//         })
//       });
//     }
//   });
//
//   // Mock update event
//   await page.route('**/api/events/*', async (route: any) => {
//     if (route.request().method() === 'PUT') {
//       const postData = JSON.parse(route.request().postData() || '{}');
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify(postData)
//       });
//     } else if (route.request().method() === 'DELETE') {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({ message: 'Event deleted successfully' })
//       });
//     }
//   });
// }
