import { test, expect } from '@playwright/test';
import { measureAction } from '../src/core/action-rule.ts';
import { measureRule } from '../src/core/rules.ts';
import { RULE, WORST_CASE, cloneInput } from "../src/demo/model.ts";
import { compatBaseline, compatScenarios } from '../scenarios/compat.ts';
import { preparePage, viewportFor } from '../src/scenario/replay.ts';

test('normal input passes; the same realistic stress input fails before and passes after the flex fix', async ({ page }) => {
  await page.goto('/fixture?layout=broken&width=360');
  await page.locator('[data-ready="true"]').waitFor();
  expect((await measureAction(page, RULE)).status).toBe('passed');
  await page.route('**/api/members?*', route => route.fulfill({ json: WORST_CASE }));
  await page.goto('/fixture?layout=broken&width=360');
  await page.locator('[data-ready="true"]').waitFor();
  const broken = await measureAction(page, RULE);
  expect(broken.status).toBe('failed');
  expect(broken.overflowPx).toBeGreaterThan(1);
  await page.goto('/fixture?layout=fixed&width=360');
  await page.locator('[data-ready="true"]').waitFor();
  const fixed = await measureAction(page, RULE);
  expect(fixed.status).toBe('passed');
  expect(broken.signature).toContain('|outside-boundary');
  expect(fixed.signature).toContain('|passed');
});

test('intentional text truncation passes while an actual pointer-blocking overlay fails the declared action rule', async ({ page }) => {
  await page.route('**/api/members?*', route => route.fulfill({ json: WORST_CASE }));
  await page.goto('/fixture?layout=fixed&width=360');
  await page.locator('[data-ready="true"]').waitFor();
  expect(await page.locator('.member-email').first().evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  expect((await measureAction(page, RULE)).status).toBe('passed');
  await page.locator(RULE.target).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '999', background: '#eee' });
    document.body.append(overlay);
  });
  const blocked = await measureAction(page, RULE);
  expect(blocked.status).toBe('failed');
  expect(blocked.contained).toBe(true);
  expect(blocked.receivesEvents).toBe(false);
  expect(blocked.signature).toContain('|pointer-blocked');
});

test('a missing target is inconclusive and never masquerades as a passing layout', async ({ page }) => {
  await page.goto('/fixture?layout=fixed&width=360');
  await page.locator('[data-ready="true"]').waitFor();
  await page.locator(RULE.target).evaluate(element => element.remove());
  expect((await measureAction(page, RULE)).status).toBe('inconclusive');
});

test('the responsive dashboard and live fixture controls work without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the breaking point.');
  await page.getByRole('button', { name: 'Fixture lab', exact: true }).click();
  await page.getByRole('button', { name: 'Worst case', exact: true }).click();
  const fixture = page.frameLocator('iframe');
  await expect(fixture.locator('[data-member-id="member-primary"] .member-name')).toHaveText(WORST_CASE.members[0].name);
  await page.getByRole('button', { name: 'Fixed layout', exact: true }).click();
  await expect(fixture.locator('.member-list')).toHaveAttribute('data-layout', 'fixed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the campaign endpoint rejects invalid options without launching a run', async ({ request }) => {
  const response = await request.post('/api/run', { data: { seed: -1, width: 360 } });
  expect(response.status()).toBe(400);
});

test('a real portal dialog remains usable with long content at constrained height after allowed scrolling', async ({ page, baseURL }) => {
  const config = compatScenarios[1];
  const input = config.cases(42)[2].input;
  await page.setViewportSize(viewportFor(config.recipe, input));
  await preparePage(page, baseURL!, config.recipe, input);
  const action = page.locator(config.recipe.rule.target);
  expect((await measureRule(page, config.recipe.rule)).status).toBe('passed');
  // Radix portals its dialog outside the fixture main. The declared boundary follows the portal.
  expect(await action.evaluate(element => !!element.closest('main'))).toBe(false);
  await action.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a table with a long valid email allows horizontal scrolling without being called broken', async ({ page, baseURL }) => {
  const config = compatScenarios[2];
  const input = config.cases(42)[3].input;
  await page.setViewportSize(viewportFor(config.recipe, input));
  await preparePage(page, baseURL!, config.recipe, input);
  expect((await measureRule(page, config.recipe.rule)).status).toBe('passed');
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(element => element.scrollLeft > 0))).toBe(true);
});

test('an input proof mismatch prevents measurement even when the fixture endpoint is consumed', async ({ page, baseURL }) => {
  const recipe = structuredClone(compatScenarios[0].recipe);
  recipe.proofs[1].inputPath = '/description';
  await expect(preparePage(page, baseURL!, recipe, compatBaseline)).rejects.toThrow('Rendered input differs');
});

test('an unused fixture route prevents default application data from producing a false pass', async ({ page, baseURL }) => {
  const recipe = structuredClone(compatScenarios[0].recipe);
  recipe.fixtures![0].url = '**/unused-endpoint';
  await expect(preparePage(page, baseURL!, recipe, compatBaseline)).rejects.toThrow('fixture endpoint was not consumed');
});

test('external scenario API rejects unknown configs and invalid seeds', async ({ request }) => {
  expect((await request.post('/api/scenarios/run', { data: { scenario: 'unknown' } })).status()).toBe(400);
  expect((await request.post('/api/scenarios/run', { data: { scenario: 'dialog', seed: -1 } })).status()).toBe(400);
});
