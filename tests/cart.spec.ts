import { test, expect } from '@playwright/test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cart from '../scenarios/cart-preview.ts';
import member from '../scenarios/member-list.ts';
import { preparePage, viewportFor } from '../src/scenario/replay.ts';
import { measureAction } from '../src/core/action-rule.ts';
import { runScenario } from '../src/scenario/run.ts';

test('pinned cart checkout is below a landscape viewport; independent actionability and a candidate CSS fix confirm it', async ({ page, baseURL }) => {
  const input = cart.cases(42)[0].input;
  await page.setViewportSize(viewportFor(cart.recipe, input));
  await preparePage(page, baseURL!, cart.recipe, input);
  const action = page.locator(cart.recipe.rule.target);
  const finding = await measureAction(page, cart.recipe.rule);
  expect(finding.status).toBe('failed');
  expect(finding.signature).toContain('|outside-viewport');
  await expect(action).not.toBeInViewport();
  await expect(action.click({ trial: true, timeout: 700 })).rejects.toThrow();
  await page.addStyleTag({ content: await readFile(new URL('../examples/cart-investigation/proposed-fix.css', import.meta.url), 'utf8') });
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport({ ratio: 1 });
  expect((await measureAction(page, cart.recipe.rule)).status).toBe('passed');
  await action.click({ trial: true });
});

test('cart header assets and real provider state reproduce without external image requests', async ({ page, baseURL, context }) => {
  await context.route('https://res.cloudinary.com/**', route => route.abort());
  await preparePage(page, baseURL!, cart.recipe, cart.baseline);
  expect((await measureAction(page, cart.recipe.rule)).status).toBe('passed');
  expect(await page.locator('img').evaluateAll(images => images.length > 0 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.cart-count')).toHaveText(String(cart.baseline.products.length));
});

test('source drift invalidates a scenario instead of saving a completed result', async ({ baseURL }) => {
  const directory = await mkdtemp(join(tmpdir(), 'ui-crash-drift-'));
  const source = join(directory, 'subject.txt');
  writeFileSync(source, 'original source');
  try {
    await expect(runScenario({ ...member, id: 'source-drift-control', sourceFiles: [source], cases: () => [{ name: 'Passing input', origin: 'curated', input: member.baseline }] }, {
      root: fileURLToPath(new URL('..', import.meta.url)), appURL: baseURL,
      onProgress: message => { if (message.includes('1/1')) writeFileSync(source, 'changed source'); },
    })).rejects.toThrow('Source files changed during the run');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
