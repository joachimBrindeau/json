# Realistic Data Generators - Quick Reference

## 🚀 Quick Start

```typescript
import { test } from '@playwright/test';

test('my test', async ({ dataGenerator }) => {
  // Generate realistic data
  const user = dataGenerator.generateRealisticUser();
  const users = dataGenerator.generateRealisticUsers(10);
  const products = dataGenerator.generateRealisticProducts(5);
  
  // Use in your test...
});
```

---

## 📋 Available Generators

### 👤 Users

```typescript
// Single user with complete profile
const user = dataGenerator.generateRealisticUser();
// {
//   id: "uuid",
//   name: "Samuel DuBuque",
//   email: "realistic@email.com",
//   username: "username",
//   avatar: "https://...",
//   bio: "...",
//   phone: "610-836-0294",
//   birthdate: "1902-02-14",
//   address: { street, city, state, country, zipCode, coordinates },
//   company: { name, catchPhrase, bs },
//   createdAt: "...",
//   updatedAt: "..."
// }

// Multiple users
const users = dataGenerator.generateRealisticUsers(10);
```

### 🛍️ Products

```typescript
// Single product
const product = dataGenerator.generateRealisticProduct();
// {
//   id: "uuid",
//   name: "Soft Bronze Chicken",
//   description: "...",
//   price: 2246.28,
//   currency: "EUR",
//   category: "Electronics",
//   inStock: true,
//   sku: "...",
//   images: ["url1", "url2"],
//   reviews: [{ rating, comment, author, date }],
//   tags: ["tag1", "tag2"]
// }

// Multiple products
const products = dataGenerator.generateRealisticProducts(5);
```

### 📡 API Responses

```typescript
// API response with pagination
const apiResponse = dataGenerator.generateRealisticAPIResponse();
// {
//   success: true,
//   requestId: "uuid",
//   timestamp: "...",
//   data: [...],
//   pagination: {
//     page: 4,
//     perPage: 20,
//     total: 1656,
//     totalPages: 123
//   }
// }
```

### 🌳 Nested Structures

```typescript
// 5 levels deep
const nested = dataGenerator.generateRealisticDeepNesting();
// {
//   level1: {
//     id: "...",
//     level2: {
//       id: "...",
//       level3: {
//         id: "...",
//         level4: {
//           id: "...",
//           level5: {
//             id: "...",
//             values: [...]
//           }
//         }
//       }
//     }
//   }
// }
```

### 🎨 Mixed Types

```typescript
// All JSON types
const mixed = dataGenerator.generateRealisticMixedTypes();
// {
//   strings: ["...", "..."],
//   numbers: [123, 456],
//   booleans: [true, false],
//   dates: ["2024-01-01", ...],
//   urls: ["https://...", ...],
//   emails: ["email@example.com", ...],
//   colors: ["#FF5733", ...]
// }
```

### 📱 Social Media

```typescript
// Social media post
const post = dataGenerator.generateSocialPost();
// {
//   id: "...",
//   author: {
//     id: "...",
//     username: "...",
//     displayName: "...",
//     avatar: "...",
//     verified: true,
//     followers: 103423
//   },
//   content: {
//     text: "...",
//     hashtags: ["#tag1", "#tag2"],
//     mentions: ["@user1"],
//     media: [{ type, url }]
//   },
//   engagement: {
//     likes: 92642,
//     retweets: 19105,
//     comments: 0
//   },
//   timestamp: "..."
// }
```

### 💰 Financial

```typescript
// Financial transaction
const transaction = dataGenerator.generateTransaction();
// {
//   transactionId: "...",
//   type: "transfer",
//   amount: { value: 75561.78, currency: "JPY" },
//   status: "completed",
//   from: { accountNumber, accountName, bankCode },
//   to: { accountNumber, accountName, bankCode },
//   description: "...",
//   timestamp: "...",
//   metadata: { ... }
// }
```

### 🔌 IoT Sensors

```typescript
// IoT sensor data
const sensor = dataGenerator.generateSensorData();
// {
//   deviceId: "...",
//   deviceName: "...",
//   deviceType: "temperature",
//   location: { building, floor, room },
//   readings: [
//     { timestamp, value, unit, type }
//   ],
//   status: {
//     online: true,
//     battery: 92,
//     signalStrength: 85,
//     lastSeen: "..."
//   },
//   alerts: [...]
// }
```

### ⚙️ Configuration

```typescript
// Configuration object
const config = dataGenerator.generateConfiguration();
// {
//   version: "...",
//   environment: "production",
//   features: { feature1: true, feature2: false },
//   database: { host, port, name, ssl },
//   logging: { level, format, outputs },
//   cache: { enabled, ttl, maxSize }
// }
```

### 📊 Large Datasets

```typescript
// Large realistic dataset (100+ records)
const largeData = dataGenerator.generateLargeRealisticDataset();
// {
//   metadata: {
//     generatedAt: "...",
//     totalRecords: 150,
//     totalPages: 15,
//     version: "..."
//   },
//   records: [
//     { id, name, email, ... },
//     // ... 100+ records
//   ]
// }
```

### 🎯 Custom Schemas

```typescript
// Generate from custom schema
const customSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', faker: 'string.uuid' },
    name: { type: 'string', faker: 'person.fullName' },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 18, maximum: 80 }
  }
};

const data = dataGenerator.generateFromCustomSchema(customSchema);
```

---

## 🎨 Faker.js Methods Reference

### Person
```typescript
faker.person.fullName()
faker.person.firstName()
faker.person.lastName()
faker.person.jobTitle()
faker.person.bio()
```

### Internet
```typescript
faker.internet.email()
faker.internet.url()
faker.internet.username()
faker.internet.password()
faker.internet.avatar()
```

### Location
```typescript
faker.location.streetAddress()
faker.location.city()
faker.location.state()
faker.location.country()
faker.location.zipCode()
faker.location.latitude()
faker.location.longitude()
```

### Commerce
```typescript
faker.commerce.productName()
faker.commerce.productDescription()
faker.commerce.price()
faker.commerce.department()
faker.commerce.product()
```

### Date
```typescript
faker.date.past()
faker.date.future()
faker.date.recent()
faker.date.birthdate()
```

### Finance
```typescript
faker.finance.accountNumber()
faker.finance.amount()
faker.finance.currencyCode()
faker.finance.transactionType()
```

### Lorem
```typescript
faker.lorem.sentence()
faker.lorem.paragraph()
faker.lorem.text()
faker.lorem.words()
```

### String
```typescript
faker.string.uuid()
faker.string.alphanumeric()
faker.string.numeric()
```

### Image
```typescript
faker.image.avatar()
faker.image.url()
```

---

## 📝 JSON Schema Formats

```typescript
{
  type: 'string',
  format: 'email'      // Valid email
  format: 'uri'        // Valid URL
  format: 'date'       // ISO date (YYYY-MM-DD)
  format: 'date-time'  // ISO datetime
  format: 'ipv4'       // IPv4 address
  format: 'ipv6'       // IPv6 address
  format: 'uuid'       // UUID
}
```

---

## 💡 Common Patterns

### Test with realistic user
```typescript
test('display user profile', async ({ dataGenerator }) => {
  const user = dataGenerator.generateRealisticUser();
  const jsonString = JSON.stringify(user, null, 2);
  
  await viewerPage.inputJSON(jsonString);
  await viewerPage.waitForJSONProcessed();
  
  expect(await viewerPage.hasJSONErrors()).toBe(false);
});
```

### Test with multiple items
```typescript
test('display user list', async ({ dataGenerator }) => {
  const users = dataGenerator.generateRealisticUsers(10);
  const jsonString = JSON.stringify(users, null, 2);
  
  await viewerPage.inputJSON(jsonString);
  await viewerPage.waitForJSONProcessed();
  
  const nodeCounts = await viewerPage.getNodeCounts();
  expect(nodeCounts.objects).toBeGreaterThan(10);
});
```

### Test file upload
```typescript
test('upload realistic data', async ({ dataGenerator }) => {
  const products = dataGenerator.generateRealisticProducts(5);
  const jsonContent = JSON.stringify(products, null, 2);
  const testFilePath = join(testFilesDir, 'products.json');
  
  writeFileSync(testFilePath, jsonContent);
  await viewerPage.uploadJSONFile(testFilePath);
  
  expect(await viewerPage.hasJSONErrors()).toBe(false);
});
```

### Performance testing
```typescript
test('handle large dataset', async ({ dataGenerator }) => {
  const largeData = dataGenerator.generateLargeRealisticDataset();
  const jsonString = JSON.stringify(largeData, null, 2);
  
  const startTime = Date.now();
  await viewerPage.inputJSON(jsonString);
  await viewerPage.waitForJSONProcessed();
  const processingTime = Date.now() - startTime;
  
  expect(processingTime).toBeLessThan(5000);
});
```

---

## 🎯 Best Practices

1. **Use realistic data for better test coverage**
   ```typescript
   // ❌ Bad
   const user = { name: 'Test User', email: 'test@test.com' };
   
   // ✅ Good
   const user = dataGenerator.generateRealisticUser();
   ```

2. **Generate fresh data for each test**
   ```typescript
   test.beforeEach(async ({ dataGenerator }) => {
     testData = dataGenerator.generateRealisticUsers(5);
   });
   ```

3. **Use appropriate generators for your scenario**
   ```typescript
   // For user profiles
   const user = dataGenerator.generateRealisticUser();
   
   // For e-commerce
   const products = dataGenerator.generateRealisticProducts(10);
   
   // For APIs
   const response = dataGenerator.generateRealisticAPIResponse();
   ```

4. **Combine generators for complex scenarios**
   ```typescript
   const testData = {
     user: dataGenerator.generateRealisticUser(),
     orders: dataGenerator.generateRealisticProducts(3),
     transactions: dataGenerator.generateTransaction()
   };
   ```

---

## 🚀 Ready to Use!

All generators are available in your tests via the `dataGenerator` fixture:

```typescript
test('my test', async ({ dataGenerator }) => {
  // Start using realistic data!
});
```

**Happy testing!** 🎉

