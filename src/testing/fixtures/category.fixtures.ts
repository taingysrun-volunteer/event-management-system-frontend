import { Category } from '../../app/core/models/category.model';

/**
 * Category Test Fixtures
 * Provides realistic test data for category-related tests
 */

export const MOCK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Technology',
    description: 'Technology and software development events'
  },
  {
    id: '2',
    name: 'Business',
    description: 'Business, entrepreneurship, and leadership events'
  },
  {
    id: '3',
    name: 'Design',
    description: 'UX/UI design, graphic design, and creative events'
  },
  {
    id: '4',
    name: 'Marketing',
    description: 'Digital marketing, social media, and content strategy'
  },
  {
    id: '5',
    name: 'Data Science',
    description: 'Machine learning, AI, and data analytics events'
  },
  {
    id: '6',
    name: 'DevOps',
    description: 'Cloud infrastructure, CI/CD, and automation'
  },
  {
    id: '7',
    name: 'Security',
    description: 'Cybersecurity, ethical hacking, and security best practices'
  },
  {
    id: '8',
    name: 'Mobile Development',
    description: 'iOS, Android, and cross-platform mobile app development'
  }
];

/**
 * Category List Response Mock
 */
export const MOCK_CATEGORY_LIST_RESPONSE = {
  categories: MOCK_CATEGORIES,
  totalPages: 1,
  totalItems: MOCK_CATEGORIES.length,
  size: 10,
  number: 0
};

/**
 * Create paginated category response
 */
export const createPaginatedCategoryResponse = (
  categories: Category[] = MOCK_CATEGORIES,
  page: number = 0,
  size: number = 10
) => {
  const start = page * size;
  const end = start + size;
  const paginatedCategories = categories.slice(start, end);

  return {
    categories: paginatedCategories,
    totalPages: Math.ceil(categories.length / size),
    totalItems: categories.length,
    size,
    number: page
  };
};

/**
 * Create a new category for testing
 */
export const createMockCategory = (overrides?: Partial<Category>): Category => ({
  id: Math.random().toString(36).substr(2, 9),
  name: `Category ${Math.random().toString(36).substr(2, 5)}`,
  description: `Test category description for ${Math.random().toString(36).substr(2, 5)}`,
  ...overrides
});

/**
 * Get category by ID
 */
export const getCategoryById = (id: string): Category | undefined => {
  return MOCK_CATEGORIES.find(category => category.id === id);
};

/**
 * Search categories by query
 */
export const searchCategories = (query: string): Category[] => {
  const lowerQuery = query.toLowerCase();
  return MOCK_CATEGORIES.filter(category =>
    category.name.toLowerCase().includes(lowerQuery) ||
    category.description?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get category by name
 */
export const getCategoryByName = (name: string): Category | undefined => {
  return MOCK_CATEGORIES.find(category =>
    category.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Popular categories (for UI display)
 */
export const POPULAR_CATEGORIES = MOCK_CATEGORIES.slice(0, 5);
