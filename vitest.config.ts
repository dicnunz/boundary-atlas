import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['packages/**/*.{test,spec}.ts', 'packages/**/*.{test,spec}.tsx', 'apps/web/src/**/*.{test,spec}.{ts,tsx}']
  }
});
