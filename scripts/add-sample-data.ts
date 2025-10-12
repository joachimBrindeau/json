import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleData() {
  const sampleDocuments = [
    {
      title: 'E-commerce Product Catalog',
      description: 'Sample product data for online store',
      category: 'API Response',
      tags: ['ecommerce', 'product', 'catalog'],
      content: {
        products: [
          { id: 1, name: 'Laptop', price: 999.99, inStock: true },
          { id: 2, name: 'Mouse', price: 29.99, inStock: false },
          { id: 3, name: 'Keyboard', price: 79.99, inStock: true },
        ],
        total: 3,
        page: 1,
        hasMore: false,
      },
    },
    {
      title: 'User Configuration Settings',
      description: 'Application configuration and user preferences',
      category: 'Configuration',
      tags: ['config', 'settings', 'user'],
      content: {
        user: {
          id: '12345',
          preferences: {
            theme: 'dark',
            language: 'en-US',
            timezone: 'America/New_York',
          },
          notifications: {
            email: true,
            push: false,
            sms: true,
          },
          features: ['analytics', 'dashboard', 'export', 'sharing'],
        },
      },
    },
    {
      title: 'Database Schema Example',
      description: 'Sample database table structure with relationships',
      category: 'Database Schema',
      tags: ['database', 'schema', 'relations'],
      content: {
        database: 'ecommerce_db',
        tables: {
          users: {
            columns: {
              id: { type: 'integer', primary: true, autoIncrement: true },
              email: { type: 'varchar(255)', unique: true, nullable: false },
              name: { type: 'varchar(100)', nullable: false },
              created_at: { type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            },
            indexes: ['email', 'created_at'],
          },
          products: {
            columns: {
              id: { type: 'integer', primary: true, autoIncrement: true },
              name: { type: 'varchar(255)', nullable: false },
              price: { type: 'decimal(10,2)', nullable: false },
              category_id: { type: 'integer', foreignKey: 'categories.id' },
            },
            indexes: ['category_id', 'price'],
          },
        },
      },
    },
    {
      title: 'Test Data Set',
      description: 'Sample test data for API testing',
      category: 'Test Data',
      tags: ['testing', 'mock', 'api'],
      content: {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: false },
        ],
        orders: [
          { id: 101, userId: 1, total: 299.99, status: 'shipped' },
          { id: 102, userId: 2, total: 149.5, status: 'pending' },
        ],
      },
    },
    {
      title: 'REST API Response Template',
      description: 'Standard API response format with pagination',
      category: 'Template',
      tags: ['api', 'template', 'response'],
      content: {
        status: 'success',
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        meta: {
          timestamp: '2024-01-01T00:00:00Z',
          version: '1.0.0',
          requestId: 'req_12345',
        },
      },
    },
  ];

  console.log('Adding sample documents to public library...');

  for (const doc of sampleDocuments) {
    const contentString = JSON.stringify(doc.content);
    const size = new TextEncoder().encode(contentString).length;

    // Analyze JSON structure
    function analyzeJson(obj: any): { nodeCount: number; maxDepth: number } {
      let nodeCount = 0;
      let maxDepth = 0;

      function traverse(value: any, depth: number) {
        nodeCount++;
        maxDepth = Math.max(maxDepth, depth);

        if (Array.isArray(value)) {
          value.forEach((item) => traverse(item, depth + 1));
        } else if (value !== null && typeof value === 'object') {
          Object.values(value).forEach((item) => traverse(item, depth + 1));
        }
      }

      traverse(obj, 0);
      return { nodeCount, maxDepth };
    }

    const { nodeCount, maxDepth } = analyzeJson(doc.content);
    const complexity = nodeCount > 100 ? 'High' : nodeCount > 50 ? 'Medium' : 'Low';

    try {
      const document = await prisma.jsonDocument.create({
        data: {
          title: doc.title,
          description: doc.description,
          category: doc.category,
          tags: doc.tags,
          content: doc.content,
          size: BigInt(size),
          nodeCount,
          maxDepth,
          complexity,
          visibility: 'public',
          publishedAt: new Date(),
          isAnonymous: true, // No user associated
        },
      });

      console.log(`✅ Created: ${doc.title} (ID: ${document.id})`);
    } catch (error) {
      console.error(`❌ Failed to create ${doc.title}:`, error);
    }
  }

  console.log('✅ Sample data added successfully!');
}

addSampleData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
