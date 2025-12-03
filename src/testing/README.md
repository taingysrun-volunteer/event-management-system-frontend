# Test Fixtures and Utilities

This directory contains reusable test fixtures and utilities for the Event Management System tests.

## Overview

Test fixtures provide realistic, consistent mock data that can be shared across unit tests and E2E tests. This ensures:
- **Consistency**: Same data across all tests
- **Maintainability**: Update mock data in one place
- **Reusability**: Helper functions for common test scenarios
- **Realistic Data**: Mock data that reflects real-world usage

## Directory Structure

```
src/testing/
├── fixtures/
│   ├── index.ts                    # Central export point for all fixtures
│   ├── user.fixtures.ts            # User mock data and helpers
│   ├── event.fixtures.ts           # Event mock data and helpers
│   ├── category.fixtures.ts        # Category mock data and helpers
│   ├── registration.fixtures.ts    # Registration mock data and helpers
│   └── ticket.fixtures.ts          # Ticket mock data and helpers
└── README.md                       # This file
```

## Usage

### Importing Fixtures

```typescript
// Import from central index
import {
  MOCK_USERS,
  MOCK_EVENTS,
  MOCK_CATEGORIES,
  createMockUser,
  createMockEvent
} from '@testing/fixtures';

// Or import from specific fixture files
import { ADMIN_USER, REGULAR_USER } from '@testing/fixtures/user.fixtures';
import { PUBLISHED_EVENTS } from '@testing/fixtures/event.fixtures';
```

### Using in Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../../core/services/category.service';
import { MOCK_CATEGORIES, MOCK_CATEGORY_LIST_RESPONSE } from '@testing/fixtures';

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    const categorySpy = jasmine.createSpyObj('CategoryService', ['getCategories']);

    await TestBed.configureTestingModule({
      imports: [CategoryListComponent],
      providers: [
        { provide: CategoryService, useValue: categorySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
  });

  it('should display categories from fixture', () => {
    categoryService.getCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));

    fixture.detectChanges();

    expect(component.categories()).toEqual(MOCK_CATEGORIES);
    expect(component.categories().length).toBe(8);
  });

  it('should filter categories correctly', () => {
    component.categories.set(MOCK_CATEGORIES);

    component.searchTerm.set('technology');
    component.filterCategories();

    expect(component.filteredCategories().length).toBeGreaterThan(0);
    expect(component.filteredCategories()[0].name).toContain('Technology');
  });
});
```

### Using in E2E Tests

```typescript
import { test, expect } from '@playwright/test';
import { MOCK_CATEGORIES, MOCK_CATEGORY_LIST_RESPONSE } from '../src/testing/fixtures';

test.describe('Category Management', () => {
  test('should display categories', async ({ page }) => {
    await page.route('**/api/categories**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CATEGORY_LIST_RESPONSE)
        });
      }
    });

    await page.goto('/admin/categories');

    // Verify first category from fixtures is displayed
    const firstCategory = MOCK_CATEGORIES[0];
    await expect(page.locator(`text=${firstCategory.name}`)).toBeVisible();
    await expect(page.locator(`text=${firstCategory.description}`)).toBeVisible();
  });
});
```

## Available Fixtures

### User Fixtures

**File**: `user.fixtures.ts`

```typescript
// Mock data
MOCK_USERS                  // Array of 10 users (2 admin, 8 regular users)
ADMIN_USER                  // Quick reference to admin user
REGULAR_USER                // Quick reference to regular user
MOCK_USER_LIST_RESPONSE     // Paginated response format

// Helper functions
createMockUser(overrides?)          // Generate new user with optional overrides
createPaginatedUserResponse(page, size)  // Create paginated response
filterUsersByRole(role)             // Filter users by role
searchUsers(query)                  // Search users by username/email/name
```

### Event Fixtures

**File**: `event.fixtures.ts`

```typescript
// Mock data
MOCK_EVENTS                     // Array of 12 events
PUBLISHED_EVENTS                // Only published events
DRAFT_EVENTS                    // Only draft events
FULL_EVENTS                     // Events with no available seats
UPCOMING_EVENTS                 // Future events
MOCK_EVENT_LIST_RESPONSE        // Paginated response format
MOCK_PUBLISHED_EVENTS_RESPONSE  // Published events paginated

// Helper functions
createMockEvent(overrides?)                     // Generate new event
createPaginatedEventResponse(events, page, size) // Create paginated response
searchEvents(query, categoryId?)                // Search events
getEventById(id)                                // Find event by ID
getEventsByCategory(categoryId)                 // Filter by category
```

### Category Fixtures

**File**: `category.fixtures.ts`

```typescript
// Mock data
MOCK_CATEGORIES                 // Array of 8 categories
POPULAR_CATEGORIES              // Top 5 popular categories
MOCK_CATEGORY_LIST_RESPONSE     // Paginated response format

// Helper functions
createMockCategory(overrides?)                      // Generate new category
createPaginatedCategoryResponse(categories, page, size) // Create paginated response
getCategoryById(id)                                 // Find category by ID
getCategoryByName(name)                             // Find category by name
searchCategories(query)                             // Search categories
```

### Registration Fixtures

**File**: `registration.fixtures.ts`

```typescript
// Mock data
MOCK_REGISTRATIONS              // Array of 10 registrations
CONFIRMED_REGISTRATIONS         // Only confirmed registrations
CANCELLED_REGISTRATIONS         // Only cancelled registrations
PENDING_REGISTRATIONS           // Only pending registrations
MOCK_REGISTRATION_LIST_RESPONSE // Paginated response format

// Helper functions
createMockRegistration(overrides?)                          // Generate new registration
createPaginatedRegistrationResponse(registrations, page, size) // Create paginated response
getRegistrationById(id)                                     // Find registration by ID
getRegistrationsByUserId(userId)                            // Filter by user
getRegistrationsByEventId(eventId)                          // Filter by event
getUpcomingRegistrations(userId?)                           // Get future registrations
getPastRegistrations(userId?)                               // Get past registrations
searchRegistrations(query)                                  // Search registrations
getRegistrationCountByStatus(status)                        // Count by status
```

### Ticket Fixtures

**File**: `ticket.fixtures.ts`

```typescript
// Mock data
MOCK_TICKETS                    // Array of 10 tickets
ACTIVE_TICKETS                  // Only active tickets
CANCELLED_TICKETS               // Only cancelled tickets
PENDING_TICKETS                 // Only pending tickets
USED_TICKETS                    // Only used tickets
MOCK_TICKET_LIST_RESPONSE       // Paginated response format

// Helper functions
createMockTicket(overrides?)                    // Generate new ticket
createPaginatedTicketResponse(tickets, page, size) // Create paginated response
getTicketById(id)                               // Find ticket by ID
getTicketByCode(code)                           // Find ticket by code
getTicketByRegistrationId(registrationId)       // Find by registration
getTicketsByUserId(userId)                      // Filter by user
getTicketsByEventId(eventId)                    // Filter by event
generateMockQRCode(data)                        // Generate QR code for testing
isValidTicketCode(code)                         // Validate ticket code format
```

## Best Practices

### 1. Use Fixtures Instead of Inline Data

❌ **Bad**:
```typescript
it('should display user', () => {
  const user = { id: '1', username: 'test', email: 'test@example.com' };
  // ...
});
```

✅ **Good**:
```typescript
import { REGULAR_USER } from '@testing/fixtures';

it('should display user', () => {
  const user = REGULAR_USER;
  // ...
});
```

### 2. Use Helper Functions for Dynamic Data

❌ **Bad**:
```typescript
it('should create user', () => {
  const newUser = {
    id: 'random-id',
    username: 'new_user',
    email: 'new@example.com',
    // ... many more fields
  };
});
```

✅ **Good**:
```typescript
import { createMockUser } from '@testing/fixtures';

it('should create user', () => {
  const newUser = createMockUser({
    username: 'new_user',
    email: 'new@example.com'
  });
});
```

### 3. Use Filtered Collections

❌ **Bad**:
```typescript
const publishedEvents = MOCK_EVENTS.filter(e => e.status === 'published');
```

✅ **Good**:
```typescript
import { PUBLISHED_EVENTS } from '@testing/fixtures';

const events = PUBLISHED_EVENTS;
```

### 4. Use Paginated Responses for Realistic Tests

```typescript
import { createPaginatedEventResponse, MOCK_EVENTS } from '@testing/fixtures';

it('should handle pagination', () => {
  const page1 = createPaginatedEventResponse(MOCK_EVENTS, 0, 5);
  const page2 = createPaginatedEventResponse(MOCK_EVENTS, 1, 5);

  expect(page1.events.length).toBe(5);
  expect(page2.events.length).toBe(5);
  expect(page1.totalPages).toBe(3); // 12 events / 5 per page
});
```

### 5. Maintain Fixture Relationships

Fixtures maintain referential integrity:
- Registrations reference valid eventIds and userIds
- Tickets reference valid registrationIds
- Events reference valid categoryIds

```typescript
import {
  MOCK_REGISTRATIONS,
  MOCK_EVENTS,
  getRegistrationsByEventId
} from '@testing/fixtures';

it('should maintain event-registration relationship', () => {
  const eventId = MOCK_EVENTS[0].id;
  const registrations = getRegistrationsByEventId(eventId);

  expect(registrations.length).toBeGreaterThan(0);
  expect(registrations.every(r => r.eventId === eventId)).toBe(true);
});
```

## Updating Fixtures

When updating fixtures:

1. **Update the fixture file** (e.g., `user.fixtures.ts`)
2. **Run tests** to ensure no breakage
3. **Update this README** if adding new fixtures or helpers
4. **Maintain referential integrity** between related fixtures

## TypeScript Configuration

To use `@testing/fixtures` path alias, ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@testing/*": ["src/testing/*"]
    }
  }
}
```

## Contributing

When adding new fixtures:

1. Follow the existing patterns (MOCK_*, helper functions, exports)
2. Include both individual items and collections
3. Provide helper functions for common operations
4. Add exports to `fixtures/index.ts`
5. Document usage in this README
6. Ensure data is realistic and representative

## Resources

- [Jasmine Testing Guide](https://jasmine.github.io/)
- [Playwright Testing Guide](https://playwright.dev)
- [Angular Testing Documentation](https://angular.dev/guide/testing)
- Project Testing Guide: `docs/TESTING_GUIDE.md`

---

**Last Updated**: November 28, 2025
**Version**: 1.0
