import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import todomvc from '../scenarios/todomvc-vue.ts';
import { preparePage, viewportFor } from '../src/scenario/replay.ts';
import { measureAction } from '../src/core/action-rule.ts';

test('the unchanged Vue app consumes form input, reveals delete on hover and deletes the actual first task', async ({ page, baseURL }) => {
  const errors: string[] = [], apiRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  const recipe = JSON.parse(JSON.stringify(todomvc.recipe));
  await page.setViewportSize(viewportFor(recipe, todomvc.baseline));
  await preparePage(page, baseURL!, recipe, todomvc.baseline);
  expect((await measureAction(page, recipe.rule)).status).toBe('passed');
  expect(await page.locator('.todoapp').evaluate(element => '__vue_app__' in element)).toBe(true);
  expect(await page.locator('script[src]').evaluateAll(scripts => scripts.every(script => (script as HTMLScriptElement).src.includes('/subjects/todomvc/')))).toBe(true);
  await page.locator(recipe.rule.target).click();
  await expect(page.locator('.todo-list .view > label')).toHaveText(todomvc.baseline.titles.slice(1));
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('a form submission that does not create the supplied tasks fails the rendered-list proof', async ({ page, baseURL }) => {
  const recipe = structuredClone(todomvc.recipe);
  recipe.form!.submitKey = 'Tab';
  recipe.setup = [];
  recipe.ready = '.todoapp';
  await expect(preparePage(page, baseURL!, recipe, todomvc.baseline)).rejects.toThrow('Rendered input differs');
});

test('form fixtures reject non-string lists rather than silently coercing input', async ({ page, baseURL }) => {
  await expect(preparePage(page, baseURL!, todomvc.recipe, { ...todomvc.baseline, titles: [123] })).rejects.toThrow('requires 1–100 string values');
});

test('the served TodoMVC distribution and metadata match pinned upstream bytes without Vite rewriting', async ({ request }) => {
  const manifest: { files: { path: string; gitBlob: string }[] } = JSON.parse(await readFile(new URL('../fixtures/todomvc/provenance.json', import.meta.url), 'utf8'));
  for (const file of manifest.files.filter(file => file.path.startsWith('examples/vue/dist/') || file.path === 'learn.json')) {
    const response = await request.get(`/subjects/todomvc/${file.path}`);
    expect(response.status()).toBe(200);
    const body = await response.body();
    const hash = createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
    expect(hash, `Upstream bytes were rewritten: ${file.path}`).toBe(file.gitBlob);
  }
  expect((await request.get('/subjects/todomvc/package.json')).status()).toBe(404);
});
