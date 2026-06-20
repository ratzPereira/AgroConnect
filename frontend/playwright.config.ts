import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    permissions: ['geolocation'],
    geolocation: { latitude: 38.6667, longitude: -27.2167 },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'cliente', testMatch: /02-cliente-.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/cliente.json' }, dependencies: ['setup'] },
    { name: 'payment', testMatch: /03-payment-.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/cliente.json' }, dependencies: ['setup'] },
    { name: 'execution', testMatch: /04-execution-.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/provider.json' }, dependencies: ['setup'] },
    { name: 'backoffice', testMatch: /05-provider-.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/provider.json' }, dependencies: ['setup'] },
    { name: 'auth', testMatch: /01-auth\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
