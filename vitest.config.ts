/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx', 'src/__tests__/**/*.spec.ts', 'src/__tests__/**/*.spec.tsx'],
    exclude: ['node_modules', 'dist', 'src/__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/kernel/**/*.ts'],
      exclude: ['src/kernel/**/*.test.ts', 'node_modules'],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
    // Silence localforage / browser API warnings in node environment.
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
