import type { Page } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';
import { inputAt, type BrowserRecipe, type Json } from './config.ts';

/** Shared by discovery and the exported regression. Set up data, prove consumption, then settle. */
export async function preparePage(page: Page, baseURL: string, recipe: BrowserRecipe, input: Json) {
  const url = new URL(recipe.path, baseURL);
  if (url.origin !== new URL(baseURL).origin) throw new Error('Recipe navigation must stay on the configured app origin.');
  for (const [key, pointer] of Object.entries(recipe.query ?? {})) url.searchParams.set(key, String(inputAt(input, pointer)));
  const fixtures = recipe.fixtures ?? [];
  const consumed = fixtures.map(() => 0);
  for (const resource of recipe.resources ?? []) await page.route(resource.url, route => route.fulfill({ contentType: resource.contentType, body: Buffer.from(resource.base64, 'base64') }));
  for (const [index, fixture] of fixtures.entries()) {
    await page.route(fixture.url, async route => {
      await route.fulfill({ json: inputAt(input, fixture.inputPath) });
      consumed[index]++;
    });
  }
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
  if (recipe.form) {
    const items = inputAt(input, recipe.form.itemsPath);
    if (!Array.isArray(items) || !items.length || items.length > 100 || items.some(item => typeof item !== 'string')) throw new Error('A form boundary requires 1–100 string values.');
    const field = page.locator(recipe.form.input);
    for (const item of items) {
      await field.fill(item as string, { timeout: 8000 });
      await field.press(recipe.form.submitKey, { timeout: 8000 });
    }
  }
  for (const step of recipe.setup ?? []) {
    const locator = page.locator(step.selector);
    if (step.action === 'click') await locator.click({ timeout: 8000 });
    else if (step.action === 'hover') await locator.hover({ timeout: 8000 });
    else if (step.action === 'fill') await locator.fill(step.inputPath ? String(inputAt(input, step.inputPath)) : step.value ?? '', { timeout: 8000 });
    else if (step.action === 'scroll') await locator.scrollIntoViewIfNeeded({ timeout: 8000 });
    else await locator.waitFor({ state: 'visible', timeout: 8000 });
  }
  await page.locator(recipe.ready).waitFor({ state: 'visible', timeout: 12000 });
  if (consumed.some(count => count === 0)) throw new Error('At least one declared fixture endpoint was not consumed.');
  for (const proof of recipe.proofs) {
    const locator = page.locator(proof.selector);
    if (proof.kind !== 'texts' && await locator.count() !== 1) throw new Error(`Expected exactly one rendered-input proof: ${proof.selector}`);
    const raw = proof.kind === 'texts' ? await locator.allTextContents() : proof.kind === 'text' ? await locator.textContent() : await locator.getAttribute(proof.attribute!);
    const actual = proof.kind === 'jsonAttribute' ? JSON.parse((raw as string | null) ?? 'null') : raw;
    if (!isDeepStrictEqual(actual, inputAt(input, proof.inputPath))) throw new Error(`Rendered input differs at ${proof.selector}.`);
  }
  const ready = await page.evaluate(() => Promise.race([document.fonts.ready.then(() => true), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))]));
  if (!ready) throw new Error('Fonts did not settle within the experiment budget.');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

export function viewportFor(recipe: BrowserRecipe, input: Json) {
  const viewport = { ...recipe.viewport };
  for (const dimension of ['width', 'height'] as const) {
    const pointer = recipe.viewportFromInput?.[dimension];
    if (pointer) viewport[dimension] = Number(inputAt(input, pointer));
    if (!Number.isInteger(viewport[dimension]) || viewport[dimension] < 200 || viewport[dimension] > 3000) throw new Error('Unsupported viewport dimension.');
  }
  return viewport;
}
