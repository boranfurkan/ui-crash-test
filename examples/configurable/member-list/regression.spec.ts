import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { preparePage, viewportFor } from './scenario/replay.ts';
import { measureAction } from './core/action-rule.ts';
const saved = JSON.parse(readFileSync(new URL('./case.json', import.meta.url), 'utf8'));
test('saved scenario action remains reachable', async ({ page, baseURL }) => {
  await page.setViewportSize(viewportFor(saved.recipe, saved.input));
  await preparePage(page, baseURL!, saved.recipe, saved.input);
  const finding = await measureAction(page, saved.recipe.rule);
  await test.info().attach('action-finding', { body: Buffer.from(JSON.stringify(finding)), contentType: 'application/json' });
  expect(finding.status, JSON.stringify(finding, null, 2)).toBe('passed');
});
