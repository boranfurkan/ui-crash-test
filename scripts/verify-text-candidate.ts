import { chromium } from '@playwright/test';
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import type { BrowserRecipe, Json } from '../src/scenario/config.ts';
import type { RuleFinding } from '../src/core/rules.ts';

const { values } = parseArgs({ options: { case: { type: 'string' }, root: { type: 'string' }, url: { type: 'string' } } });
if (!values.case || !values.root) throw new Error('Pass --case /path/to/saved/case.json --root /path/to/the/unchanged/app.');
const file = resolve(values.case), directory = dirname(file), root = resolve(values.root);
const saved = JSON.parse(await readFile(file, 'utf8')) as { recipe: BrowserRecipe; input: Json; failureSignature: string; appURL: string; environment: { sources: { path: string; sha256: string }[] } };
if (saved.recipe.rule.kind !== 'text-fit') throw new Error('This investigation expects a saved text-fit case.');
const appSources = saved.environment.sources.filter(source => !source.path.startsWith('engine/') && !source.path.startsWith('/'));
const verifySources = async () => { for (const source of appSources) if (createHash('sha256').update(await readFile(resolve(root, source.path))).digest('hex') !== source.sha256) throw new Error(`Declared app source changed: ${source.path}`); };
await verifySources();
// Import the exact exported JavaScript, not the source checkout's current implementation.
const { preparePage, viewportFor } = await import(pathToFileURL(resolve(directory, 'scenario/replay.js')).href);
const { measureRule } = await import(pathToFileURL(resolve(directory, 'core/rules.js')).href);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: viewportFor(saved.recipe, saved.input), locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce' });
  await preparePage(page, values.url ?? saved.appURL, saved.recipe, saved.input);
  const original: RuleFinding = await measureRule(page, saved.recipe.rule);
  if (original.status !== 'failed' || original.signature !== saved.failureSignature) throw new Error('The saved reduced case did not reproduce the same text-fit failure.');
  await page.screenshot({ path: resolve(directory, 'candidate-before.png'), fullPage: false });
  const css = 'main header h1 { overflow-wrap: anywhere; }';
  await page.addStyleTag({ content: css });
  await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  const candidate: RuleFinding = await measureRule(page, saved.recipe.rule);
  if (candidate.status !== 'passed') throw new Error('The browser-only wrapping candidate did not pass the saved rule.');
  await page.screenshot({ path: resolve(directory, 'candidate-after.png'), fullPage: false });
  await verifySources();
  await writeFile(resolve(directory, 'candidate-verification.json'), JSON.stringify({ createdAt: new Date().toISOString(), browser: browser.version(), original, candidate, css, input: saved.input, declaredAppFilesUnchanged: true, scope: 'Same saved reduced input and actual exported rule implementation. CSS is injected into this browser page only; no application source repair or production fix is claimed.' }, null, 2) + '\n');
  console.log('Saved reduced failure reproduced; browser-only wrapping candidate passes; declared app sources are unchanged.');
} finally { await browser.close(); }
