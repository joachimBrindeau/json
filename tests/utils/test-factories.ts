import { Page, BrowserContext } from '@playwright/test';
import { TEST_USERS, UserType } from '../fixtures/users';

/**
 * Factory class for creating test data with consistent patterns
 * Eliminates duplication across tests by providing standardized test entities
 */
export class TestFactories {
  private static userCounter = 0;
  private static documentCounter = 0;
  private static sessionCounter = 0;

  /**
   * Create a test user with unique credentials
   */
  static createTestUser(overrides: Partial<{
    email: string;
    password: string;
    name: string;
    role: string;
    firstName: string;
    lastName: string;
  }> = {}) {
    const id = ++this.userCounter;
    const timestamp = Date.now();
    
    const firstName = overrides.firstName || `TestUser`;
    const lastName = overrides.lastName || `${id}`;
    
    return {
      id: `test-user-${id}`,
      email: overrides.email || `testuser${id}.${timestamp}@jsonshare.test`,
      password: overrides.password || `TestPass${id}!`,
      name: overrides.name || `${firstName} ${lastName}`,
      firstName,
      lastName,
      role: overrides.role || 'user',
      username: `testuser${id}${timestamp}`,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create multiple test users for batch operations
   */
  static createTestUsers(count: number, baseOverrides: Parameters<typeof TestFactories.createTestUser>[0] = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.createTestUser({
        ...baseOverrides,
        email: baseOverrides.email ? `${i}.${baseOverrides.email}` : undefined,
        name: baseOverrides.name ? `${baseOverrides.name} ${i + 1}` : undefined,
      })
    );
  }

  /**
   * Create a predefined test user from fixtures
   */
  static createFixtureUser(userType: UserType = 'regular') {
    const user = TEST_USERS[userType];
    return {
      ...user,
      id: `fixture-${userType}`,
      username: userType,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create a test JSON document with metadata
   */
  static createTestDocument(overrides: Partial<{
    title: string;
    content: string | object;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    userId: string;
    size: 'small' | 'medium' | 'large' | 'xlarge';
  }> = {}) {
    const id = ++this.documentCounter;
    const timestamp = Date.now();
    
    // Generate content based on size
    let content = overrides.content;
    if (!content) {
      switch (overrides.size || 'small') {
        case 'small':
          content = this.generateSmallJSON(id);
          break;
        case 'medium':
          content = this.generateMediumJSON(id);
          break;
        case 'large':
          content = this.generateLargeJSON(id);
          break;
        case 'xlarge':
          content = this.generateXLargeJSON(id);
          break;
      }
    }

    const jsonContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;

    return {
      id: `test-doc-${id}`,
      title: overrides.title || `Test Document ${id}`,
      content: jsonContent,
      description: overrides.description || `Test document created at ${new Date().toISOString()}`,
      category: overrides.category || 'test',
      tags: overrides.tags || ['test', `doc-${id}`, 'automated'],
      isPublic: overrides.isPublic ?? false,
      userId: overrides.userId || null,
      size: this.calculateJSONSize(jsonContent),
      nodeCount: this.estimateNodeCount(jsonContent),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create multiple test documents
   */
  static createTestDocuments(count: number, baseOverrides: Parameters<typeof TestFactories.createTestDocument>[0] = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.createTestDocument({
        ...baseOverrides,
        title: baseOverrides.title ? `${baseOverrides.title} ${i + 1}` : undefined,
      })
    );
  }

  /**
   * Create a test session with mock data
   */
  static createTestSession(overrides: Partial<{
    sessionId: string;
    userId: string;
    anonymous: boolean;
    documents: any[];
    preferences: object;
  }> = {}) {
    const id = ++this.sessionCounter;
    const timestamp = Date.now();

    return {
      sessionId: overrides.sessionId || `session-${id}-${timestamp}`,
      userId: overrides.userId || null,
      anonymous: overrides.anonymous ?? true,
      documents: overrides.documents || [
        this.createTestDocument({ title: `Session Doc 1` }),
        this.createTestDocument({ title: `Session Doc 2` }),
      ],
      preferences: overrides.preferences || {
        theme: 'light',
        viewMode: 'tree',
        autoSave: true,
        notifications: true,
      },
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create large test data for performance testing
   */
  static createLargeTestData(options: {
    objectCount?: number;
    arraySize?: number;
    nestingDepth?: number;
    includeStrings?: boolean;
    includeLargeStrings?: boolean;
  } = {}) {
    const {
      objectCount = 1000,
      arraySize = 100,
      nestingDepth = 5,
      includeStrings = true,
      includeLargeStrings = false,
    } = options;

    const data: any = {
      metadata: {
        generated: new Date().toISOString(),
        objectCount,
        arraySize,
        nestingDepth,
        purpose: 'performance-testing',
      },
      data: [],
    };

    // Generate array of objects
    for (let i = 0; i < objectCount; i++) {
      const obj: any = {
        id: i,
        index: i,
        name: `Object ${i}`,
        active: i % 2 === 0,
        score: Math.random() * 100,
        category: `category_${i % 10}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      };

      // Add nested structure
      if (nestingDepth > 0) {
        obj.nested = this.generateNestedStructure(nestingDepth, i);
      }

      // Add arrays
      obj.values = Array.from({ length: arraySize }, (_, k) => ({
        index: k,
        value: Math.floor(Math.random() * 1000),
        label: `Value ${k}`,
      }));

      // Add strings
      if (includeStrings) {
        obj.description = `This is object ${i} with some descriptive text that makes the JSON larger.`;
      }

      if (includeLargeStrings) {
        obj.content = 'A'.repeat(1000) + ` - Object ${i} content`;
      }

      data.data.push(obj);
    }

    return data;
  }

  /**
   * Create test data for specific scenarios
   */
  static createScenarioData(scenario: 'upload' | 'sharing' | 'library' | 'embedding' | 'api', options: any = {}) {
    switch (scenario) {
      case 'upload':
        return {
          files: [
            { name: 'simple.json', content: this.generateSmallJSON(1) },
            { name: 'complex.json', content: this.generateMediumJSON(1) },
            { name: 'large.json', content: this.generateLargeJSON(1) },
          ],
          metadata: {
            scenario: 'file-upload-testing',
            created: new Date().toISOString(),
          },
        };

      case 'sharing':
        return {
          document: this.createTestDocument({
            title: 'Shared Document',
            isPublic: true,
            tags: ['shared', 'public'],
          }),
          shareSettings: {
            allowComments: true,
            allowDownload: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };

      case 'library':
        return {
          publicDocuments: this.createTestDocuments(10, { isPublic: true }),
          privateDocuments: this.createTestDocuments(5, { isPublic: false }),
          categories: ['api', 'config', 'data', 'sample', 'tutorial'],
          tags: ['json', 'test', 'example', 'demo', 'sample'],
        };

      case 'embedding':
        return {
          embedCode: `<iframe src="${options.baseUrl}/embed/${options.documentId}" width="100%" height="400"></iframe>`,
          scriptTag: `<script src="${options.baseUrl}/embed.js" data-document-id="${options.documentId}"></script>`,
          apiEndpoint: `${options.baseUrl}/api/embed/${options.documentId}`,
        };

      case 'api':
        return {
          endpoints: [
            { method: 'GET', path: '/api/json/:id', purpose: 'retrieve document' },
            { method: 'POST', path: '/api/json/upload', purpose: 'upload document' },
            { method: 'PUT', path: '/api/json/:id', purpose: 'update document' },
            { method: 'DELETE', path: '/api/json/:id', purpose: 'delete document' },
          ],
          sampleData: this.generateMediumJSON(1),
        };

      default:
        return {};
    }
  }

  // Private helper methods
  private static generateSmallJSON(seed: number) {
    return {
      id: seed,
      name: `Small JSON ${seed}`,
      active: true,
      metadata: {
        created: new Date().toISOString(),
        type: 'small',
      },
      tags: ['small', 'test'],
    };
  }

  private static generateMediumJSON(seed: number) {
    return {
      id: seed,
      name: `Medium JSON ${seed}`,
      active: true,
      metadata: {
        created: new Date().toISOString(),
        type: 'medium',
        version: '1.0.0',
      },
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `item_${i}`,
        name: `Item ${i}`,
        value: Math.random() * 100,
        category: `cat_${i % 5}`,
      })),
      settings: {
        theme: 'default',
        autoSave: true,
        notifications: true,
        advanced: {
          caching: true,
          compression: false,
          analytics: true,
        },
      },
    };
  }

  private static generateLargeJSON(seed: number) {
    return {
      id: seed,
      name: `Large JSON ${seed}`,
      metadata: {
        created: new Date().toISOString(),
        type: 'large',
        version: '2.0.0',
        description: 'Large JSON document for testing'.repeat(10),
      },
      data: Array.from({ length: 500 }, (_, i) => ({
        id: `large_item_${i}`,
        name: `Large Item ${i}`,
        description: `Description for item ${i} with additional context`.repeat(3),
        properties: {
          value: Math.random() * 1000,
          category: `category_${i % 20}`,
          tags: Array.from({ length: 5 }, (_, j) => `tag_${j}`),
          nested: {
            level1: {
              level2: {
                level3: `Deep value ${i}`,
              },
            },
          },
        },
      })),
    };
  }

  private static generateXLargeJSON(seed: number) {
    return {
      id: seed,
      name: `XLarge JSON ${seed}`,
      metadata: {
        created: new Date().toISOString(),
        type: 'xlarge',
        warning: 'This is a very large JSON document',
      },
      data: Array.from({ length: 2000 }, (_, i) => ({
        id: `xlarge_item_${i}`,
        name: `XLarge Item ${i}`,
        content: 'Large content string '.repeat(20),
        properties: this.generateNestedStructure(3, i),
        values: Array.from({ length: 20 }, (_, j) => Math.random() * 1000),
      })),
    };
  }

  private static generateNestedStructure(depth: number, seed: number): any {
    if (depth <= 0) {
      return { value: `leaf_${seed}`, depth: 0 };
    }

    return {
      level: depth,
      id: `nested_${depth}_${seed}`,
      data: this.generateNestedStructure(depth - 1, seed),
      siblings: Array.from({ length: 3 }, (_, i) => ({
        id: `sibling_${depth}_${i}_${seed}`,
        value: Math.random() * depth * seed,
      })),
    };
  }

  private static calculateJSONSize(jsonString: string): number {
    return new Blob([jsonString]).size;
  }

  private static estimateNodeCount(jsonString: string): number {
    // Simple estimation based on { } [ ] occurrences
    const objects = (jsonString.match(/{/g) || []).length;
    const arrays = (jsonString.match(/\[/g) || []).length;
    const properties = (jsonString.match(/"/g) || []).length / 2; // Rough estimate
    return objects + arrays + properties;
  }
}

/**
 * Helper functions for creating specific test scenarios
 */
export class TestScenarios {
  /**
   * Create data for user registration flow testing
   */
  static createRegistrationFlow() {
    return {
      newUser: TestFactories.createTestUser(),
      duplicateUser: TestFactories.createFixtureUser('regular'),
      invalidUsers: [
        TestFactories.createTestUser({ email: 'invalid-email' }),
        TestFactories.createTestUser({ password: '123' }), // Too short
        TestFactories.createTestUser({ email: '' }), // Empty email
      ],
    };
  }

  /**
   * Create data for document sharing workflow
   */
  static createSharingWorkflow() {
    const owner = TestFactories.createTestUser({ role: 'user' });
    const viewer = TestFactories.createTestUser({ role: 'user' });
    const document = TestFactories.createTestDocument({
      title: 'Shared Test Document',
      userId: owner.id,
      isPublic: true,
    });

    return { owner, viewer, document };
  }

  /**
   * Create data for library browsing scenarios
   */
  static createLibraryScenario() {
    return {
      publicDocuments: TestFactories.createTestDocuments(20, { isPublic: true }),
      privateDocuments: TestFactories.createTestDocuments(10, { isPublic: false }),
      categories: ['api', 'config', 'sample', 'tutorial', 'demo'],
      popularTags: ['json', 'rest', 'api', 'config', 'example'],
    };
  }

  /**
   * Create data for performance testing scenarios
   */
  static createPerformanceScenario(type: 'small' | 'medium' | 'large' | 'extreme') {
    const configs = {
      small: { objectCount: 100, arraySize: 10, nestingDepth: 2 },
      medium: { objectCount: 500, arraySize: 50, nestingDepth: 3 },
      large: { objectCount: 2000, arraySize: 100, nestingDepth: 5 },
      extreme: { objectCount: 10000, arraySize: 200, nestingDepth: 7 },
    };

    return TestFactories.createLargeTestData(configs[type]);
  }
}