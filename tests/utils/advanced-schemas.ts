/**
 * Advanced JSON Schema definitions for complex testing scenarios
 */

export const advancedSchemas = {
  /**
   * Large dataset for performance testing
   */
  largeDataset: {
    type: 'object',
    properties: {
      metadata: {
        type: 'object',
        properties: {
          generated: { type: 'string', format: 'date-time' },
          totalRecords: { type: 'integer', minimum: 1000, maximum: 10000 },
          version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        },
      },
      records: {
        type: 'array',
        minItems: 100,
        maxItems: 1000,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', faker: 'string.uuid' },
            timestamp: { type: 'string', format: 'date-time' },
            value: { type: 'number', minimum: -1000, maximum: 1000 },
            status: { type: 'string', enum: ['active', 'inactive', 'pending', 'archived'] },
            tags: {
              type: 'array',
              minItems: 0,
              maxItems: 5,
              items: { type: 'string', faker: 'lorem.word' },
            },
          },
        },
      },
    },
  },

  /**
   * Social media post with rich content
   */
  socialPost: {
    type: 'object',
    properties: {
      id: { type: 'string', faker: 'string.uuid' },
      author: {
        type: 'object',
        properties: {
          id: { type: 'string', faker: 'string.uuid' },
          username: { type: 'string', faker: 'internet.userName' },
          displayName: { type: 'string', faker: 'person.fullName' },
          avatar: { type: 'string', faker: 'image.avatar' },
          verified: { type: 'boolean' },
          followers: { type: 'integer', minimum: 0, maximum: 1000000 },
        },
      },
      content: {
        type: 'object',
        properties: {
          text: { type: 'string', faker: 'lorem.paragraphs' },
          hashtags: {
            type: 'array',
            minItems: 0,
            maxItems: 10,
            items: { type: 'string', faker: 'lorem.word' },
          },
          mentions: {
            type: 'array',
            minItems: 0,
            maxItems: 5,
            items: { type: 'string', faker: 'internet.userName' },
          },
          media: {
            type: 'array',
            minItems: 0,
            maxItems: 4,
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['image', 'video', 'gif'] },
                url: { type: 'string', faker: 'image.url' },
                thumbnail: { type: 'string', faker: 'image.url' },
                width: { type: 'integer', minimum: 100, maximum: 4000 },
                height: { type: 'integer', minimum: 100, maximum: 4000 },
              },
            },
          },
          links: {
            type: 'array',
            minItems: 0,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' },
                title: { type: 'string', faker: 'lorem.sentence' },
                description: { type: 'string', faker: 'lorem.paragraph' },
                image: { type: 'string', faker: 'image.url' },
              },
            },
          },
        },
      },
      engagement: {
        type: 'object',
        properties: {
          likes: { type: 'integer', minimum: 0, maximum: 100000 },
          retweets: { type: 'integer', minimum: 0, maximum: 50000 },
          replies: { type: 'integer', minimum: 0, maximum: 10000 },
          views: { type: 'integer', minimum: 0, maximum: 1000000 },
        },
      },
      location: {
        type: 'object',
        properties: {
          name: { type: 'string', faker: 'location.city' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number', faker: 'location.latitude' },
              lng: { type: 'number', faker: 'location.longitude' },
            },
          },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      editedAt: { type: 'string', format: 'date-time' },
    },
  },

  /**
   * Financial transaction
   */
  transaction: {
    type: 'object',
    properties: {
      id: { type: 'string', faker: 'string.uuid' },
      transactionId: { type: 'string', faker: 'finance.accountNumber' },
      type: { type: 'string', enum: ['debit', 'credit', 'transfer', 'refund'] },
      status: { type: 'string', enum: ['pending', 'completed', 'failed', 'cancelled'] },
      amount: {
        type: 'object',
        properties: {
          value: { type: 'number', minimum: 0.01, maximum: 100000 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'] },
        },
      },
      from: {
        type: 'object',
        properties: {
          accountId: { type: 'string', faker: 'finance.accountNumber' },
          accountName: { type: 'string', faker: 'finance.accountName' },
          bankName: { type: 'string', faker: 'company.name' },
          routingNumber: { type: 'string', faker: 'finance.routingNumber' },
        },
      },
      to: {
        type: 'object',
        properties: {
          accountId: { type: 'string', faker: 'finance.accountNumber' },
          accountName: { type: 'string', faker: 'finance.accountName' },
          bankName: { type: 'string', faker: 'company.name' },
          routingNumber: { type: 'string', faker: 'finance.routingNumber' },
        },
      },
      description: { type: 'string', faker: 'lorem.sentence' },
      category: { type: 'string', faker: 'commerce.department' },
      tags: {
        type: 'array',
        minItems: 0,
        maxItems: 5,
        items: { type: 'string', faker: 'lorem.word' },
      },
      metadata: {
        type: 'object',
        properties: {
          ipAddress: { type: 'string', faker: 'internet.ip' },
          userAgent: { type: 'string', faker: 'internet.userAgent' },
          deviceId: { type: 'string', faker: 'string.uuid' },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string', faker: 'location.city' },
              country: { type: 'string', faker: 'location.country' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number', faker: 'location.latitude' },
                  lng: { type: 'number', faker: 'location.longitude' },
                },
              },
            },
          },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      processedAt: { type: 'string', format: 'date-time' },
    },
  },

  /**
   * IoT sensor data
   */
  sensorData: {
    type: 'object',
    properties: {
      deviceId: { type: 'string', faker: 'string.uuid' },
      deviceName: { type: 'string', faker: 'commerce.productName' },
      deviceType: { type: 'string', enum: ['temperature', 'humidity', 'pressure', 'motion', 'light'] },
      location: {
        type: 'object',
        properties: {
          building: { type: 'string', faker: 'location.street' },
          floor: { type: 'integer', minimum: 1, maximum: 50 },
          room: { type: 'string', pattern: '^[A-Z]\\d{3}$' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number', faker: 'location.latitude' },
              lng: { type: 'number', faker: 'location.longitude' },
            },
          },
        },
      },
      readings: {
        type: 'array',
        minItems: 10,
        maxItems: 100,
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            value: { type: 'number', minimum: -50, maximum: 150 },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit', 'percent', 'pascal', 'lux'] },
            quality: { type: 'string', enum: ['good', 'fair', 'poor'] },
          },
        },
      },
      status: {
        type: 'object',
        properties: {
          online: { type: 'boolean' },
          battery: { type: 'integer', minimum: 0, maximum: 100 },
          signalStrength: { type: 'integer', minimum: -100, maximum: 0 },
          lastSeen: { type: 'string', format: 'date-time' },
        },
      },
      alerts: {
        type: 'array',
        minItems: 0,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', faker: 'string.uuid' },
            severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
            message: { type: 'string', faker: 'lorem.sentence' },
            timestamp: { type: 'string', format: 'date-time' },
            acknowledged: { type: 'boolean' },
          },
        },
      },
    },
  },

  /**
   * Configuration object with all JSON types
   */
  configuration: {
    type: 'object',
    properties: {
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
      environment: { type: 'string', enum: ['development', 'staging', 'production'] },
      features: {
        type: 'object',
        properties: {
          authentication: { type: 'boolean' },
          analytics: { type: 'boolean' },
          notifications: { type: 'boolean' },
          darkMode: { type: 'boolean' },
        },
      },
      limits: {
        type: 'object',
        properties: {
          maxUsers: { type: 'integer', minimum: 100, maximum: 100000 },
          maxFileSize: { type: 'integer', minimum: 1048576, maximum: 104857600 },
          rateLimit: { type: 'integer', minimum: 10, maximum: 1000 },
        },
      },
      endpoints: {
        type: 'object',
        properties: {
          api: { type: 'string', format: 'uri' },
          websocket: { type: 'string', format: 'uri' },
          cdn: { type: 'string', format: 'uri' },
        },
      },
      database: {
        type: 'object',
        properties: {
          host: { type: 'string', faker: 'internet.domainName' },
          port: { type: 'integer', minimum: 1000, maximum: 65535 },
          name: { type: 'string', faker: 'database.column' },
          ssl: { type: 'boolean' },
          poolSize: { type: 'integer', minimum: 5, maximum: 100 },
        },
      },
      cache: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          ttl: { type: 'integer', minimum: 60, maximum: 86400 },
          maxSize: { type: 'integer', minimum: 100, maximum: 10000 },
        },
      },
      logging: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
          format: { type: 'string', enum: ['json', 'text', 'pretty'] },
          outputs: {
            type: 'array',
            items: { type: 'string', enum: ['console', 'file', 'syslog', 'cloudwatch'] },
          },
        },
      },
    },
  },
};

export default advancedSchemas;

