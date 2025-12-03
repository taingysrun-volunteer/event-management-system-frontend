import { User } from '../../app/core/models/user.model';

/**
 * User Test Fixtures
 * Provides realistic test data for user-related tests
 */

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin_user',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  },
  {
    id: '2',
    username: 'john_doe',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER'
  },
  {
    id: '3',
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'USER'
  },
  {
    id: '4',
    username: 'bob_wilson',
    email: 'bob.wilson@example.com',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'USER'
  },
  {
    id: '5',
    username: 'alice_johnson',
    email: 'alice.johnson@example.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'ADMIN'
  },
  {
    id: '6',
    username: 'charlie_brown',
    email: 'charlie.brown@example.com',
    firstName: 'Charlie',
    lastName: 'Brown',
    role: 'USER'
  },
  {
    id: '7',
    username: 'diana_prince',
    email: 'diana.prince@example.com',
    firstName: 'Diana',
    lastName: 'Prince',
    role: 'USER'
  },
  {
    id: '8',
    username: 'edward_norton',
    email: 'edward.norton@example.com',
    firstName: 'Edward',
    lastName: 'Norton',
    role: 'USER'
  },
  {
    id: '9',
    username: 'fiona_gallagher',
    email: 'fiona.gallagher@example.com',
    firstName: 'Fiona',
    lastName: 'Gallagher',
    role: 'USER'
  },
  {
    id: '10',
    username: 'george_harris',
    email: 'george.harris@example.com',
    firstName: 'George',
    lastName: 'Harris',
    role: 'USER'
  }
];

export const ADMIN_USER: User = MOCK_USERS[0];
export const REGULAR_USER: User = MOCK_USERS[1];

/**
 * User List Response Mock
 */
export const MOCK_USER_LIST_RESPONSE = {
  users: MOCK_USERS,
  currentPage: 0,
  totalPages: 1,
  totalItems: 10,
  pageSize: 10,
  hasNext: false,
  hasPrevious: false
};

/**
 * Paginated User List Response
 */
export const createPaginatedUserResponse = (page: number, size: number = 10) => {
  const start = page * size;
  const end = start + size;
  const paginatedUsers = MOCK_USERS.slice(start, end);

  return {
    users: paginatedUsers,
    currentPage: page,
    totalPages: Math.ceil(MOCK_USERS.length / size),
    totalItems: MOCK_USERS.length,
    pageSize: size,
    hasNext: end < MOCK_USERS.length,
    hasPrevious: page > 0
  };
};

/**
 * Create a new user for testing
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: Math.random().toString(36).substr(2, 9),
  username: `user_${Math.random().toString(36).substr(2, 5)}`,
  email: `user${Math.random().toString(36).substr(2, 5)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  ...overrides
});

/**
 * Filter users by role
 */
export const filterUsersByRole = (role: string) => {
  return MOCK_USERS.filter(user => user.role === role);
};

/**
 * Search users by query
 */
export const searchUsers = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return MOCK_USERS.filter(user =>
    user.username.toLowerCase().includes(lowerQuery) ||
    user.email.toLowerCase().includes(lowerQuery) ||
    user.firstName.toLowerCase().includes(lowerQuery) ||
    user.lastName.toLowerCase().includes(lowerQuery)
  );
};
