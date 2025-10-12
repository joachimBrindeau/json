/**
 * Test JSON samples for various testing scenarios
 */

export const JSON_SAMPLES = {
  // Simple JSON for basic tests
  simple: {
    name: 'simple-object',
    content: {
      id: 1,
      name: 'John Doe',
      active: true,
      score: 95.5,
      tags: ['user', 'active'],
      metadata: null,
    },
    stringified:
      '{"id":1,"name":"John Doe","active":true,"score":95.5,"tags":["user","active"],"metadata":null}',
  },

  // Nested object structure
  nested: {
    name: 'nested-structure',
    content: {
      user: {
        personal: {
          firstName: 'Alice',
          lastName: 'Johnson',
          age: 28,
          contacts: {
            email: 'alice@example.com',
            phones: [
              { type: 'mobile', number: '+1234567890' },
              { type: 'work', number: '+0987654321' },
            ],
          },
        },
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
    },
  },

  // Large array for performance testing
  largeArray: {
    name: 'large-array',
    generateContent: (size = 1000) => ({
      items: Array.from({ length: size }, (_, i) => ({
        id: `item_${i}`,
        value: Math.random() * 1000,
        category: `category_${i % 10}`,
        active: i % 2 === 0,
        metadata: {
          created: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
          tags: [`tag${i % 5}`, `tag${i % 3}`],
        },
      })),
    }),
  },

  // Deep nesting for recursion testing
  deepNesting: {
    name: 'deep-nesting',
    generateContent: (depth = 10) => {
      const createLevel = (currentDepth: number): any => {
        if (currentDepth >= depth) {
          return { value: `depth_${currentDepth}`, isLeaf: true };
        }
        return {
          level: currentDepth,
          child: createLevel(currentDepth + 1),
          siblings: Array.from({ length: 2 }, (_, i) => ({
            id: `sibling_${currentDepth}_${i}`,
            data: createLevel(currentDepth + 1),
          })),
        };
      };
      return { root: createLevel(0) };
    },
  },

  // Mixed data types
  mixedTypes: {
    name: 'mixed-types',
    content: {
      string: 'Hello World',
      number: 42,
      float: 3.14159,
      boolean: true,
      null: null,
      array: [1, 'two', true, null, { nested: 'object' }],
      object: {
        nested: {
          deeply: {
            nested: 'value',
          },
        },
      },
      emptyArray: [],
      emptyObject: {},
      unicode: 'Hello 🌍! Café naïve résumé',
      specialNumbers: {
        zero: 0,
        negative: -100,
        scientific: 1.23e-10,
      },
    },
  },

  // API response simulation
  apiResponse: {
    name: 'api-response',
    content: {
      success: true,
      data: {
        users: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          username: `user${i + 1}`,
          email: `user${i + 1}@example.com`,
          active: Math.random() > 0.3,
          role: ['admin', 'user', 'moderator'][i % 3],
          profile: {
            firstName: ['John', 'Jane', 'Alice', 'Bob'][i % 4],
            lastName: ['Smith', 'Doe', 'Johnson', 'Brown'][i % 4],
            avatar: `https://example.com/avatar/${i + 1}.jpg`,
          },
          settings: {
            theme: ['dark', 'light'][i % 2],
            notifications: Math.random() > 0.5,
          },
          stats: {
            loginCount: Math.floor(Math.random() * 1000),
            lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          },
        })),
      },
      meta: {
        total: 50,
        page: 1,
        perPage: 50,
        hasNext: false,
      },
    },
  },

  // Complex real-world data
  ecommerce: {
    name: 'ecommerce-data',
    content: {
      order: {
        id: 'ORD-2024-001',
        status: 'completed',
        customer: {
          id: 'CUST-123',
          name: 'John Smith',
          email: 'john@example.com',
          addresses: [
            {
              type: 'billing',
              street: '123 Main St',
              city: 'Anytown',
              state: 'ST',
              zipCode: '12345',
              country: 'US',
            },
            {
              type: 'shipping',
              street: '456 Oak Ave',
              city: 'Othercity',
              state: 'ST',
              zipCode: '67890',
              country: 'US',
            },
          ],
        },
        items: [
          {
            sku: 'PROD-001',
            name: 'Wireless Headphones',
            quantity: 1,
            unitPrice: 99.99,
            totalPrice: 99.99,
            category: 'Electronics',
            specifications: {
              color: 'Black',
              model: 'WH-1000XM4',
              features: ['noise-canceling', 'bluetooth', 'wireless'],
            },
          },
          {
            sku: 'PROD-002',
            name: 'Phone Case',
            quantity: 2,
            unitPrice: 19.99,
            totalPrice: 39.98,
            category: 'Accessories',
            specifications: {
              color: 'Clear',
              material: 'TPU',
              compatibility: ['iPhone 14', 'iPhone 15'],
            },
          },
        ],
        totals: {
          subtotal: 139.97,
          tax: 11.2,
          shipping: 9.99,
          discount: -10.0,
          total: 151.16,
        },
        payment: {
          method: 'credit_card',
          last4: '1234',
          brand: 'visa',
          transactionId: 'TXN-ABC123',
        },
        timestamps: {
          created: '2024-01-15T10:30:00Z',
          updated: '2024-01-15T14:22:00Z',
          shipped: '2024-01-16T09:15:00Z',
          delivered: '2024-01-18T16:45:00Z',
        },
      },
    },
  },

  // Configuration/settings format
  configuration: {
    name: 'app-configuration',
    content: {
      app: {
        name: 'JSON Viewer',
        version: '2.1.0',
        environment: 'production',
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'jsonviewer',
        ssl: true,
        poolSize: 20,
      },
      cache: {
        provider: 'redis',
        host: 'localhost',
        port: 6379,
        ttl: 3600,
      },
      auth: {
        providers: ['email', 'google', 'github'],
        sessionTimeout: 86400,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      },
      features: {
        publicLibrary: true,
        sharing: true,
        analytics: false,
        rateLimiting: {
          enabled: true,
          requests: 100,
          windowMs: 900000,
        },
      },
      storage: {
        provider: 's3',
        bucket: 'json-files',
        region: 'us-east-1',
        maxFileSize: 10485760,
      },
    },
  },

  // Analytics/metrics data
  analytics: {
    name: 'analytics-data',
    content: {
      period: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
      },
      overview: {
        totalUsers: 15420,
        newUsers: 2340,
        activeUsers: 8901,
        totalSessions: 42350,
        avgSessionDuration: 324,
        bounceRate: 0.34,
      },
      traffic: {
        sources: [
          { source: 'direct', sessions: 18400, percentage: 43.5 },
          { source: 'organic', sessions: 12800, percentage: 30.2 },
          { source: 'social', sessions: 6900, percentage: 16.3 },
          { source: 'referral', sessions: 4250, percentage: 10.0 },
        ],
        devices: [
          { device: 'mobile', sessions: 25420, percentage: 60.0 },
          { device: 'desktop', sessions: 14800, percentage: 35.0 },
          { device: 'tablet', sessions: 2130, percentage: 5.0 },
        ],
      },
      features: {
        viewerUsage: {
          treeView: { uses: 28500, percentage: 67.3 },
          listView: { uses: 9800, percentage: 23.1 },
          flowView: { uses: 4050, percentage: 9.6 },
        },
        fileUploads: 8750,
        publicShares: 1250,
        libraryPublications: 340,
      },
      performance: {
        avgLoadTime: 1.24,
        avgProcessingTime: 0.85,
        errorRate: 0.002,
        uptime: 99.97,
      },
    },
  },

  // Invalid JSON strings for error testing
  invalid: {
    name: 'invalid-json',
    samples: [
      '{"incomplete": true',
      '{"trailing": "comma",}',
      '{duplicate: "key", duplicate: "value"}',
      '{"unquoted": key}',
      "{'single': 'quotes'}",
      '{"escaped": "quotes\\""}',
      '{broken json}',
      '',
      'undefined',
      'null',
      'true',
      '"just a string"',
      '123',
      '[1, 2, 3,]',
    ],
  },
};

// Helper function to get stringified version of any sample
export function stringifyJSON(sample: any): string {
  return JSON.stringify(sample.content || sample, null, 2);
}

// Helper function to get minified JSON
export function minifyJSON(sample: any): string {
  return JSON.stringify(sample.content || sample);
}

// Helper function to create large JSON for stress testing
export function generateLargeJSON(objectCount = 1000, nestingDepth = 5, arraySize = 100) {
  return {
    metadata: {
      generated: new Date().toISOString(),
      objectCount,
      nestingDepth,
      arraySize,
    },
    data: Array.from({ length: objectCount }, (_, i) => ({
      id: `obj_${i}`,
      index: i,
      name: `Object ${i}`,
      active: i % 2 === 0,
      score: Math.random() * 100,
      category: `category_${i % 10}`,
      tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => `tag_${j}`),
      nested: createNestedObject(nestingDepth, i),
      values: Array.from({ length: arraySize }, (_, k) => Math.floor(Math.random() * 1000)),
    })),
  };
}

function createNestedObject(depth: number, seed: number): any {
  if (depth <= 0) {
    return { value: `leaf_${seed}`, depth: 0 };
  }

  return {
    level: depth,
    id: `nested_${depth}_${seed}`,
    data: createNestedObject(depth - 1, seed),
    siblings: Array.from({ length: 3 }, (_, i) => ({
      id: `sibling_${depth}_${i}_${seed}`,
      value: Math.random() * depth * seed,
    })),
  };
}
