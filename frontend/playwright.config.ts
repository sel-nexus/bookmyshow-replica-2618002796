import { defineConfig, devices } from '@playwright/test';

/** Runs browser journeys against the real local backend and Next frontend. */
export default defineConfig({
  testDir: '../e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices['iPhone 13'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'default',
      testIgnore: ['catalog.empty.spec.ts', 'catalog.delayed.spec.ts'],
      use: { baseURL: 'http://127.0.0.1:3000' }
    },
    {
      name: 'empty-catalogue',
      testMatch: 'catalog.empty.spec.ts',
      use: { baseURL: 'http://127.0.0.1:3100' }
    },
    {
      name: 'delayed-catalogue',
      testMatch: 'catalog.delayed.spec.ts',
      use: { baseURL: 'http://127.0.0.1:3200' }
    }
  ],
  webServer: [
    {
      command: 'cd ../backend && PORT=3001 DATABASE_PATH=./e2e-default.sqlite CORS_ORIGIN=http://127.0.0.1:3000 SESSION_SECRET=e2e-session-secret-value COOKIE_SECURE=false node node_modules/ts-node-dev/bin/ts-node-dev --files --respawn src/index.ts',
      url: 'http://127.0.0.1:3001/health',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'BACKEND_ORIGIN=http://127.0.0.1:3001 node node_modules/next/dist/bin/next dev -p 3000',
      url: 'http://127.0.0.1:3000',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'cd ../backend && PORT=3101 DATABASE_PATH=./e2e-empty-catalogue.sqlite CATALOGUE_EMPTY=true CORS_ORIGIN=http://127.0.0.1:3100 SESSION_SECRET=e2e-session-secret-value COOKIE_SECURE=false node node_modules/ts-node-dev/bin/ts-node-dev --files --respawn src/index.ts',
      url: 'http://127.0.0.1:3101/health',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'BACKEND_ORIGIN=http://127.0.0.1:3101 node node_modules/next/dist/bin/next dev -p 3100',
      url: 'http://127.0.0.1:3100',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'cd ../backend && PORT=3201 DATABASE_PATH=./e2e-delayed-catalogue.sqlite CATALOGUE_DELAY_MS=1500 CORS_ORIGIN=http://127.0.0.1:3200 SESSION_SECRET=e2e-session-secret-value COOKIE_SECURE=false node node_modules/ts-node-dev/bin/ts-node-dev --files --respawn src/index.ts',
      url: 'http://127.0.0.1:3201/health',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'BACKEND_ORIGIN=http://127.0.0.1:3201 node node_modules/next/dist/bin/next dev -p 3200',
      url: 'http://127.0.0.1:3200',
      timeout: 30_000,
      reuseExistingServer: false
    }
  ]
});
