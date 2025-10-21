import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: [
      '**/__tests__/**/*.test.{ts,tsx}',
      '**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/e2e/**',
      '**/tests/utils/**',
      '**/tests/page-objects/**',
      '**/tests/fixtures/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '.next/',
        'dist/',
        'coverage/',
      ],
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
        'components/**/*.tsx',
        'hooks/**/*.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    bail: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

