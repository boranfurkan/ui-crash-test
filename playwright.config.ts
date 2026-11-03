import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: ['browser.spec.ts', 'controls.spec.ts', 'cart.spec.ts', 'todomvc.spec.ts', 'doctor.spec.ts', 'text-rule.spec.ts'], workers: 1, retries: 0, timeout: 20000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1000, height: 900 }, headless: true },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 30000 },
});
