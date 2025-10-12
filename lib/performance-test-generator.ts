// Performance test generator for very large JSONs
// KISS approach: Simple generators for testing extreme cases

export interface TestDataOptions {
  arraySize?: number;
  objectDepth?: number;
  stringLength?: number;
  nestingComplexity?: 'simple' | 'complex' | 'extreme';
}

export class PerformanceTestGenerator {
  // Generate large array JSON
  static generateLargeArray(size: number = 100000): any[] {
    const result: any[] = [];

    for (let i = 0; i < size; i++) {
      if (i % 1000 === 0) {
        // Add complex objects occasionally
        result.push({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} in the array`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`, `type${i % 3}`],
            nested: {
              level1: {
                level2: {
                  level3: `Deep value ${i}`,
                },
              },
            },
          },
          values: new Array(100).fill(0).map((_, idx) => i * 100 + idx),
        });
      } else {
        // Simple objects for most items
        result.push({
          id: i,
          value: Math.random() * 1000,
          active: i % 2 === 0,
          timestamp: Date.now() + i,
        });
      }
    }

    return result;
  }

  // Generate deep nested object
  static generateDeepObject(depth: number = 100): any {
    let current: any = { deepestLevel: depth, value: 'deep value' };

    for (let i = depth - 1; i >= 0; i--) {
      current = {
        level: i,
        data: `Level ${i} data`,
        children: new Array((i % 5) + 1).fill(null).map((_, idx) => ({
          childId: idx,
          childData: `Child ${idx} at level ${i}`,
        })),
        nested: current,
      };
    }

    return current;
  }

  // Generate wide object (many properties)
  static generateWideObject(propertyCount: number = 10000): any {
    const result: any = {};

    for (let i = 0; i < propertyCount; i++) {
      const key = `property_${i.toString().padStart(6, '0')}`;

      if (i % 100 === 0) {
        // Complex property
        result[key] = {
          type: 'complex',
          data: new Array(50).fill(0).map((_, idx) => ({
            id: idx,
            value: Math.random() * 1000,
            nested: {
              a: `value_a_${idx}`,
              b: `value_b_${idx}`,
              c: new Array(10).fill(`item_${idx}`),
            },
          })),
        };
      } else {
        // Simple property
        result[key] = {
          type: 'simple',
          value: Math.random() * 1000,
          text: `Simple property ${i}`,
          active: i % 2 === 0,
        };
      }
    }

    return result;
  }

  // Generate extreme test case
  static generateExtremeJSON(): any {
    return {
      metadata: {
        generated: new Date().toISOString(),
        type: 'extreme_test',
        size: 'very_large',
        warning: 'This is a performance test JSON with extreme characteristics',
      },

      // Large array section
      largeArray: this.generateLargeArray(50000),

      // Deep nested section
      deepNested: this.generateDeepObject(50),

      // Wide object section
      wideObject: this.generateWideObject(5000),

      // Mixed complexity section
      mixedData: {
        strings: new Array(1000)
          .fill(0)
          .map(
            (_, i) =>
              `This is a long string for item ${i}: `.repeat(20) +
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)
          ),

        numbers: new Array(10000).fill(0).map(() => Math.random() * 1000000),

        booleans: new Array(1000).fill(0).map((_, i) => i % 2 === 0),

        nulls: new Array(100).fill(null),

        mixed_array: new Array(5000).fill(0).map((_, i) => {
          const types = ['string', 'number', 'boolean', 'object', 'array'];
          const type = types[i % types.length];

          switch (type) {
            case 'string':
              return `String value ${i}`;
            case 'number':
              return Math.random() * 1000;
            case 'boolean':
              return i % 2 === 0;
            case 'object':
              return {
                id: i,
                nested: { value: `nested_${i}` },
              };
            case 'array':
              return new Array((i % 10) + 1).fill(`array_item_${i}`);
            default:
              return null;
          }
        }),
      },

      // Performance markers
      performanceTest: {
        totalItems: 50000 + 5000 + 1000 + 10000 + 1000 + 100 + 5000,
        estimatedSizeMB: 'Approximately 100-500MB',
        testCases: [
          'Large array handling',
          'Deep nesting performance',
          'Wide object traversal',
          'Mixed data type processing',
          'Memory usage optimization',
          'Streaming parse capability',
        ],
      },
    };
  }

  // Generate specific size JSON (approximate)
  static generateSizedJSON(targetSizeMB: number): any {
    const bytesPerMB = 1024 * 1024;
    const targetBytes = targetSizeMB * bytesPerMB;

    // Rough estimation: each simple object ~100 bytes
    const itemsNeeded = Math.floor(targetBytes / 100);

    return {
      metadata: {
        targetSizeMB,
        estimatedItems: itemsNeeded,
        generated: new Date().toISOString(),
      },
      data: this.generateLargeArray(itemsNeeded),
    };
  }

  // Test streaming performance
  static async testStreamingPerformance(json: any): Promise<{
    stringifyTime: number;
    parseTime: number;
    sizeMB: number;
    memoryBefore: number;
    memoryAfter: number;
  }> {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    // Test stringify performance
    const stringifyStart = performance.now();
    const jsonString = JSON.stringify(json);
    const stringifyTime = performance.now() - stringifyStart;

    const sizeMB = new Blob([jsonString]).size / (1024 * 1024);

    // Test parse performance
    const parseStart = performance.now();
    JSON.parse(jsonString);
    const parseTime = performance.now() - parseStart;

    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      stringifyTime,
      parseTime,
      sizeMB,
      memoryBefore: memoryBefore / (1024 * 1024), // MB
      memoryAfter: memoryAfter / (1024 * 1024), // MB
    };
  }
}

// Export convenience functions
export const generateLargeTestJSON = (sizeMB: number = 100) =>
  PerformanceTestGenerator.generateSizedJSON(sizeMB);

export const generateExtremeTestJSON = () => PerformanceTestGenerator.generateExtremeJSON();

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  small: { sizeMB: 1, expectedParseTime: 50 }, // < 50ms
  medium: { sizeMB: 10, expectedParseTime: 200 }, // < 200ms
  large: { sizeMB: 100, expectedParseTime: 1000 }, // < 1s
  extreme: { sizeMB: 500, expectedParseTime: 5000 }, // < 5s
};
