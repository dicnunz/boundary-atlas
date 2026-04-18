import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4177'
  },
  webServer: {
    command: 'npm run build -w @boundary-atlas/web && npm run preview -w @boundary-atlas/web -- --host 127.0.0.1 --port 4177',
    port: 4177,
    reuseExistingServer: false
  }
});
