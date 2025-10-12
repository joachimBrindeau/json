export const TEST_USERS = {
  regular: {
    email: 'testuser@jsonshare.test',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
  },

  admin: {
    email: 'admin@jsonshare.test',
    password: 'AdminPassword123!',
    name: 'Admin User',
    role: 'admin',
  },

  developer: {
    email: 'dev@jsonshare.test',
    password: 'DevPassword123!',
    name: 'Developer User',
    role: 'developer',
  },

  powerUser: {
    email: 'power@jsonshare.test',
    password: 'PowerPassword123!',
    name: 'Power User',
    role: 'power_user',
  },

  communityManager: {
    email: 'community@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Manager',
    role: 'community_manager',
  },

  // Temporary test users for isolated tests
  temp1: {
    email: 'temp1@jsonshare.test',
    password: 'TempPassword123!',
    name: 'Temp User 1',
    role: 'user',
  },

  temp2: {
    email: 'temp2@jsonshare.test',
    password: 'TempPassword123!',
    name: 'Temp User 2',
    role: 'user',
  },

  // Invalid user for negative testing
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword',
    name: 'Invalid User',
    role: 'user',
  },
} as const;

export type UserType = keyof typeof TEST_USERS;

export const MOCK_SESSION_DATA = {
  sessionId: 'mock-session-123',
  anonymousData: [
    {
      id: 'anon-json-1',
      content: '{"message": "Hello from anonymous user"}',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'anon-json-2',
      content: '{"data": [1, 2, 3, 4, 5]}',
      timestamp: new Date().toISOString(),
    },
  ],
};

export const OAUTH_PROVIDERS = {
  google: {
    enabled: true,
    testAccount: {
      email: 'test.oauth@gmail.com',
      id: 'google-123456',
    },
  },
  github: {
    enabled: true,
    testAccount: {
      email: 'test.oauth@github.com',
      username: 'test-oauth-user',
      id: 'github-654321',
    },
  },
};

export const USER_PERMISSIONS = {
  anonymous: {
    canCreate: true,
    canView: true,
    canShare: false,
    canPublish: false,
    canDelete: false,
    maxFileSize: 1024 * 1024, // 1MB
    maxFiles: 10,
  },

  user: {
    canCreate: true,
    canView: true,
    canShare: true,
    canPublish: true,
    canDelete: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 100,
  },

  power_user: {
    canCreate: true,
    canView: true,
    canShare: true,
    canPublish: true,
    canDelete: true,
    canBulkActions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 1000,
  },

  developer: {
    canCreate: true,
    canView: true,
    canShare: true,
    canPublish: true,
    canDelete: true,
    canAccessAPI: true,
    canUseAdvancedFeatures: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10000,
  },

  admin: {
    canCreate: true,
    canView: true,
    canShare: true,
    canPublish: true,
    canDelete: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canModerateContent: true,
    unlimited: true,
  },
};
