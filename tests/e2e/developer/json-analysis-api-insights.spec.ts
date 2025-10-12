import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES, generateLargeJSON } from '../../fixtures/json-samples';

test.describe('Developer - JSON Analysis API for Structure and Complexity Insights', () => {
  test.describe('Basic JSON Structure Analysis', () => {
    test('should analyze JSON structure and provide comprehensive insights', async ({
      apiHelper,
    }) => {
      const testJSON = JSON_SAMPLES.ecommerce.content;

      // Test basic structure analysis
      const analysisResponse = await apiHelper.apiCall('POST', '/api/json/analyze', {
        data: {
          content: JSON.stringify(testJSON),
          analysisTypes: ['structure', 'types', 'statistics', 'schema'],
          includeMetadata: true,
        },
        expectedStatus: 200,
      });

      expect(analysisResponse.data).toHaveProperty('structure');
      expect(analysisResponse.data).toHaveProperty('types');
      expect(analysisResponse.data).toHaveProperty('statistics');
      expect(analysisResponse.data).toHaveProperty('schema');
      expect(analysisResponse.data).toHaveProperty('metadata');

      // Structure analysis
      const structure = analysisResponse.data.structure;
      expect(structure).toHaveProperty('nodeCount');
      expect(structure).toHaveProperty('maxDepth');
      expect(structure).toHaveProperty('leafNodes');
      expect(structure).toHaveProperty('branchNodes');
      expect(structure).toHaveProperty('arrayNodes');
      expect(structure).toHaveProperty('objectNodes');

      expect(structure.nodeCount).toBeGreaterThan(10);
      expect(structure.maxDepth).toBeGreaterThan(3);

      // Type analysis
      const types = analysisResponse.data.types;
      expect(types).toHaveProperty('distribution');
      expect(types).toHaveProperty('unique');
      expect(types).toHaveProperty('nullable');

      expect(types.distribution).toHaveProperty('string');
      expect(types.distribution).toHaveProperty('number');
      expect(types.distribution).toHaveProperty('object');
      expect(types.distribution).toHaveProperty('array');

      // Statistics
      const stats = analysisResponse.data.statistics;
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('complexity');
      expect(stats).toHaveProperty('patterns');

      expect(stats.size).toHaveProperty('raw');
      expect(stats.size).toHaveProperty('compressed');
      expect(stats.size).toHaveProperty('prettyPrinted');

      // Schema analysis
      const schema = analysisResponse.data.schema;
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('properties');
      expect(schema).toHaveProperty('required');
      expect(schema.type).toBe('object');
    });

    test('should analyze different JSON data types and patterns', async ({ apiHelper }) => {
      const testCases = [
        {
          name: 'Mixed Types JSON',
          data: JSON_SAMPLES.mixedTypes.content,
          expectedComplexity: 'medium',
        },
        {
          name: 'Nested Structure JSON',
          data: JSON_SAMPLES.nested.content,
          expectedComplexity: 'high',
        },
        {
          name: 'Simple JSON',
          data: JSON_SAMPLES.simple.content,
          expectedComplexity: 'low',
        },
        {
          name: 'Configuration JSON',
          data: JSON_SAMPLES.configuration.content,
          expectedComplexity: 'medium',
        },
      ];

      for (const testCase of testCases) {
        const analysisResponse = await apiHelper.apiCall('POST', '/api/json/analyze', {
          data: {
            content: JSON.stringify(testCase.data),
            analysisTypes: ['structure', 'complexity', 'patterns'],
            includeSuggestions: true,
          },
          expectedStatus: 200,
        });

        expect(analysisResponse.data).toHaveProperty('structure');
        expect(analysisResponse.data).toHaveProperty('complexity');
        expect(analysisResponse.data).toHaveProperty('patterns');

        // Complexity assessment
        const complexity = analysisResponse.data.complexity;
        expect(complexity).toHaveProperty('level');
        expect(complexity).toHaveProperty('score');
        expect(complexity).toHaveProperty('factors');

        expect(['low', 'medium', 'high', 'very-high']).toContain(complexity.level);
        expect(complexity.score).toBeGreaterThanOrEqual(0);
        expect(complexity.score).toBeLessThanOrEqual(100);

        // Pattern analysis
        const patterns = analysisResponse.data.patterns;
        expect(patterns).toHaveProperty('detected');
        expect(patterns).toHaveProperty('suggestions');
        expect(Array.isArray(patterns.detected)).toBe(true);

        console.log(
          `${testCase.name} complexity: ${complexity.level} (score: ${complexity.score})`
        );
      }
    });

    test('should detect and analyze JSON schemas and validate structure', async ({ apiHelper }) => {
      const schemaTestJSON = {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            address: {
              street: '123 Main St',
              city: 'Anytown',
              zipCode: '12345',
            },
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            age: 25,
            address: {
              street: '456 Oak Ave',
              city: 'Other City',
              zipCode: '67890',
            },
            preferences: {
              theme: 'light',
              notifications: false,
            },
          },
        ],
        metadata: {
          total: 2,
          page: 1,
          hasMore: false,
        },
      };

      const schemaAnalysisResponse = await apiHelper.apiCall('POST', '/api/json/analyze/schema', {
        data: {
          content: JSON.stringify(schemaTestJSON),
          inferSchema: true,
          validateConsistency: true,
          generateExamples: true,
        },
        expectedStatus: 200,
      });

      expect(schemaAnalysisResponse.data).toHaveProperty('schema');
      expect(schemaAnalysisResponse.data).toHaveProperty('validation');
      expect(schemaAnalysisResponse.data).toHaveProperty('consistency');
      expect(schemaAnalysisResponse.data).toHaveProperty('examples');

      // Generated schema
      const schema = schemaAnalysisResponse.data.schema;
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');

      const properties = schema.properties;
      expect(properties).toHaveProperty('users');
      expect(properties).toHaveProperty('metadata');
      expect(properties.users).toHaveProperty('type', 'array');
      expect(properties.users).toHaveProperty('items');

      // User object schema
      const userSchema = properties.users.items;
      expect(userSchema).toHaveProperty('type', 'object');
      expect(userSchema).toHaveProperty('properties');
      expect(userSchema.properties).toHaveProperty('id');
      expect(userSchema.properties).toHaveProperty('name');
      expect(userSchema.properties).toHaveProperty('email');

      // Consistency validation
      const consistency = schemaAnalysisResponse.data.consistency;
      expect(consistency).toHaveProperty('score');
      expect(consistency).toHaveProperty('issues');
      expect(consistency).toHaveProperty('violations');
      expect(consistency.score).toBeGreaterThan(0.8); // Should be highly consistent

      // Test schema validation against different data
      const validationTestResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/analyze/validate-schema',
        {
          data: {
            schema: schema,
            testData: JSON.stringify({
              users: [
                {
                  id: 3,
                  name: 'Bob Wilson',
                  email: 'bob@example.com',
                  age: 35,
                  address: {
                    street: '789 Pine St',
                    city: 'Third City',
                    zipCode: '11111',
                  },
                  preferences: {
                    theme: 'auto',
                    notifications: true,
                  },
                },
              ],
              metadata: {
                total: 1,
                page: 1,
                hasMore: true,
              },
            }),
          },
          expectedStatus: 200,
        }
      );

      expect(validationTestResponse.data).toHaveProperty('valid');
      expect(validationTestResponse.data).toHaveProperty('errors');
      expect(validationTestResponse.data.valid).toBe(true);
    });
  });

  test.describe('Advanced Analysis and Insights', () => {
    test('should analyze large JSON files and provide performance insights', async ({
      apiHelper,
    }) => {
      // Generate large JSON for performance analysis
      const largeJSON = generateLargeJSON(5000, 6, 200);
      const jsonString = JSON.stringify(largeJSON);

      const performanceAnalysisResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/analyze/performance',
        {
          data: {
            content: jsonString,
            includeOptimizations: true,
            includeMemoryAnalysis: true,
            includeProcessingTime: true,
          },
          expectedStatus: 200,
        }
      );

      expect(performanceAnalysisResponse.data).toHaveProperty('size');
      expect(performanceAnalysisResponse.data).toHaveProperty('performance');
      expect(performanceAnalysisResponse.data).toHaveProperty('optimizations');
      expect(performanceAnalysisResponse.data).toHaveProperty('memory');

      // Size analysis
      const size = performanceAnalysisResponse.data.size;
      expect(size).toHaveProperty('bytes');
      expect(size).toHaveProperty('compressed');
      expect(size).toHaveProperty('compressionRatio');
      expect(size).toHaveProperty('estimatedLoadTime');

      expect(size.bytes).toBeGreaterThan(1000000); // Should be > 1MB
      expect(size.compressionRatio).toBeGreaterThan(0);

      // Performance metrics
      const performance = performanceAnalysisResponse.data.performance;
      expect(performance).toHaveProperty('parseTime');
      expect(performance).toHaveProperty('traversalTime');
      expect(performance).toHaveProperty('complexity');
      expect(performance).toHaveProperty('bottlenecks');

      // Memory analysis
      const memory = performanceAnalysisResponse.data.memory;
      expect(memory).toHaveProperty('estimated');
      expect(memory).toHaveProperty('peak');
      expect(memory).toHaveProperty('recommendations');

      // Optimization suggestions
      const optimizations = performanceAnalysisResponse.data.optimizations;
      expect(optimizations).toHaveProperty('suggestions');
      expect(optimizations).toHaveProperty('priority');
      expect(Array.isArray(optimizations.suggestions)).toBe(true);

      if (optimizations.suggestions.length > 0) {
        const suggestion = optimizations.suggestions[0];
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('difficulty');
      }
    });

    test('should provide security analysis and vulnerability detection', async ({ apiHelper }) => {
      // Test JSON with potential security issues
      const potentiallyUnsafeJSON = {
        userInput: "<script>alert('xss')</script>",
        sqlQuery: "SELECT * FROM users WHERE id = '; DROP TABLE users; --",
        fileContent: '../../../../etc/passwd',
        eval: "eval('malicious code')",
        prototype: {
          __proto__: {
            isAdmin: true,
          },
        },
        deepObject: {
          level1: {
            level2: {
              level3: {
                userData: 'potentially unsafe content',
              },
            },
          },
        },
        largeArray: Array(10000).fill('repeated data'),
        sensitiveData: {
          password: 'plaintext-password',
          creditCard: '4532-1234-5678-9012',
          ssn: '123-45-6789',
          apiKey: 'sk-1234567890abcdef',
        },
      };

      const securityAnalysisResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/analyze/security',
        {
          data: {
            content: JSON.stringify(potentiallyUnsafeJSON),
            checkPatterns: ['xss', 'sql-injection', 'path-traversal', 'prototype-pollution'],
            identifySensitiveData: true,
            analyzeStructuralRisks: true,
          },
          expectedStatus: 200,
        }
      );

      expect(securityAnalysisResponse.data).toHaveProperty('risks');
      expect(securityAnalysisResponse.data).toHaveProperty('sensitiveData');
      expect(securityAnalysisResponse.data).toHaveProperty('patterns');
      expect(securityAnalysisResponse.data).toHaveProperty('recommendations');

      // Risk analysis
      const risks = securityAnalysisResponse.data.risks;
      expect(risks).toHaveProperty('level');
      expect(risks).toHaveProperty('score');
      expect(risks).toHaveProperty('categories');

      expect(['low', 'medium', 'high', 'critical']).toContain(risks.level);
      expect(risks.score).toBeGreaterThanOrEqual(0);

      // Sensitive data detection
      const sensitiveData = securityAnalysisResponse.data.sensitiveData;
      expect(sensitiveData).toHaveProperty('found');
      expect(sensitiveData).toHaveProperty('types');
      expect(Array.isArray(sensitiveData.found)).toBe(true);

      if (sensitiveData.found.length > 0) {
        const finding = sensitiveData.found[0];
        expect(finding).toHaveProperty('type');
        expect(finding).toHaveProperty('path');
        expect(finding).toHaveProperty('confidence');
        expect(['password', 'credit-card', 'ssn', 'api-key', 'email', 'phone']).toContain(
          finding.type
        );
      }

      // Pattern detection
      const patterns = securityAnalysisResponse.data.patterns;
      expect(patterns).toHaveProperty('detected');
      expect(Array.isArray(patterns.detected)).toBe(true);

      // Should detect various security patterns
      const detectedPatterns = patterns.detected.map((p) => p.type);
      expect(detectedPatterns).toContain('xss');
      expect(detectedPatterns).toContain('sql-injection');
    });

    test('should analyze JSON for data quality and consistency', async ({ apiHelper }) => {
      // Test data with quality issues
      const dataQualityTestJSON = {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            created: '2023-01-15',
            status: 'active',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@domain.com',
            age: 'twenty-five', // Inconsistent type
            created: '2023-02-20T10:30:00Z', // Inconsistent date format
            status: 'ACTIVE', // Inconsistent case
          },
          {
            id: 3,
            name: '', // Empty name
            email: 'invalid-email', // Invalid email format
            age: -5, // Invalid age
            created: null,
            status: 'inactive',
          },
          {
            id: 4,
            // Missing name
            email: 'missing@example.com',
            age: 45,
            created: '2023-03-10',
            status: 'pending',
          },
        ],
        metadata: {
          total: 4,
          lastUpdated: '2023-12-01',
        },
      };

      const qualityAnalysisResponse = await apiHelper.apiCall('POST', '/api/json/analyze/quality', {
        data: {
          content: JSON.stringify(dataQualityTestJSON),
          checkConsistency: true,
          validateFormats: true,
          identifyAnomalies: true,
          includeStatistics: true,
        },
        expectedStatus: 200,
      });

      expect(qualityAnalysisResponse.data).toHaveProperty('quality');
      expect(qualityAnalysisResponse.data).toHaveProperty('consistency');
      expect(qualityAnalysisResponse.data).toHaveProperty('validation');
      expect(qualityAnalysisResponse.data).toHaveProperty('anomalies');
      expect(qualityAnalysisResponse.data).toHaveProperty('statistics');

      // Quality score
      const quality = qualityAnalysisResponse.data.quality;
      expect(quality).toHaveProperty('score');
      expect(quality).toHaveProperty('issues');
      expect(quality).toHaveProperty('categories');

      expect(quality.score).toBeLessThan(100); // Should detect quality issues
      expect(Array.isArray(quality.issues)).toBe(true);
      expect(quality.issues.length).toBeGreaterThan(0);

      // Consistency analysis
      const consistency = qualityAnalysisResponse.data.consistency;
      expect(consistency).toHaveProperty('typeConsistency');
      expect(consistency).toHaveProperty('formatConsistency');
      expect(consistency).toHaveProperty('valueConsistency');

      // Should detect type inconsistencies
      expect(consistency.typeConsistency.score).toBeLessThan(1.0);
      expect(consistency.formatConsistency.score).toBeLessThan(1.0);

      // Validation results
      const validation = qualityAnalysisResponse.data.validation;
      expect(validation).toHaveProperty('fieldValidation');
      expect(validation).toHaveProperty('formatValidation');
      expect(Array.isArray(validation.fieldValidation)).toBe(true);

      // Should detect validation errors
      const fieldValidation = validation.fieldValidation;
      expect(fieldValidation.some((v) => v.field === 'email' && !v.valid)).toBe(true);
      expect(fieldValidation.some((v) => v.field === 'age' && !v.valid)).toBe(true);

      // Anomaly detection
      const anomalies = qualityAnalysisResponse.data.anomalies;
      expect(anomalies).toHaveProperty('detected');
      expect(anomalies).toHaveProperty('types');
      expect(Array.isArray(anomalies.detected)).toBe(true);
    });

    test('should provide data profiling and statistical insights', async ({ apiHelper }) => {
      const analyticsJSON = JSON_SAMPLES.analytics.content;

      const profilingResponse = await apiHelper.apiCall('POST', '/api/json/analyze/profile', {
        data: {
          content: JSON.stringify(analyticsJSON),
          includeDistributions: true,
          calculateCorrelations: true,
          identifyOutliers: true,
          generateSummaries: true,
        },
        expectedStatus: 200,
      });

      expect(profilingResponse.data).toHaveProperty('profile');
      expect(profilingResponse.data).toHaveProperty('distributions');
      expect(profilingResponse.data).toHaveProperty('correlations');
      expect(profilingResponse.data).toHaveProperty('outliers');
      expect(profilingResponse.data).toHaveProperty('summaries');

      // Data profile
      const profile = profilingResponse.data.profile;
      expect(profile).toHaveProperty('fields');
      expect(profile).toHaveProperty('types');
      expect(profile).toHaveProperty('nullability');
      expect(profile).toHaveProperty('cardinality');

      // Field analysis
      const fields = profile.fields;
      expect(Array.isArray(fields)).toBe(true);

      if (fields.length > 0) {
        const field = fields[0];
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('count');
        expect(field).toHaveProperty('nullCount');
        expect(field).toHaveProperty('uniqueCount');
      }

      // Distributions for numeric fields
      const distributions = profilingResponse.data.distributions;
      expect(distributions).toHaveProperty('numeric');
      expect(distributions).toHaveProperty('categorical');

      if (distributions.numeric && Object.keys(distributions.numeric).length > 0) {
        const numericField = Object.keys(distributions.numeric)[0];
        const numericDist = distributions.numeric[numericField];

        expect(numericDist).toHaveProperty('min');
        expect(numericDist).toHaveProperty('max');
        expect(numericDist).toHaveProperty('mean');
        expect(numericDist).toHaveProperty('median');
        expect(numericDist).toHaveProperty('std');
        expect(numericDist).toHaveProperty('percentiles');
      }

      // Correlations
      const correlations = profilingResponse.data.correlations;
      if (correlations && correlations.matrix) {
        expect(correlations).toHaveProperty('matrix');
        expect(correlations).toHaveProperty('significant');
        expect(Array.isArray(correlations.significant)).toBe(true);
      }
    });
  });

  test.describe('Comparative Analysis and Insights', () => {
    test('should compare multiple JSON structures and identify differences', async ({
      apiHelper,
    }) => {
      const json1 = {
        users: [
          { id: 1, name: 'John', age: 30, email: 'john@example.com' },
          { id: 2, name: 'Jane', age: 25, email: 'jane@example.com' },
        ],
        metadata: { total: 2, version: '1.0' },
      };

      const json2 = {
        users: [
          { id: 1, name: 'John Doe', age: 30, email: 'john.doe@example.com', city: 'NYC' },
          { id: 2, name: 'Jane Smith', age: 26, email: 'jane.smith@example.com', city: 'LA' },
          { id: 3, name: 'Bob Wilson', age: 35, email: 'bob@example.com', city: 'Chicago' },
        ],
        metadata: { total: 3, version: '2.0', lastUpdated: '2023-12-01' },
      };

      const compareResponse = await apiHelper.apiCall('POST', '/api/json/analyze/compare', {
        data: {
          json1: JSON.stringify(json1),
          json2: JSON.stringify(json2),
          comparisonTypes: ['structure', 'data', 'schema', 'performance'],
          includeDetails: true,
        },
        expectedStatus: 200,
      });

      expect(compareResponse.data).toHaveProperty('comparison');
      expect(compareResponse.data).toHaveProperty('differences');
      expect(compareResponse.data).toHaveProperty('similarities');
      expect(compareResponse.data).toHaveProperty('compatibility');

      // Structure comparison
      const comparison = compareResponse.data.comparison;
      expect(comparison).toHaveProperty('structure');
      expect(comparison).toHaveProperty('data');
      expect(comparison).toHaveProperty('schema');

      const structureComp = comparison.structure;
      expect(structureComp).toHaveProperty('similarity');
      expect(structureComp).toHaveProperty('differences');
      expect(structureComp.similarity).toBeGreaterThanOrEqual(0);
      expect(structureComp.similarity).toBeLessThanOrEqual(1);

      // Differences
      const differences = compareResponse.data.differences;
      expect(differences).toHaveProperty('added');
      expect(differences).toHaveProperty('removed');
      expect(differences).toHaveProperty('modified');

      expect(Array.isArray(differences.added)).toBe(true);
      expect(Array.isArray(differences.removed)).toBe(true);
      expect(Array.isArray(differences.modified)).toBe(true);

      // Should detect the new fields and changes
      expect(differences.added.some((d) => d.path.includes('city'))).toBe(true);
      expect(differences.added.some((d) => d.path.includes('lastUpdated'))).toBe(true);
    });

    test('should analyze JSON evolution and version compatibility', async ({ apiHelper }) => {
      const versions = [
        {
          version: '1.0',
          data: {
            user: { id: 1, name: 'John' },
            settings: { theme: 'dark' },
          },
        },
        {
          version: '1.1',
          data: {
            user: { id: 1, name: 'John', email: 'john@example.com' },
            settings: { theme: 'dark', language: 'en' },
          },
        },
        {
          version: '2.0',
          data: {
            user: {
              id: 1,
              profile: { name: 'John', email: 'john@example.com' },
              preferences: { theme: 'dark', language: 'en', notifications: true },
            },
            metadata: { version: '2.0', migrated: true },
          },
        },
      ];

      const evolutionResponse = await apiHelper.apiCall('POST', '/api/json/analyze/evolution', {
        data: {
          versions: versions.map((v) => ({
            version: v.version,
            content: JSON.stringify(v.data),
          })),
          analyzeCompatibility: true,
          identifyBreakingChanges: true,
          suggestMigration: true,
        },
        expectedStatus: 200,
      });

      expect(evolutionResponse.data).toHaveProperty('evolution');
      expect(evolutionResponse.data).toHaveProperty('compatibility');
      expect(evolutionResponse.data).toHaveProperty('breakingChanges');
      expect(evolutionResponse.data).toHaveProperty('migration');

      // Evolution analysis
      const evolution = evolutionResponse.data.evolution;
      expect(evolution).toHaveProperty('timeline');
      expect(evolution).toHaveProperty('trends');
      expect(evolution).toHaveProperty('complexity');

      expect(Array.isArray(evolution.timeline)).toBe(true);
      expect(evolution.timeline).toHaveLength(3);

      // Compatibility matrix
      const compatibility = evolutionResponse.data.compatibility;
      expect(compatibility).toHaveProperty('matrix');
      expect(compatibility).toHaveProperty('scores');

      // Breaking changes
      const breakingChanges = evolutionResponse.data.breakingChanges;
      expect(breakingChanges).toHaveProperty('detected');
      expect(breakingChanges).toHaveProperty('severity');
      expect(Array.isArray(breakingChanges.detected)).toBe(true);

      // Should detect the structure change in v2.0
      const structuralChanges = breakingChanges.detected.filter((c) => c.type === 'structural');
      expect(structuralChanges.length).toBeGreaterThan(0);
    });

    test('should benchmark JSON processing performance across different structures', async ({
      apiHelper,
    }) => {
      const testStructures = [
        {
          name: 'flat-object',
          data: Object.fromEntries(
            Array(1000)
              .fill(0)
              .map((_, i) => [`key${i}`, `value${i}`])
          ),
        },
        {
          name: 'deep-nested',
          data: JSON_SAMPLES.deepNesting.generateContent(10),
        },
        {
          name: 'large-array',
          data: {
            items: Array(5000)
              .fill(0)
              .map((_, i) => ({ id: i, data: `item${i}` })),
          },
        },
        {
          name: 'mixed-complex',
          data: {
            ...JSON_SAMPLES.ecommerce.content,
            largeArray: Array(2000)
              .fill(0)
              .map((_, i) => ({ index: i })),
            deepNesting: JSON_SAMPLES.deepNesting.generateContent(5),
          },
        },
      ];

      const benchmarkResponse = await apiHelper.apiCall('POST', '/api/json/analyze/benchmark', {
        data: {
          structures: testStructures.map((s) => ({
            name: s.name,
            content: JSON.stringify(s.data),
          })),
          operations: ['parse', 'traverse', 'search', 'modify'],
          iterations: 10,
          includeMemoryUsage: true,
        },
        expectedStatus: 200,
      });

      expect(benchmarkResponse.data).toHaveProperty('benchmarks');
      expect(benchmarkResponse.data).toHaveProperty('comparison');
      expect(benchmarkResponse.data).toHaveProperty('recommendations');

      // Benchmark results
      const benchmarks = benchmarkResponse.data.benchmarks;
      expect(Array.isArray(benchmarks)).toBe(true);
      expect(benchmarks).toHaveLength(4);

      benchmarks.forEach((benchmark) => {
        expect(benchmark).toHaveProperty('name');
        expect(benchmark).toHaveProperty('operations');
        expect(benchmark).toHaveProperty('memory');
        expect(benchmark).toHaveProperty('size');

        // Operation timings
        const operations = benchmark.operations;
        expect(operations).toHaveProperty('parse');
        expect(operations).toHaveProperty('traverse');
        expect(operations).toHaveProperty('search');
        expect(operations).toHaveProperty('modify');

        Object.values(operations).forEach((op) => {
          expect(op).toHaveProperty('averageTime');
          expect(op).toHaveProperty('minTime');
          expect(op).toHaveProperty('maxTime');
          expect(op.averageTime).toBeGreaterThan(0);
        });
      });

      // Performance comparison
      const comparison = benchmarkResponse.data.comparison;
      expect(comparison).toHaveProperty('fastest');
      expect(comparison).toHaveProperty('slowest');
      expect(comparison).toHaveProperty('rankings');

      expect(Array.isArray(comparison.rankings)).toBe(true);
      comparison.rankings.forEach((ranking) => {
        expect(ranking).toHaveProperty('operation');
        expect(ranking).toHaveProperty('ranking');
        expect(Array.isArray(ranking.ranking)).toBe(true);
      });
    });
  });

  test.describe('Advanced Analytics and Machine Learning Insights', () => {
    test('should provide predictive analytics based on JSON patterns', async ({ apiHelper }) => {
      // Historical data for pattern analysis
      const historicalData = [
        {
          timestamp: '2023-01-01',
          metrics: { users: 1000, sessions: 5000, revenue: 10000 },
        },
        {
          timestamp: '2023-02-01',
          metrics: { users: 1100, sessions: 5500, revenue: 11000 },
        },
        {
          timestamp: '2023-03-01',
          metrics: { users: 1250, sessions: 6200, revenue: 12500 },
        },
        {
          timestamp: '2023-04-01',
          metrics: { users: 1400, sessions: 7000, revenue: 14000 },
        },
        {
          timestamp: '2023-05-01',
          metrics: { users: 1600, sessions: 8000, revenue: 16000 },
        },
      ];

      const predictiveResponse = await apiHelper.apiCall('POST', '/api/json/analyze/predict', {
        data: {
          content: JSON.stringify(historicalData),
          predictFields: ['users', 'sessions', 'revenue'],
          timeHorizon: 3, // 3 months ahead
          includeConfidenceIntervals: true,
          identifySeasonality: true,
        },
        expectedStatus: 200,
      });

      expect(predictiveResponse.data).toHaveProperty('predictions');
      expect(predictiveResponse.data).toHaveProperty('patterns');
      expect(predictiveResponse.data).toHaveProperty('confidence');
      expect(predictiveResponse.data).toHaveProperty('accuracy');

      // Predictions
      const predictions = predictiveResponse.data.predictions;
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions).toHaveLength(3); // 3 months

      predictions.forEach((prediction) => {
        expect(prediction).toHaveProperty('timestamp');
        expect(prediction).toHaveProperty('predicted');
        expect(prediction.predicted).toHaveProperty('users');
        expect(prediction.predicted).toHaveProperty('sessions');
        expect(prediction.predicted).toHaveProperty('revenue');
      });

      // Pattern detection
      const patterns = predictiveResponse.data.patterns;
      expect(patterns).toHaveProperty('trends');
      expect(patterns).toHaveProperty('flowsonality');
      expect(patterns).toHaveProperty('correlations');

      // Confidence intervals
      const confidence = predictiveResponse.data.confidence;
      expect(confidence).toHaveProperty('intervals');
      expect(confidence).toHaveProperty('accuracy');
      expect(Array.isArray(confidence.intervals)).toBe(true);
    });

    test('should cluster and classify JSON data automatically', async ({ apiHelper }) => {
      // Dataset with different types of JSON documents
      const documents = [
        { type: 'user', data: { id: 1, name: 'John', age: 30, role: 'admin' } },
        { type: 'user', data: { id: 2, name: 'Jane', age: 25, role: 'user' } },
        {
          type: 'product',
          data: { id: 101, title: 'Laptop', price: 999, category: 'electronics' },
        },
        { type: 'product', data: { id: 102, title: 'Book', price: 29, category: 'education' } },
        { type: 'order', data: { id: 1001, userId: 1, productId: 101, total: 999 } },
        { type: 'order', data: { id: 1002, userId: 2, productId: 102, total: 29 } },
        { type: 'analytics', data: { views: 1500, clicks: 250, conversions: 25 } },
        { type: 'analytics', data: { views: 2000, clicks: 400, conversions: 50 } },
      ];

      const clusteringResponse = await apiHelper.apiCall('POST', '/api/json/analyze/cluster', {
        data: {
          documents: documents.map((d) => JSON.stringify(d.data)),
          clusteringAlgorithm: 'kmeans',
          numberOfClusters: 4,
          features: 'auto-extract',
          includeClassification: true,
        },
        expectedStatus: 200,
      });

      expect(clusteringResponse.data).toHaveProperty('clusters');
      expect(clusteringResponse.data).toHaveProperty('classification');
      expect(clusteringResponse.data).toHaveProperty('features');
      expect(clusteringResponse.data).toHaveProperty('quality');

      // Cluster results
      const clusters = clusteringResponse.data.clusters;
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);

      clusters.forEach((cluster) => {
        expect(cluster).toHaveProperty('id');
        expect(cluster).toHaveProperty('centroid');
        expect(cluster).toHaveProperty('members');
        expect(cluster).toHaveProperty('characteristics');
      });

      // Classification results
      const classification = clusteringResponse.data.classification;
      expect(classification).toHaveProperty('model');
      expect(classification).toHaveProperty('accuracy');
      expect(classification).toHaveProperty('predictions');

      // Feature extraction
      const features = clusteringResponse.data.features;
      expect(features).toHaveProperty('extracted');
      expect(features).toHaveProperty('importance');
      expect(Array.isArray(features.extracted)).toBe(true);
    });

    test('should detect anomalies and outliers in JSON datasets', async ({ apiHelper }) => {
      // Dataset with some anomalies
      const dataset = [
        { temperature: 22, humidity: 45, pressure: 1013 },
        { temperature: 23, humidity: 48, pressure: 1015 },
        { temperature: 21, humidity: 44, pressure: 1012 },
        { temperature: 24, humidity: 50, pressure: 1016 },
        { temperature: 95, humidity: 90, pressure: 900 }, // Anomaly
        { temperature: 22, humidity: 47, pressure: 1014 },
        { temperature: 25, humidity: 52, pressure: 1017 },
        { temperature: -50, humidity: 5, pressure: 800 }, // Anomaly
        { temperature: 23, humidity: 49, pressure: 1013 },
        { temperature: 26, humidity: 55, pressure: 1018 },
      ];

      const anomalyResponse = await apiHelper.apiCall('POST', '/api/json/analyze/anomalies', {
        data: {
          content: JSON.stringify(dataset),
          algorithm: 'isolation-forest',
          sensitivity: 0.1,
          includeExplanation: true,
          detectOutliers: true,
        },
        expectedStatus: 200,
      });

      expect(anomalyResponse.data).toHaveProperty('anomalies');
      expect(anomalyResponse.data).toHaveProperty('outliers');
      expect(anomalyResponse.data).toHaveProperty('normal');
      expect(anomalyResponse.data).toHaveProperty('statistics');

      // Anomaly detection results
      const anomalies = anomalyResponse.data.anomalies;
      expect(anomalies).toHaveProperty('detected');
      expect(anomalies).toHaveProperty('scores');
      expect(anomalies).toHaveProperty('explanations');

      expect(Array.isArray(anomalies.detected)).toBe(true);
      expect(anomalies.detected.length).toBeGreaterThanOrEqual(2); // Should detect the 2 anomalies

      anomalies.detected.forEach((anomaly) => {
        expect(anomaly).toHaveProperty('index');
        expect(anomaly).toHaveProperty('score');
        expect(anomaly).toHaveProperty('data');
        expect(anomaly.score).toBeGreaterThan(0);
      });

      // Should detect the extreme temperature values
      const tempAnomalies = anomalies.detected.filter(
        (a) => a.data.temperature > 50 || a.data.temperature < 0
      );
      expect(tempAnomalies.length).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Integration and Export Capabilities', () => {
    test('should export analysis results in multiple formats', async ({ apiHelper }) => {
      const testJSON = JSON_SAMPLES.analytics.content;

      const exportFormats = ['json', 'csv', 'xml', 'pdf-report', 'excel'];

      for (const format of exportFormats) {
        const exportResponse = await apiHelper.apiCall('POST', '/api/json/analyze/export', {
          data: {
            content: JSON.stringify(testJSON),
            analysisTypes: ['structure', 'performance', 'quality'],
            exportFormat: format,
            includeCharts: format === 'pdf-report' || format === 'excel',
            includeRawData: true,
          },
          expectedStatus: 200,
        });

        expect(exportResponse.status).toBe(200);

        if (format === 'json') {
          expect(typeof exportResponse.data).toBe('object');
          expect(exportResponse.data).toHaveProperty('analysis');
          expect(exportResponse.data).toHaveProperty('metadata');
        } else if (format === 'csv') {
          expect(typeof exportResponse.data).toBe('string');
          expect(exportResponse.data).toContain(','); // CSV delimiter
        } else if (format === 'xml') {
          expect(typeof exportResponse.data).toBe('string');
          expect(exportResponse.data).toContain('<?xml');
        }

        console.log(`Export format ${format}: Success`);
      }
    });

    test('should integrate with external analytics platforms', async ({ apiHelper }) => {
      const testJSON = JSON_SAMPLES.ecommerce.content;

      // Test integration configurations
      const integrations = [
        {
          platform: 'datadog',
          config: {
            apiKey: 'test-datadog-key',
            metrics: ['performance', 'quality'],
            tags: ['json-analysis', 'ecommerce'],
          },
        },
        {
          platform: 'newrelic',
          config: {
            licenseKey: 'test-newrelic-key',
            appName: 'json-analyzer',
            events: ['analysis-complete', 'anomaly-detected'],
          },
        },
        {
          platform: 'elasticsearch',
          config: {
            endpoint: 'https://elasticsearch.example.com',
            index: 'json-analysis',
            authentication: { type: 'api-key', key: 'test-key' },
          },
        },
      ];

      for (const integration of integrations) {
        const integrationResponse = await apiHelper.apiCall('POST', '/api/json/analyze/integrate', {
          data: {
            content: JSON.stringify(testJSON),
            platform: integration.platform,
            configuration: integration.config,
            analysisTypes: ['structure', 'performance'],
            enableRealtime: false,
          },
          expectedStatus: 200,
        });

        expect(integrationResponse.data).toHaveProperty('platform', integration.platform);
        expect(integrationResponse.data).toHaveProperty('status');
        expect(integrationResponse.data).toHaveProperty('exportedMetrics');

        if (integrationResponse.data.status === 'success') {
          expect(integrationResponse.data).toHaveProperty('platformResponse');
          expect(integrationResponse.data.exportedMetrics).toBeGreaterThan(0);
        }

        console.log(`Integration with ${integration.platform}: ${integrationResponse.data.status}`);
      }
    });

    test('should provide webhook notifications for analysis events', async ({ apiHelper }) => {
      const webhookUrl = 'https://webhook.site/test-json-analysis';

      // Configure webhook for analysis events
      const webhookConfigResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/analyze/webhooks/configure',
        {
          data: {
            url: webhookUrl,
            events: ['analysis-complete', 'anomaly-detected', 'quality-threshold-breach'],
            secret: 'webhook-secret',
            retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
          },
          expectedStatus: 201,
        }
      );

      expect(webhookConfigResponse.data).toHaveProperty('webhookId');
      const webhookId = webhookConfigResponse.data.webhookId;

      // Trigger analysis that should generate webhook
      const testJSON = {
        users: Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `User ${i}`,
            score: i === 500 ? 999999 : Math.random() * 100, // Anomaly at index 500
          })),
      };

      const analysisResponse = await apiHelper.apiCall('POST', '/api/json/analyze', {
        data: {
          content: JSON.stringify(testJSON),
          analysisTypes: ['anomalies', 'quality'],
          webhookId: webhookId,
          notifyOnCompletion: true,
        },
        expectedStatus: 200,
      });

      expect(analysisResponse.data).toHaveProperty('analysisId');
      const analysisId = analysisResponse.data.analysisId;

      // Check webhook deliveries
      const deliveriesResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/analyze/webhooks/${webhookId}/deliveries`,
        {
          params: {
            analysisId: analysisId,
            limit: '10',
          },
          expectedStatus: 200,
        }
      );

      expect(deliveriesResponse.data).toHaveProperty('deliveries');
      expect(Array.isArray(deliveriesResponse.data.deliveries)).toBe(true);

      if (deliveriesResponse.data.deliveries.length > 0) {
        const delivery = deliveriesResponse.data.deliveries[0];
        expect(delivery).toHaveProperty('eventType');
        expect(delivery).toHaveProperty('timestamp');
        expect(delivery).toHaveProperty('success');
        expect(delivery).toHaveProperty('payload');
      }
    });
  });
});
