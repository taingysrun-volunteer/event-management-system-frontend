/**
 * Test Fixtures Index
 * Central export point for all test fixtures
 *
 * Usage:
 * import { MOCK_USERS, MOCK_EVENTS, createMockUser } from '@testing/fixtures';
 */

// User fixtures
export {
  MOCK_USERS,
  ADMIN_USER,
  REGULAR_USER,
  MOCK_USER_LIST_RESPONSE,
  createPaginatedUserResponse,
  createMockUser,
  filterUsersByRole,
  searchUsers
} from './user.fixtures';

// Event fixtures
export {
  MOCK_EVENTS,
  PUBLISHED_EVENTS,
  DRAFT_EVENTS,
  FULL_EVENTS,
  UPCOMING_EVENTS,
  MOCK_EVENT_LIST_RESPONSE,
  MOCK_PUBLISHED_EVENTS_RESPONSE,
  createPaginatedEventResponse,
  createMockEvent,
  searchEvents,
  getEventById,
  getEventsByCategory
} from './event.fixtures';

// Category fixtures
export {
  MOCK_CATEGORIES,
  POPULAR_CATEGORIES,
  MOCK_CATEGORY_LIST_RESPONSE,
  createPaginatedCategoryResponse,
  createMockCategory,
  getCategoryById,
  getCategoryByName,
  searchCategories
} from './category.fixtures';
