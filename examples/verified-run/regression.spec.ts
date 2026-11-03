import { test, expect } from '@playwright/test';
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
