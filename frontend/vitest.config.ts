import { defineConfig } from 'vitest/config';

/** Configures a browser-like environment for React component tests. */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});
