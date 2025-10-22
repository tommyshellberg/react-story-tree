import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point - where tsup starts bundling
  entry: ['src/index.ts'],

  // Output both ESM (.mjs) and CommonJS (.js) formats
  // ESM: Modern JavaScript modules (import/export)
  // CJS: Older Node.js format (require/module.exports)
  format: ['esm', 'cjs'],

  // Generate TypeScript declaration files (.d.ts)
  dts: true,

  // Split output into chunks for better tree-shaking
  // This means users only bundle what they actually import
  splitting: true,

  // Generate source maps for debugging
  sourcemap: true,

  // Clean dist folder before each build
  clean: true,

  // Don't bundle these packages - they're provided by the user
  external: [
    'react',
    'react-dom',
    '@mui/material',
    '@emotion/react',
    '@emotion/styled',
  ],

  // Minify production builds
  minify: false, // Set to true for npm publish

  // Target environment
  target: 'es2020',

  // Watch mode options (for pnpm dev)
  watch: process.argv.includes('--watch'),
});
