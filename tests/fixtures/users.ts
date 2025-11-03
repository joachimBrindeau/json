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
  // Community test users
  content_creator: {
    email: 'content.creator@jsonshare.test',
    password: 'ContentPassword123!',
    name: 'Content Creator',
    role: 'user',
  },

  content_creator_1: {
    email: 'content.creator1@jsonshare.test',
    password: 'ContentPassword123!',
    name: 'Content Creator 1',
    role: 'user',
  },

  content_creator_2: {
    email: 'content.creator2@jsonshare.test',
    password: 'ContentPassword123!',
    name: 'Content Creator 2',
    role: 'user',
  },

  edge_case_creator: {
    email: 'edge.case@jsonshare.test',
    password: 'EdgePassword123!',
    name: 'Edge Case Creator',
    role: 'user',
  },

  creator_1: {
    email: 'creator1@jsonshare.test',
    password: 'CreatorPassword123!',
    name: 'Creator 1',
    role: 'user',
  },

  backup_user: {
    email: 'backup@jsonshare.test',
    password: 'BackupPassword123!',
    name: 'Backup User',
    role: 'user',
  },

  problem_creator: {
    email: 'problem.creator@jsonshare.test',
    password: 'ProblemPassword123!',
    name: 'Problem Creator',
    role: 'user',
  },

  moderator: {
    email: 'moderator@jsonshare.test',
    password: 'ModeratorPassword123!',
    name: 'Moderator User',
    role: 'community_manager',
  },

  social_creator: {
    email: 'social.creator@jsonshare.test',
    password: 'SocialPassword123!',
    name: 'Social Creator',
    role: 'user',
  },

  community_member: {
    email: 'community.member@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member',
    role: 'user',
  },

  community_member_1: {
    email: 'community.member1@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member 1',
    role: 'user',
  },

  community_member_2: {
    email: 'community.member2@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member 2',
    role: 'user',
  },

  community_member_3: {
    email: 'community.member3@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member 3',
    role: 'user',
  },

  community_member_4: {
    email: 'community.member4@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member 4',
    role: 'user',
  },

  community_member_5: {
    email: 'community.member5@jsonshare.test',
    password: 'CommunityPassword123!',
    name: 'Community Member 5',
    role: 'user',
  },

  follower_user: {
    email: 'follower@jsonshare.test',
    password: 'FollowerPassword123!',
    name: 'Follower User',
    role: 'user',
  },
  // Edge case and specialized test users
  editor_1: {
    email: 'editor1@jsonshare.test',
    password: 'Editor1Pass123!',
    name: 'Editor One',
    role: 'user',
  },

  corruption_tester: {
    email: 'corruption.tester@jsonshare.test',
    password: 'CorruptTest123!',
    name: 'Corruption Tester',
    role: 'user',
  },

  network_tester: {
    email: 'network.tester@jsonshare.test',
    password: 'NetworkTest123!',
    name: 'Network Tester',
    role: 'user',
  },

  metadata_edge_tester: {
    email: 'metadata.edge@jsonshare.test',
    password: 'MetadataEdge123!',
    name: 'Metadata Edge Tester',
    role: 'user',
  },

  original_owner: {
    email: 'original.owner@jsonshare.test',
    password: 'OriginalOwner123!',
    name: 'Original Owner',
    role: 'user',
  },

  would_be_editor: {
    email: 'would.be.editor@jsonshare.test',
    password: 'WouldBeEditor123!',
    name: 'Would Be Editor',
    role: 'user',
  },

  deletion_candidate: {
    email: 'deletion.candidate@jsonshare.test',
    password: 'DeleteCandidate123!',
    name: 'Deletion Candidate',
    role: 'user',
  },

  maintenance_tester: {
    email: 'maintenance.tester@jsonshare.test',
    password: 'MaintenanceTest123!',
    name: 'Maintenance Tester',
    role: 'user',
  },

  legacy_content_user: {
    email: 'legacy.content@jsonshare.test',
    password: 'LegacyContent123!',
    name: 'Legacy Content User',
    role: 'user',
  },

  bulk_operations_user: {
    email: 'bulk.operations@jsonshare.test',
    password: 'BulkOps123!',
    name: 'Bulk Operations User',
    role: 'user',
  },

  regular_user: {
    email: 'regular.user@jsonshare.test',
    password: 'RegularUser123!',
    name: 'Regular User',
    role: 'user',
  },

  collaboration_creator: {
    email: 'collaboration.creator@jsonshare.test',
    password: 'CollabCreator123!',
    name: 'Collaboration Creator',
    role: 'user',
  },

  collaborator_1: {
    email: 'collaborator1@jsonshare.test',
    password: 'Collaborator1Pass123!',
    name: 'Collaborator One',
    role: 'user',
  },

  active_contributor: {
    email: 'active.contributor@jsonshare.test',
    password: 'ActiveContrib123!',
    name: 'Active Contributor',
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
