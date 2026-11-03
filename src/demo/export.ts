import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { RULE, type CaseInput } from "./model.ts";

export async function exportRegression(root: string, directory: string, input: CaseInput, metadata: Record<string, unknown>) {
  const rule = await readFile(resolve(root, 'src/core/action-rule.ts'), 'utf8');
  const saved = JSON.stringify({ schemaVersion: 1, input, rule: RULE, ...metadata }, null, 2) + '\n';
  const spec = `import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { measureAction } from './action-rule.ts';

const saved = JSON.parse(readFileSync(new URL('./case.json', import.meta.url), 'utf8'));

test('member action remains reachable with the saved valid input', async ({ page }) => {
  await page.route('**/api/members?*', route => route.fulfill({ json: saved.input }));
  const layout = process.env.UI_CRASH_LAYOUT ?? 'broken';
  if (!['broken', 'fixed'].includes(layout)) throw new Error('Unknown layout variant.');
  await page.goto('/fixture?layout=' + layout + '&width=' + saved.input.containerWidth);
  const stage = page.locator('[data-fixture-stage][data-ready="true"]');
  await stage.waitFor();
  expect(JSON.parse(await stage.getAttribute('data-input') ?? 'null')).toEqual(saved.input);
  const ready = await page.evaluate(() => Promise.race([document.fonts.ready.then(() => true), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))]));
  expect(ready, 'Fonts must settle before measuring').toBe(true);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const finding = await measureAction(page, saved.rule);
  await test.info().attach('action-finding', { body: Buffer.from(JSON.stringify(finding)), contentType: 'application/json' });
  expect(finding.status, JSON.stringify(finding, null, 2)).toBe('passed');
});
`;
  const config = `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'regression.spec.ts', workers: 1, retries: 0, timeout: 20000,
  outputDir: './test-results/' + (process.env.UI_CRASH_LAYOUT ?? 'broken'),
  use: { baseURL: process.env.UI_CRASH_BASE_URL ?? 'http://127.0.0.1:4173', viewport: { width: 1000, height: 900 }, locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', headless: true },
});
`;
  const readme = `# Saved UI Crash Test regression

This bundle targets the member-list demo's /fixture route and /api/members input boundary.
It is a runnable regression for that adapter, not a standalone copy of the application.
The JSON stores the actual reduced input; replay does not regenerate it from a seed.
The measurement source is copied verbatim from the runner.

1. Keep the UI Crash Test app running with npm run dev.
2. In an extracted bundle: npm install, then npx playwright install chromium.
3. npm test tests the original broken layout and should fail until the layout is repaired.
4. UI_CRASH_LAYOUT=fixed npm test verifies the included fixed demo variant (POSIX shells).
   PowerShell: $env:UI_CRASH_LAYOUT='fixed'; npm test
5. UI_CRASH_BASE_URL can point at the same demo adapter at another loopback port.

Both layout variants are included in the demonstration. The tool does not patch source files.
Copy the fixture and assertion into an application's existing Playwright tests after adapting its data boundary and locators.
`;
  const files: Record<string, string> = {
    'case.json': saved, 'action-rule.ts': rule, 'regression.spec.ts': spec, 'playwright.config.ts': config,
    'package.json': JSON.stringify({ name: 'saved-ui-regression', private: true, type: 'module', scripts: { test: 'playwright test' }, devDependencies: { '@playwright/test': '1.64.1' } }, null, 2) + '\n',
    'README.md': readme,
  };
  for (const [name, text] of Object.entries(files)) await writeFile(resolve(directory, name), text);
  await writeFile(resolve(directory, 'replay-bundle.zip'), zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)]))));
}
