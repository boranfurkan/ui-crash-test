import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: '.', testMatch: 'regression.spec.ts', workers: 1, retries: 0, timeout: 25000, outputDir: './test-results', use: { baseURL: process.env.UI_CRASH_BASE_URL ?? "http://127.0.0.1:4173", locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', headless: true } });
