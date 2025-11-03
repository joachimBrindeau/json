/**
 * Data Generator Utility
 *
 * Enhanced with JSON Schema Faker for realistic data generation.
 * Combines custom generators with schema-based generation.
 */

import { generate, schemas, generateFromSchema } from './json-schema-generator';
import { advancedSchemas } from './advanced-schemas';

export class DataGenerator {
  /**
   * Generate simple JSON objects for basic testing
   */
  generateSimpleJSON() {
    return {
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
        profile: {
          age: 30,
          city: 'New York',
          interests: ['reading', 'coding', 'music'],
        },
      },
    };
  }

  /**
   * Generate complex nested JSON with multiple data types
   */
  generateComplexJSON() {
    return {
      metadata: {
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        source: 'test-data-generator',
        environment: 'testing',
      },
      data: {
        users: [
          {
            id: 'usr_001',
            personal: {
              firstName: 'Alice',
              lastName: 'Johnson',
              dateOfBirth: '1990-05-15',
              contacts: {
                email: 'alice@example.com',
                phone: '+1-555-0123',
                addresses: [
                  {
                    type: 'home',
                    street: '123 Main St',
                    city: 'Springfield',
                    state: 'IL',
                    zipCode: '62701',
                    coordinates: {
                      lat: 39.7817,
                      lng: -89.6501,
                    },
                  },
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
              privacy: {
                profileVisibility: 'friends',
                activityTracking: false,
              },
            },
            activity: {
              lastLogin: new Date(Date.now() - 86400000).toISOString(),
              totalSessions: 245,
              averageSessionDuration: 1847,
              purchaseHistory: [
                {
                  orderId: 'ord_12345',
                  date: '2024-01-15',
                  total: 89.99,
                  items: [
                    { id: 'item_001', name: 'Widget A', quantity: 2, price: 29.99 },
                    { id: 'item_002', name: 'Widget B', quantity: 1, price: 30.01 },
                  ],
                },
              ],
            },
          },
        ],
        analytics: {
          pageViews: 15420,
          uniqueVisitors: 8901,
          bounceRate: 0.34,
          topPages: [
            { path: '/dashboard', views: 3421, avgTime: 245 },
            { path: '/profile', views: 2876, avgTime: 189 },
            { path: '/settings', views: 1654, avgTime: 301 },
          ],
          deviceBreakdown: {
            mobile: 0.62,
            desktop: 0.31,
            tablet: 0.07,
          },
        },
        configuration: {
          features: {
            betaFeatures: ['newUI', 'aiAssistant'],
            experimentGroups: {
              exp_001: { name: 'Button Color Test', variant: 'blue' },
              exp_002: { name: 'Layout Test', variant: 'sidebar' },
            },
          },
          limits: {
            maxFileSize: 10485760,
            maxUploads: 100,
            rateLimiting: {
              requests: 1000,
              windowMs: 3600000,
            },
          },
        },
      },
      status: {
        healthy: true,
        services: {
          database: { status: 'online', latency: 23 },
          cache: { status: 'online', latency: 5 },
          storage: { status: 'online', latency: 45 },
        },
      },
    };
  }

  /**
   * Generate large JSON for performance testing with items
   */
  generateLargeJSONWithItems(itemCount = 1000) {
    const items = [];

    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: `item_${i.toString().padStart(6, '0')}`,
        type: this.randomChoice(['product', 'service', 'digital', 'physical']),
        name: `Test Item ${i}`,
        description: `This is a test item with ID ${i}. `.repeat(Math.floor(Math.random() * 5) + 1),
        price: Math.round(Math.random() * 10000) / 100,
        inStock: Math.random() > 0.3,
        category: {
          primary: this.randomChoice(['Electronics', 'Clothing', 'Home', 'Books', 'Sports']),
          secondary: this.randomChoice(['Subcategory A', 'Subcategory B', 'Subcategory C']),
          tags: this.generateRandomArray(['tag1', 'tag2', 'tag3', 'tag4', 'tag5'], 2, 4),
        },
        specifications: {
          weight: Math.round(Math.random() * 1000) / 100,
          dimensions: {
            length: Math.round(Math.random() * 100),
            width: Math.round(Math.random() * 100),
            height: Math.round(Math.random() * 100),
            unit: 'cm',
          },
          colors: this.generateRandomArray(
            ['red', 'blue', 'green', 'yellow', 'black', 'white'],
            1,
            3
          ),
          materials: this.generateRandomArray(
            ['cotton', 'polyester', 'metal', 'plastic', 'wood'],
            1,
            2
          ),
        },
        reviews: this.generateReviews(Math.floor(Math.random() * 20)),
        metadata: {
          created: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
          updated: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          viewCount: Math.floor(Math.random() * 1000),
          rating: Math.round(Math.random() * 50) / 10,
        },
      });
    }

    return {
      meta: {
        total: itemCount,
        generated: new Date().toISOString(),
        version: '1.0.0',
      },
      items,
    };
  }

  /**
   * Generate deeply nested JSON for testing recursion handling
   */
  generateDeeplyNestedJSON(maxDepth = 10) {
    const createNestedLevel = (currentDepth: number): any => {
      if (currentDepth >= maxDepth) {
        return {
          depth: currentDepth,
          value: `Leaf node at depth ${currentDepth}`,
          isLeaf: true,
        };
      }

      return {
        depth: currentDepth,
        children: {
          left: createNestedLevel(currentDepth + 1),
          center: createNestedLevel(currentDepth + 1),
          right: createNestedLevel(currentDepth + 1),
        },
        metadata: {
          level: currentDepth,
          hasChildren: true,
          path: Array.from({ length: currentDepth }, (_, i) => `level_${i}`).join('.'),
        },
        data: {
          id: `node_${currentDepth}`,
          name: `Node at level ${currentDepth}`,
          properties: Array.from({ length: 5 }, (_, i) => ({
            key: `prop_${i}`,
            value: `Value ${i} at depth ${currentDepth}`,
          })),
        },
      };
    };

    return {
      root: createNestedLevel(0),
      info: {
        maxDepth,
        totalNodes: Math.pow(3, maxDepth + 1) - 1,
        generated: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate array-heavy JSON for testing array handling
   */
  generateArrayHeavyJSON() {
    return {
      datasets: [
        {
          name: 'Sales Data',
          type: 'timeseries',
          data: Array.from({ length: 365 }, (_, i) => ({
            date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
            value: Math.round(Math.random() * 10000),
            category: this.randomChoice(['A', 'B', 'C', 'D']),
          })),
        },
        {
          name: 'User Metrics',
          type: 'categorical',
          data: [
            {
              category: 'Mobile Users',
              values: Array.from({ length: 12 }, () => Math.floor(Math.random() * 1000)),
            },
            {
              category: 'Desktop Users',
              values: Array.from({ length: 12 }, () => Math.floor(Math.random() * 800)),
            },
            {
              category: 'Tablet Users',
              values: Array.from({ length: 12 }, () => Math.floor(Math.random() * 200)),
            },
          ],
        },
      ],
      matrix: Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => ({
          row,
          col,
          value: Math.random(),
        }))
      ),
      coordinates: Array.from({ length: 100 }, () => [
        Math.random() * 180 - 90, // latitude
        Math.random() * 360 - 180, // longitude
      ]),
    };
  }

  /**
   * Generate JSON with various edge cases and special values
   */
  generateEdgeCaseJSON() {
    return {
      nullValue: null,
      undefinedValue: undefined,
      emptyString: '',
      emptyArray: [],
      emptyObject: {},
      specialNumbers: {
        zero: 0,
        negative: -42,
        float: 3.14159,
        scientific: 1.23e-10,
        infinity: Infinity,
        negativeInfinity: -Infinity,
        notANumber: NaN,
      },
      specialStrings: {
        unicodeString: 'Hello 🌍! This is a test with émojis and spéciàl characters',
        longString: 'A'.repeat(1000),
        jsonString: '{"nested": "json", "as": "string"}',
        htmlString: '<div class="test">HTML content</div>',
        sqlInjection: "'; DROP TABLE users; --",
        scriptTag: '<script>alert("xss")</script>',
      },
      booleans: {
        trueValue: true,
        falseValue: false,
      },
      dates: {
        isoString: new Date().toISOString(),
        timestamp: Date.now(),
        dateString: new Date().toDateString(),
      },
      mixedArray: [1, 'string', true, null, { nested: 'object' }, [1, 2, 3], undefined],
    };
  }

  /**
   * Generate JSON with circular reference (needs to be handled carefully)
   */
  generateCircularJSON() {
    const obj: any = {
      id: 'root',
      name: 'Circular Test',
    };

    // Create circular reference (this will need special handling in tests)
    obj.self = obj;
    obj.deep = { reference: obj };

    return obj;
  }

  /**
   * Generate API response-like JSON
   */
  generateAPIResponseJSON() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substring(2, 15)}`,
      data: {
        users: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          username: `user${i + 1}`,
          email: `user${i + 1}@example.com`,
          firstName: this.randomChoice(['John', 'Jane', 'Alice', 'Bob', 'Carol']),
          lastName: this.randomChoice(['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson']),
          active: Math.random() > 0.2,
          role: this.randomChoice(['admin', 'user', 'moderator']),
          createdAt: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
        })),
      },
      pagination: {
        page: 1,
        limit: 25,
        total: 250,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      },
      meta: {
        version: '2.0',
        documentation: 'https://api.example.com/docs',
        rateLimiting: {
          remaining: 995,
          reset: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    };
  }

  // Helper methods
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateRandomArray<T>(items: T[], minLength: number, maxLength: number): T[] {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(this.randomChoice(items));
    }
    return Array.from(new Set(result)); // Remove duplicates
  }

  private generateReviews(count: number) {
    const reviewTexts = [
      'Great product! Highly recommended.',
      'Good quality but could be better.',
      'Exactly what I was looking for.',
      'Not worth the price in my opinion.',
      'Amazing! Will definitely buy again.',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `review_${i}`,
      rating: Math.ceil(Math.random() * 5),
      text: this.randomChoice(reviewTexts),
      author: `User${i + 1}`,
      date: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
      helpful: Math.floor(Math.random() * 20),
    }));
  }

  /**
   * Generate user data for account creation and testing
   */
  generateUserData() {
    const firstNames = [
      'John',
      'Jane',
      'Alice',
      'Bob',
      'Carol',
      'David',
      'Emma',
      'Frank',
      'Grace',
      'Henry',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Brown',
      'Davis',
      'Wilson',
      'Miller',
      'Moore',
      'Taylor',
      'Anderson',
      'Thomas',
    ];

    const firstName = this.randomChoice(firstNames);
    const lastName = this.randomChoice(lastNames);
    const randomId = Math.random().toString(36).substring(2, 8);

    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomId}@jsonshare.test`,
      password: 'TestPassword123!',
      firstName,
      lastName,
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomId}`,
    };
  }

  /**
   * Generate large JSON with specific parameters
   */
  generateLargeJSON(objectCount = 1000, nestingDepth = 5, arraySize = 100) {
    const createNestedObject = (depth: number, seed: number): any => {
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
    };

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

  /**
   * Generate malformed JSON strings for error testing
   */
  generateMalformedJSON() {
    return [
      '{"incomplete": true', // Missing closing brace
      '{"trailing": "comma",}', // Trailing comma
      '{duplicate: "key", duplicate: "value"}', // Duplicate keys
      '{"unquoted": key}', // Unquoted key
      "{'single': 'quotes'}", // Single quotes
      '{"escaped": "quotes\\""}', // Incorrect escaping
      '{broken json}', // Completely invalid
      '', // Empty string
      'null', // Valid JSON but just null
      'undefined', // Not valid JSON
    ];
  }

  // ============================================================================
  // JSON Schema Faker Methods (New - More Realistic Data)
  // ============================================================================

  /**
   * Generate realistic user data using JSON Schema Faker
   */
  generateRealisticUser() {
    return generate.user();
  }

  /**
   * Generate multiple realistic users
   */
  generateRealisticUsers(count: number = 10) {
    return generate.users(count);
  }

  /**
   * Generate realistic product data
   */
  generateRealisticProduct() {
    return generate.product();
  }

  /**
   * Generate multiple realistic products
   */
  generateRealisticProducts(count: number = 10) {
    return generate.products(count);
  }

  /**
   * Generate realistic API response with pagination
   */
  generateRealisticAPIResponse() {
    return generate.apiResponse();
  }

  /**
   * Generate deeply nested structure for tree view testing
   */
  generateRealisticDeepNesting() {
    return generate.deeplyNested();
  }

  /**
   * Generate mixed types for type detection testing
   */
  generateRealisticMixedTypes() {
    return generate.mixedTypes();
  }

  /**
   * Generate social media post
   */
  generateSocialPost() {
    return generateFromSchema(advancedSchemas.socialPost);
  }

  /**
   * Generate financial transaction
   */
  generateTransaction() {
    return generateFromSchema(advancedSchemas.transaction);
  }

  /**
   * Generate IoT sensor data
   */
  generateSensorData() {
    return generateFromSchema(advancedSchemas.sensorData);
  }

  /**
   * Generate configuration object
   */
  generateConfiguration() {
    return generateFromSchema(advancedSchemas.configuration);
  }

  /**
   * Generate large dataset for performance testing
   */
  generateLargeRealisticDataset() {
    return generateFromSchema(advancedSchemas.largeDataset);
  }

  /**
   * Generate custom JSON from a schema
   */
  generateFromCustomSchema(schema: any) {
    return generateFromSchema(schema);
  }
}
