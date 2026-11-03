import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import type { BrowserRecipe, Json } from './config.ts';
import { runtimeExtension, runtimePath } from './runtime.ts';

export async function exportScenario(directory: string, saved: { input: Json; recipe: BrowserRecipe; failureSignature: string; [key: string]: unknown }) {
  const files: Record<string, string> = {};
  for (const path of ['scenario/config', 'scenario/replay', 'core/action-rule']) files[path + runtimeExtension] = await readFile(runtimePath(path), 'utf8');
  files['case.json'] = JSON.stringify({ schemaVersion: 2, ...saved }, null, 2) + '\n';
  files['regression.spec.ts'] = `import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { preparePage, viewportFor } from './scenario/replay${runtimeExtension}';
import { measureAction } from './core/action-rule${runtimeExtension}';
const saved = JSON.parse(readFileSync(new URL('./case.json', import.meta.url), 'utf8'));
test('saved scenario action remains reachable', async ({ page, baseURL }) => {
  await page.setViewportSize(viewportFor(saved.recipe, saved.input));
  await preparePage(page, baseURL!, saved.recipe, saved.input);
  const finding = await measureAction(page, saved.recipe.rule);
  await test.info().attach('action-finding', { body: Buffer.from(JSON.stringify(finding)), contentType: 'application/json' });
  expect(finding.status, JSON.stringify(finding, null, 2)).toBe('passed');
});
`;
  files['playwright.config.ts'] = `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: '.', testMatch: 'regression.spec.ts', workers: 1, retries: 0, timeout: 25000, outputDir: './test-results', use: { baseURL: process.env.UI_CRASH_BASE_URL ?? ${JSON.stringify(saved.appURL ?? 'http://127.0.0.1:4173')}, locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', headless: true } });
`;
  files['package.json'] = JSON.stringify({ name: 'saved-ui-scenario', private: true, type: 'module', scripts: { test: 'playwright test' }, devDependencies: { '@playwright/test': '1.64.1' } }, null, 2) + '\n';
  files['README.md'] = '# Saved UI scenario regression\n\nKeep the configured application and fixture boundary available. This bundle contains the saved input, browser recipe and the exact replay and measurement sources, not the application.\n\nRun `npm install`, `npx playwright install chromium`, then `npm test`. Set `UI_CRASH_BASE_URL` to point to your running app. The assertion should fail with the confirmed defect and pass after you repair the app. No repair or passing variant is assumed or generated.\n\nThe fixture is already validated when saved. Replay uses it directly, without importing or rerunning the generator. The seed and source hashes are provenance.\n';
  for (const [path, content] of Object.entries(files)) { await mkdir(dirname(resolve(directory, path)), { recursive: true }); await writeFile(resolve(directory, path), content); }
  await writeFile(resolve(directory, 'replay-bundle.zip'), zipSync(Object.fromEntries(Object.entries(files).map(([path, content]) => [path, strToU8(content)]))));
}
