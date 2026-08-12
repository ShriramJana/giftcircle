import { defineConfig, devices } from '@playwright/test';

/**
 * Runs the app in credential-free memory mode (seeded fixtures) so the e2e
 * flow needs no Supabase project. Supabase env vars are blanked for the
 * server under test.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx next start -p 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    },
  },
});
