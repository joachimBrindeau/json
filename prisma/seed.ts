import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.jsonAnalytics.deleteMany();
  await prisma.jsonChunk.deleteMany();
  await prisma.jsonSession.deleteMany();
  await prisma.jsonDocument.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationToken.deleteMany();
  console.log('✅ Database cleaned\n');

  // Create test users
  console.log('👤 Creating test users...');
  
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  const users = [
    {
      email: 'admin@jsonviewer.app',
      name: 'Admin User',
      password: hashedPassword,
    },
    {
      email: 'test@jsonviewer.app',
      name: 'Test User',
      password: hashedPassword,
    },
    {
      email: 'demo@jsonviewer.app',
      name: 'Demo User',
      password: hashedPassword,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`  ✅ Created user: ${user.email}`);
  }

  // Create sample JSON documents
  console.log('\n📄 Creating sample JSON documents...');
  
  const sampleDocs = [
    {
      title: 'Sample API Response',
      description: 'Example REST API response with user data',
      content: {
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'moderator' },
          ],
          pagination: {
            page: 1,
            totalPages: 10,
            totalItems: 100,
          },
        },
        timestamp: new Date().toISOString(),
      },
      visibility: 'public',
      tags: ['api', 'sample', 'users'],
      category: 'API Response',
    },
    {
      title: 'Configuration File',
      description: 'Application configuration example',
      content: {
        app: {
          name: 'JSON Viewer',
          version: '1.0.0',
          environment: 'development',
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'json_viewer',
        },
        features: {
          authentication: true,
          sharing: true,
          export: ['json', 'csv', 'xml'],
        },
        settings: {
          maxUploadSize: '10MB',
          sessionTimeout: 3600,
          theme: 'auto',
        },
      },
      visibility: 'public',
      tags: ['config', 'settings', 'example'],
      category: 'Configuration',
    },
    {
      title: 'Package.json Example',
      description: 'Node.js package configuration',
      content: {
        name: 'my-awesome-app',
        version: '2.1.0',
        description: 'An awesome application built with Node.js',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest',
          build: 'webpack',
        },
        dependencies: {
          express: '^4.18.0',
          mongoose: '^7.0.0',
          dotenv: '^16.0.0',
        },
        devDependencies: {
          nodemon: '^3.0.0',
          jest: '^29.0.0',
          webpack: '^5.0.0',
        },
      },
      visibility: 'public',
      tags: ['nodejs', 'package', 'npm'],
      category: 'Package Management',
    },
    {
      title: 'Nested Data Structure',
      description: 'Complex nested JSON example',
      content: {
        company: {
          name: 'Tech Corp',
          founded: 2010,
          departments: [
            {
              name: 'Engineering',
              employees: 150,
              teams: [
                { name: 'Frontend', size: 30, tech: ['React', 'Vue', 'Angular'] },
                { name: 'Backend', size: 40, tech: ['Node.js', 'Python', 'Go'] },
                { name: 'DevOps', size: 20, tech: ['Docker', 'Kubernetes', 'AWS'] },
              ],
            },
            {
              name: 'Marketing',
              employees: 50,
              campaigns: [
                { name: 'Summer Sale', budget: 50000, roi: 2.5 },
                { name: 'Product Launch', budget: 100000, roi: 3.2 },
              ],
            },
          ],
          locations: {
            headquarters: {
              city: 'San Francisco',
              country: 'USA',
              employees: 500,
            },
            branches: [
              { city: 'London', country: 'UK', employees: 200 },
              { city: 'Tokyo', country: 'Japan', employees: 150 },
            ],
          },
        },
      },
      visibility: 'public',
      tags: ['nested', 'complex', 'organization'],
      category: 'Data Structure',
    },
    {
      title: 'GraphQL Schema',
      description: 'Sample GraphQL type definitions',
      content: {
        schema: {
          types: {
            User: {
              fields: {
                id: 'ID!',
                name: 'String!',
                email: 'String!',
                posts: '[Post!]!',
                createdAt: 'DateTime!',
              },
            },
            Post: {
              fields: {
                id: 'ID!',
                title: 'String!',
                content: 'String!',
                author: 'User!',
                comments: '[Comment!]!',
                published: 'Boolean!',
              },
            },
            Comment: {
              fields: {
                id: 'ID!',
                text: 'String!',
                author: 'User!',
                post: 'Post!',
                createdAt: 'DateTime!',
              },
            },
          },
          queries: {
            user: { args: { id: 'ID!' }, returns: 'User' },
            users: { returns: '[User!]!' },
            post: { args: { id: 'ID!' }, returns: 'Post' },
            posts: { args: { published: 'Boolean' }, returns: '[Post!]!' },
          },
          mutations: {
            createUser: {
              args: { name: 'String!', email: 'String!' },
              returns: 'User!',
            },
            createPost: {
              args: { title: 'String!', content: 'String!', authorId: 'ID!' },
              returns: 'Post!',
            },
          },
        },
      },
      visibility: 'public',
      tags: ['graphql', 'schema', 'api'],
      category: 'GraphQL',
    },
  ];

  const testUser = await prisma.user.findUnique({
    where: { email: 'test@jsonviewer.app' },
  });

  for (const docData of sampleDocs) {
    const doc = await prisma.jsonDocument.create({
      data: {
        title: docData.title,
        description: docData.description,
        content: docData.content as any,
        visibility: docData.visibility,
        tags: docData.tags,
        category: docData.category,
        size: BigInt(JSON.stringify(docData.content).length),
        nodeCount: JSON.stringify(docData.content).split(',').length,
        maxDepth: 4,
        complexity: 'Medium',
        userId: testUser?.id,
        isAnonymous: false,
        publishedAt: new Date(),
      },
    });
    console.log(`  ✅ Created document: ${doc.title}`);
  }

  // Create some private documents for the test user
  if (testUser) {
    console.log('\n🔒 Creating private documents for test user...');
    
    const privateDocs = [
      {
        title: 'My Private Notes',
        content: { notes: ['Remember to update API keys', 'Review security settings'] },
        visibility: 'private',
      },
      {
        title: 'Personal Config',
        content: { settings: { theme: 'dark', notifications: true } },
        visibility: 'private',
      },
    ];

    for (const docData of privateDocs) {
      const doc = await prisma.jsonDocument.create({
        data: {
          title: docData.title,
          content: docData.content as any,
          visibility: docData.visibility,
          size: BigInt(JSON.stringify(docData.content).length),
          nodeCount: 2,
          maxDepth: 2,
          complexity: 'Low',
          userId: testUser.id,
          isAnonymous: false,
        },
      });
      console.log(`  ✅ Created private document: ${doc.title}`);
    }
  }

  console.log('\n✨ Database seeding completed successfully!\n');
  
  // Print summary
  const userCount = await prisma.user.count();
  const docCount = await prisma.jsonDocument.count();
  const publicDocs = await prisma.jsonDocument.count({ where: { visibility: 'public' } });
  const privateDocs = await prisma.jsonDocument.count({ where: { visibility: 'private' } });
  
  console.log('📊 Summary:');
  console.log(`  - Users created: ${userCount}`);
  console.log(`  - Documents created: ${docCount}`);
  console.log(`    • Public: ${publicDocs}`);
  console.log(`    • Private: ${privateDocs}`);
  console.log('\n🔑 Test Credentials:');
  console.log('  Email: test@jsonviewer.app');
  console.log('  Password: TestPassword123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });