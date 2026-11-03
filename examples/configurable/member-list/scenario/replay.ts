import type { Page } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';
import { inputAt, type BrowserRecipe, type Json } from './config.ts';

/** Shared by discovery and the exported regression. Set up data, prove consumption, then settle. */
export async function preparePage(page: Page, baseURL: string, recipe: BrowserRecipe, input: Json) {
  const url = new URL(recipe.path, baseURL);
  if (url.origin !== new URL(baseURL).origin) throw new Error('Recipe navigation must stay on the configured app origin.');
  for (const [key, pointer] of Object.entries(recipe.query ?? {})) url.searchParams.set(key, String(inputAt(input, pointer)));
  const consumed = recipe.fixtures.map(() => 0);
  for (const [index, fixture] of recipe.fixtures.entries()) {
    await page.route(fixture.url, async route => {
      await route.fulfill({ json: inputAt(input, fixture.inputPath) });
      consumed[index]++;
    });
  }
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const step of recipe.setup ?? []) {
    const locator = page.locator(step.selector);
    if (step.action === 'click') await locator.click({ timeout: 8000 });
    else if (step.action === 'fill') await locator.fill(step.inputPath ? String(inputAt(input, step.inputPath)) : step.value ?? '', { timeout: 8000 });
    else if (step.action === 'scroll') await locator.scrollIntoViewIfNeeded({ timeout: 8000 });
    else await locator.waitFor({ state: 'visible', timeout: 8000 });
  }
  await page.locator(recipe.ready).waitFor({ state: 'visible', timeout: 12000 });
  if (consumed.some(count => count === 0)) throw new Error('At least one declared fixture endpoint was not consumed.');
  for (const proof of recipe.proofs) {
    const locator = page.locator(proof.selector);
    if (await locator.count() !== 1) throw new Error(`Expected exactly one rendered-input proof: ${proof.selector}`);
    const raw = proof.kind === 'text' ? await locator.textContent() : await locator.getAttribute(proof.attribute!);
    const actual = proof.kind === 'jsonAttribute' ? JSON.parse(raw ?? 'null') : raw;
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
