import { Event } from '../../app/core/models/event.model';

/**
 * Event Test Fixtures
 * Provides realistic test data for event-related tests
 */

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Angular Advanced Workshop',
    description: 'Deep dive into Angular signals, dependency injection, and advanced patterns. Learn from industry experts.',
    eventDate: '2025-12-15',
    startTime: '2025-12-15T09:00:00Z',
    endTime: '2025-12-15T17:00:00Z',
    location: 'San Francisco Convention Center, CA',
    capacity: 100,
    availableSeats: 45,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-15T14:30:00Z'
  },
  {
    id: '2',
    title: 'React Fundamentals Bootcamp',
    description: 'Master the basics of React including hooks, state management, and component lifecycle.',
    eventDate: '2026-01-20',
    startTime: '2026-01-20T10:00:00Z',
    endTime: '2026-01-20T18:00:00Z',
    location: 'New York Tech Hub, NY',
    capacity: 150,
    availableSeats: 80,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-11-05T11:20:00Z',
    updatedAt: '2025-11-18T09:45:00Z'
  },
  {
    id: '3',
    title: 'TypeScript Best Practices',
    description: 'Learn TypeScript design patterns, type safety, and how to write maintainable code.',
    eventDate: '2025-12-01',
    startTime: '2025-12-01T13:00:00Z',
    endTime: '2025-12-01T16:00:00Z',
    location: 'Online Webinar',
    capacity: 500,
    availableSeats: 320,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-10-15T08:00:00Z',
    updatedAt: '2025-11-10T16:20:00Z'
  },
  {
    id: '4',
    title: 'DevOps for Frontend Developers',
    description: 'CI/CD pipelines, Docker, Kubernetes, and deployment strategies for modern web applications.',
    eventDate: '2026-02-10',
    startTime: '2026-02-10T09:00:00Z',
    endTime: '2026-02-10T17:00:00Z',
    location: 'Seattle Tech Campus, WA',
    capacity: 80,
    availableSeats: 0,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-11-08T13:45:00Z',
    updatedAt: '2025-11-20T10:15:00Z'
  },
  {
    id: '5',
    title: 'Web Performance Optimization',
    description: 'Techniques for improving page load time, runtime performance, and user experience.',
    eventDate: '2025-12-05',
    startTime: '2025-12-05T14:00:00Z',
    endTime: '2025-12-05T17:00:00Z',
    location: 'Austin Innovation Center, TX',
    capacity: 60,
    availableSeats: 25,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-10-20T09:30:00Z',
    updatedAt: '2025-11-12T15:00:00Z'
  },
  {
    id: '6',
    title: 'GraphQL API Design',
    description: 'Building efficient and scalable GraphQL APIs with Apollo Server and type-safe schemas.',
    eventDate: '2026-01-15',
    startTime: '2026-01-15T10:00:00Z',
    endTime: '2026-01-15T16:00:00Z',
    location: 'Boston Tech Hub, MA',
    capacity: 70,
    availableSeats: 40,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-11-02T14:15:00Z',
    updatedAt: '2025-11-16T11:30:00Z'
  },
  {
    id: '7',
    title: 'Machine Learning for Web Developers',
    description: 'Introduction to ML concepts, TensorFlow.js, and integrating AI into web applications.',
    eventDate: '2026-03-01',
    startTime: '2026-03-01T09:00:00Z',
    endTime: '2026-03-01T18:00:00Z',
    location: 'Silicon Valley Campus, CA',
    capacity: 120,
    availableSeats: 95,
    status: 'published',
    categoryId: 2,
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-22T13:45:00Z'
  },
  {
    id: '8',
    title: 'Cybersecurity Fundamentals',
    description: 'Essential security practices, OWASP top 10, and protecting web applications from threats.',
    eventDate: '2025-12-20',
    startTime: '2025-12-20T13:00:00Z',
    endTime: '2025-12-20T17:00:00Z',
    location: 'Washington DC Conference Center',
    capacity: 90,
    availableSeats: 55,
    status: 'published',
    categoryId: 2,
    createdAt: '2025-10-25T11:20:00Z',
    updatedAt: '2025-11-14T09:10:00Z'
  },
  {
    id: '9',
    title: 'Mobile-First Design Workshop',
    description: 'Responsive design, progressive web apps, and creating great mobile experiences.',
    eventDate: '2026-01-25',
    startTime: '2026-01-25T10:00:00Z',
    endTime: '2026-01-25T15:00:00Z',
    location: 'Miami Design Studio, FL',
    capacity: 50,
    availableSeats: 18,
    status: 'published',
    categoryId: 3,
    createdAt: '2025-11-12T15:30:00Z',
    updatedAt: '2025-11-19T12:25:00Z'
  },
  {
    id: '10',
    title: 'Blockchain Development Basics',
    description: 'Smart contracts, Web3, and building decentralized applications with Ethereum.',
    eventDate: '2026-02-15',
    startTime: '2026-02-15T09:00:00Z',
    endTime: '2026-02-15T17:00:00Z',
    location: 'Denver Blockchain Hub, CO',
    capacity: 75,
    availableSeats: 50,
    status: 'draft',
    categoryId: 1,
    createdAt: '2025-11-15T08:45:00Z',
    updatedAt: '2025-11-21T14:00:00Z'
  },
  {
    id: '11',
    title: 'Accessibility in Modern Web Apps',
    description: 'WCAG guidelines, ARIA attributes, and building inclusive web experiences.',
    eventDate: '2025-12-10',
    startTime: '2025-12-10T14:00:00Z',
    endTime: '2025-12-10T17:00:00Z',
    location: 'Online Webinar',
    capacity: 300,
    availableSeats: 210,
    status: 'published',
    categoryId: 3,
    createdAt: '2025-10-18T12:00:00Z',
    updatedAt: '2025-11-11T10:40:00Z'
  },
  {
    id: '12',
    title: 'Cloud Architecture Patterns',
    description: 'AWS, Azure, and GCP best practices for scalable cloud-native applications.',
    eventDate: '2026-01-30',
    startTime: '2026-01-30T09:00:00Z',
    endTime: '2026-01-30T18:00:00Z',
    location: 'Chicago Tech Center, IL',
    capacity: 110,
    availableSeats: 65,
    status: 'published',
    categoryId: 1,
    createdAt: '2025-11-06T09:15:00Z',
    updatedAt: '2025-11-17T15:50:00Z'
  }
];

/**
 * Filter events by status
 */
export const PUBLISHED_EVENTS = MOCK_EVENTS.filter(e => e.status === 'published');
export const DRAFT_EVENTS = MOCK_EVENTS.filter(e => e.status === 'draft');
export const FULL_EVENTS = MOCK_EVENTS.filter(e => e.availableSeats === 0);
export const UPCOMING_EVENTS = MOCK_EVENTS.filter(e => new Date(e.eventDate) > new Date());

/**
 * Event List Response Mock
 */
export const MOCK_EVENT_LIST_RESPONSE = {
  events: MOCK_EVENTS,
  totalPages: 1,
  totalItems: MOCK_EVENTS.length,
  size: 10,
  number: 0
};

/**
 * Published Events Response Mock
 */
export const MOCK_PUBLISHED_EVENTS_RESPONSE = {
  events: PUBLISHED_EVENTS,
  totalPages: 1,
  totalItems: PUBLISHED_EVENTS.length,
  size: 9,
  number: 0
};

/**
 * Create paginated event response
 */
export const createPaginatedEventResponse = (
  events: Event[],
  page: number,
  size: number = 10
) => {
  const start = page * size;
  const end = start + size;
  const paginatedEvents = events.slice(start, end);

  return {
    events: paginatedEvents,
    totalPages: Math.ceil(events.length / size),
    totalItems: events.length,
    size,
    number: page
  };
};

/**
 * Create a new event for testing
 */
export const createMockEvent = (overrides?: Partial<Event>): Event => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Test Event ${Math.random().toString(36).substr(2, 5)}`,
    description: 'This is a test event description with enough detail to be realistic.',
    eventDate: futureDate.toISOString().split('T')[0],
    startTime: `${futureDate.toISOString().split('T')[0]}T09:00:00Z`,
    endTime: `${futureDate.toISOString().split('T')[0]}T17:00:00Z`,
    location: 'Test Location',
    capacity: 100,
    availableSeats: 50,
    status: 'published',
    categoryId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Search events by query
 */
export const searchEvents = (query: string, categoryId?: string) => {
  const lowerQuery = query.toLowerCase();
  let filtered = MOCK_EVENTS.filter(event =>
    event.title.toLowerCase().includes(lowerQuery) ||
    event.description.toLowerCase().includes(lowerQuery) ||
    event.location.toLowerCase().includes(lowerQuery)
  );

  if (categoryId) {
    filtered = filtered.filter(event => event.categoryId?.toString() === categoryId);
  }

  return filtered;
};

/**
 * Get event by ID
 */
export const getEventById = (id: string): Event | undefined => {
  return MOCK_EVENTS.find(event => event.id === id);
};

/**
 * Get events by category
 */
export const getEventsByCategory = (categoryId: number): Event[] => {
  return MOCK_EVENTS.filter(event => event.categoryId === categoryId);
};
