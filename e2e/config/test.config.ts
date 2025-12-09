// E2E Test Configuration
export const testConfig = {
  // Toggle between mocked and real API
  useMockApi: process.env['USE_MOCK_API'] === 'true',

  // Real API configuration
  realApiBaseUrl: process.env['API_BASE_URL'] || 'http://localhost:8080',

  // Test user credentials for real API (from environment variables)
  testUsers: {
    admin: {
      username: process.env['TEST_ADMIN_USERNAME'] || 'admin',
      password: process.env['TEST_ADMIN_PASSWORD'] || 'admin12345',
      email: process.env['TEST_ADMIN_EMAIL'] || 'email',
    },
    user: {
      username: process.env['TEST_USER_USERNAME'] || 'user_1234',
      password: process.env['TEST_USER_PASSWORD'] || '123456',
      email: process.env['TEST_USER_EMAIL'] || 'email',
    }
  },

  // Test data for registration
  testRegistration: {
    username: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: process.env['TEST_REGISTRATION_PASSWORD'] || 'password',
  }
};
