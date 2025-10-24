import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    // jsdom simulates a browser environment in Node.js
    environment: 'jsdom',

    // Setup files to run before each test file
    setupFiles: ['./tests/setup.ts'],

    // Global test utilities (like expect, describe, it)
    // Available without importing in every test file
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/index.ts', // Index files are just exports
        '**/*.config.ts',
        'src/types/**', // Type definitions have no executable code
      ],
    },

    // Include these file patterns as tests
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
