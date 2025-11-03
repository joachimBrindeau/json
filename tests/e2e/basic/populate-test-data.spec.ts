import { test, expect } from '@playwright/test';

test('Populate test data for library', async ({ page, request }) => {
  // Create some sample public JSON documents via API
  const testDocuments = [
    {
      title: 'E-commerce Product Catalog',
      description: 'Sample product data for online store',
      category: 'API Response',
      tags: ['ecommerce', 'product', 'catalog'],
      content: {
        products: [
          { id: 1, name: 'Laptop', price: 999.99, inStock: true },
          { id: 2, name: 'Mouse', price: 29.99, inStock: false },
        ],
        total: 2,
        page: 1,
      },
    },
    {
      title: 'User Configuration',
      description: 'Application configuration settings',
      category: 'Configuration',
      tags: ['config', 'settings', 'app'],
      content: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        features: ['analytics', 'dashboard', 'export'],
      },
    },
    {
      title: 'Database Schema',
      description: 'Sample database table structure',
      category: 'Database Schema',
      tags: ['database', 'schema', 'sql'],
      content: {
        tables: {
          users: {
            columns: {
              id: { type: 'integer', primary: true },
              email: { type: 'varchar', unique: true },
              created_at: { type: 'timestamp' },
            },
          },
          posts: {
            columns: {
              id: { type: 'integer', primary: true },
              user_id: { type: 'integer', foreign_key: 'users.id' },
              title: { type: 'text' },
              content: { type: 'text' },
            },
          },
        },
      },
    },
  ];

  console.log('Creating test documents for library...');

  for (const doc of testDocuments) {
    // First upload the JSON
    const blob = new Blob([JSON.stringify(doc.content, null, 2)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, `${doc.title.replace(/\s+/g, '-').toLowerCase()}.json`);
    formData.append('title', doc.title);

    const uploadResponse = await request.post('/api/json/upload', {
      data: formData,
    });

    if (uploadResponse.ok()) {
      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult.document.id;

      console.log(`✅ Uploaded: ${doc.title} (ID: ${documentId})`);

      // Now publish it to make it public
      const publishResponse = await request.put(`/api/json/${documentId}/publish`, {
        data: {
          title: doc.title,
          description: doc.description,
          category: doc.category,
          tags: doc.tags,
          visibility: 'public',
        },
      });

      if (publishResponse.ok()) {
        console.log(`✅ Published: ${doc.title} to library`);
      } else {
        console.log(`❌ Failed to publish: ${doc.title}`, await publishResponse.text());
      }
    } else {
      console.log(`❌ Failed to upload: ${doc.title}`, await uploadResponse.text());
    }
  }

  // Verify the library now has content
  const libraryResponse = await request.get('/api/saved');
  if (libraryResponse.ok()) {
    const libraryData = await libraryResponse.json();
    console.log(`📚 Public library now has ${libraryData.documents.length} documents`);
    console.log(
      'Documents:',
      libraryData.documents.map((d) => d.title)
    );
  }
});
