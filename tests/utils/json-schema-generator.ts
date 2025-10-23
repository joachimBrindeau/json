/**
 * JSON Schema Faker Generator
 *
 * Generates realistic fake JSON data using JSON Schema definitions.
 * Perfect for testing the JSON Viewer with varied, complex structures.
 */

import jsf from 'json-schema-faker';
import { faker } from '@faker-js/faker';
import Chance from 'chance';

// Configure JSON Schema Faker
jsf.extend('faker', () => faker);
jsf.extend('chance', () => new Chance());

// Set options for more realistic data
jsf.option({
  alwaysFakeOptionals: true,
  useDefaultValue: true,
  useExamplesValue: false,
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  maxItems: 20,
  maxLength: 100,
  random: Math.random,
});

/**
 * JSON Schema definitions for common test scenarios
 */
export const schemas = {
  /**
   * Simple user object
   */
  user: {
    type: 'object',
    properties: {
      id: { type: 'string', faker: 'string.uuid' },
      name: { type: 'string', faker: 'person.fullName' },
      email: { type: 'string', format: 'email' },
      username: { type: 'string', faker: 'internet.userName' },
      avatar: { type: 'string', faker: 'image.avatar' },
      bio: { type: 'string', faker: 'lorem.paragraph' },
      website: { type: 'string', format: 'uri' },
      phone: { type: 'string', faker: 'phone.number' },
      birthdate: { type: 'string', format: 'date' },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string', faker: 'location.streetAddress' },
          city: { type: 'string', faker: 'location.city' },
          state: { type: 'string', faker: 'location.state' },
          country: { type: 'string', faker: 'location.country' },
          zipCode: { type: 'string', faker: 'location.zipCode' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number', faker: 'location.latitude' },
              lng: { type: 'number', faker: 'location.longitude' },
            },
            required: ['lat', 'lng'],
          },
        },
      },
      company: {
        type: 'object',
        properties: {
          name: { type: 'string', faker: 'company.name' },
          catchPhrase: { type: 'string', faker: 'company.catchPhrase' },
          bs: { type: 'string', faker: 'company.buzzPhrase' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'email'],
  },

  /**
   * E-commerce product
   */
  product: {
    type: 'object',
    properties: {
      id: { type: 'string', faker: 'string.uuid' },
      sku: { type: 'string', faker: 'string.alphanumeric', minLength: 8, maxLength: 12 },
      name: { type: 'string', faker: 'commerce.productName' },
      description: { type: 'string', faker: 'commerce.productDescription' },
      price: { type: 'number', minimum: 0.99, maximum: 9999.99, faker: 'commerce.price' },
      currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY'] },
      category: { type: 'string', faker: 'commerce.department' },
      tags: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: { type: 'string', faker: 'commerce.productAdjective' },
      },
      images: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: { type: 'string', faker: 'image.url' },
      },
      inStock: { type: 'boolean' },
      stockQuantity: { type: 'integer', minimum: 0, maximum: 1000 },
      rating: { type: 'number', minimum: 0, maximum: 5 },
      reviews: {
        type: 'array',
        minItems: 0,
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', faker: 'string.uuid' },
            author: { type: 'string', faker: 'person.fullName' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', faker: 'lorem.paragraph' },
            date: { type: 'string', format: 'date-time' },
          },
        },
      },
      dimensions: {
        type: 'object',
        properties: {
          length: { type: 'number', minimum: 1, maximum: 100 },
          width: { type: 'number', minimum: 1, maximum: 100 },
          height: { type: 'number', minimum: 1, maximum: 100 },
          unit: { type: 'string', enum: ['cm', 'in', 'm'] },
        },
      },
      weight: {
        type: 'object',
        properties: {
          value: { type: 'number', minimum: 0.1, maximum: 1000 },
          unit: { type: 'string', enum: ['kg', 'lb', 'g', 'oz'] },
        },
      },
    },
    required: ['id', 'name', 'price'],
  },

  /**
   * API response with pagination
   * Note: Inlines user schema to avoid circular dependency
   */
  apiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      timestamp: { type: 'string', format: 'date-time' },
      requestId: { type: 'string', faker: 'string.uuid' },
      data: {
        type: 'array',
        minItems: 10,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', faker: 'string.uuid' },
            name: { type: 'string', faker: 'person.fullName' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string', faker: 'internet.userName' },
          },
          required: ['id', 'name', 'email'],
        },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, maximum: 100 },
          limit: { type: 'integer', minimum: 10, maximum: 100 },
          total: { type: 'integer', minimum: 100, maximum: 10000 },
          totalPages: { type: 'integer', minimum: 1, maximum: 1000 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      meta: {
        type: 'object',
        properties: {
          version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
          environment: { type: 'string', enum: ['development', 'staging', 'production'] },
        },
      },
    },
  },

  /**
   * Deeply nested structure for testing tree view
   */
  deeplyNested: {
    type: 'object',
    properties: {
      level1: {
        type: 'object',
        properties: {
          id: { type: 'string', faker: 'string.uuid' },
          data: { type: 'string', faker: 'lorem.sentence' },
          level2: {
            type: 'object',
            properties: {
              id: { type: 'string', faker: 'string.uuid' },
              data: { type: 'string', faker: 'lorem.sentence' },
              level3: {
                type: 'object',
                properties: {
                  id: { type: 'string', faker: 'string.uuid' },
                  data: { type: 'string', faker: 'lorem.sentence' },
                  level4: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', faker: 'string.uuid' },
                      data: { type: 'string', faker: 'lorem.sentence' },
                      level5: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', faker: 'string.uuid' },
                          data: { type: 'string', faker: 'lorem.sentence' },
                          values: {
                            type: 'array',
                            minItems: 5,
                            maxItems: 10,
                            items: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  /**
   * Mixed types array for testing type detection
   */
  mixedTypes: {
    type: 'object',
    properties: {
      strings: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'string', faker: 'lorem.word' },
      },
      numbers: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'number', minimum: -1000, maximum: 1000 },
      },
      booleans: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'boolean' },
      },
      nulls: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: { type: 'null' },
      },
      dates: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'string', format: 'date-time' },
      },
      urls: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'string', format: 'uri' },
      },
      emails: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'string', format: 'email' },
      },
      colors: {
        type: 'array',
        minItems: 5,
        maxItems: 10,
        items: { type: 'string', faker: 'color.rgb' },
      },
    },
  },
};

/**
 * Generate fake JSON from a schema
 */
export function generateFromSchema(schema: any): any {
  return jsf.generate(schema);
}

/**
 * Generate multiple samples from a schema
 */
export function generateMultiple(schema: any, count: number): any[] {
  return Array.from({ length: count }, () => jsf.generate(schema));
}

/**
 * Convenience functions for common schemas
 */
export const generate = {
  user: () => generateFromSchema(schemas.user),
  users: (count: number = 10) => generateMultiple(schemas.user, count),
  product: () => generateFromSchema(schemas.product),
  products: (count: number = 10) => generateMultiple(schemas.product, count),
  apiResponse: () => generateFromSchema(schemas.apiResponse),
  deeplyNested: () => generateFromSchema(schemas.deeplyNested),
  mixedTypes: () => generateFromSchema(schemas.mixedTypes),
};

const jsonSchemaGenerator = {
  schemas,
  generate,
  generateFromSchema,
  generateMultiple,
  jsf,
};

export default jsonSchemaGenerator;
