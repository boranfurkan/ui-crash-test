import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import cart from '../scenarios/cart-preview.ts';
if (cart.recipe.rule.kind === 'text-fit') throw new Error('Cart investigation expects its declared action rule.');
const cartRule = cart.recipe.rule;
import { preparePage, viewportFor } from '../src/scenario/replay.ts';
import { measureAction } from '../src/core/action-rule.ts';
import type { CartInput } from '../scenarios/cart-preview.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const appURL = process.env.UI_CRASH_BASE_URL ?? 'http://127.0.0.1:4173';
const { id } = JSON.parse(await readFile(resolve(root, 'artifacts/scenario-cart-preview.json'), 'utf8'));
const saved = JSON.parse(await readFile(resolve(root, 'artifacts', id, 'case.json'), 'utf8'));
const patch = await readFile(resolve(root, 'fixtures/compat-app/cart-candidate.css'), 'utf8');
if (!isDeepStrictEqual(saved.recipe, cart.recipe)) throw new Error('Saved recipe differs from the current adapter; rerun the cart campaign first.');
const directory = resolve(root, 'artifacts/cart-investigation');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: viewportFor(cart.recipe, saved.input), locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  await preparePage(page, appURL, cart.recipe, saved.input);
  const original = await measureAction(page, cartRule);
  if (original.status !== 'failed' || !original.signature.endsWith('|outside-viewport')) throw new Error('Expected the same saved viewport failure.');
  await page.screenshot({ path: resolve(directory, 'original.png') });
  let originalTrialClick = false;
  try { await page.locator(cart.recipe.rule.target).click({ trial: true, timeout: 1200 }); originalTrialClick = true; } catch {}
  if (originalTrialClick) throw new Error('Independent Playwright trial click unexpectedly succeeded.');
  const originalBox = await page.locator(cart.recipe.rule.target).boundingBox();
  const viewport = page.viewportSize()!;
  if (!originalBox || originalBox.y + originalBox.height / 2 <= viewport.height) throw new Error('Expected the checkout center below the viewport after scrolling attempts.');
  await page.addStyleTag({ content: patch });
  await page.locator(cart.recipe.rule.target).scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const fixed = await measureAction(page, cartRule);
  await page.locator(cart.recipe.rule.target).click({ trial: true, timeout: 1500 });
  if (fixed.status !== 'passed') throw new Error('The investigation-only patch did not restore reachability.');
  await page.screenshot({ path: resolve(directory, 'candidate-fix.png') });
  await context.close();

  const verification = [];
  for (const item of [{ name: 'Baseline', input: cart.baseline }, ...cart.cases(42), { name: 'Reduced saved case', input: saved.input as CartInput }]) {
    const next = await browser.newContext({ viewport: viewportFor(cart.recipe, item.input), locale: 'en-GB', reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const candidate = await next.newPage();
      await preparePage(candidate, appURL, cart.recipe, item.input);
      await candidate.addStyleTag({ content: patch });
      await candidate.locator(cart.recipe.rule.target).scrollIntoViewIfNeeded();
      const finding = await measureAction(candidate, cart.recipe.rule);
      await candidate.locator(cart.recipe.rule.target).click({ trial: true, timeout: 1500 });
      if (finding.status !== 'passed') throw new Error(`Candidate patch did not pass ${item.name}`);
      verification.push({ name: item.name, viewport: viewportFor(cart.recipe, item.input), status: finding.status, trialClick: true });
    } finally { await next.close(); }
  }
  const result = { schemaVersion: 1, createdAt: new Date().toISOString(), runId: id, browser: browser.version(), sourceHash: saved.environment.sourceHash, patchSHA256: createHash('sha256').update(patch).digest('hex'), original, originalTrialClick, originalBox, viewport, fixed, fixedTrialClick: true, verification, caveat: 'Pinned 2021 upstream source mounted in a local harness. This is not a finding against the current deployed site. The candidate patch is injected only in verification pages and has not been applied to upstream source.' };
  await writeFile(resolve(directory, 'investigation.json'), JSON.stringify(result, null, 2) + '\n');
  await writeFile(resolve(directory, 'case.json'), JSON.stringify(saved, null, 2) + '\n');
  await writeFile(resolve(directory, 'proposed-fix.css'), patch);
  await writeFile(resolve(directory, 'replay-bundle.zip'), await readFile(resolve(root, 'artifacts', id, 'replay-bundle.zip')));
  const e = (value: unknown) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout below the viewport · UI Crash Test</title><style>body{font:15px/1.65 system-ui;margin:0;background:#f5f4ed;color:#203e2d}main{max-width:1100px;padding:36px 20px;margin:auto}h1{font-size:36px;line-height:1.2}a{color:#285e43}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:20px}figure{margin:0;padding:12px;border:1px solid #d7ded1;border-radius:8px;background:white}img{width:100%;height:auto}figcaption{margin-bottom:10px}small{color:#69786b}pre{overflow:auto;padding:16px;background:#e7ece2;border-radius:8px;font-size:13px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px;text-align:left;border-bottom:1px solid #d7ded1}.scroll{overflow:auto}code{overflow-wrap:anywhere}</style></head><body><main><a href="/">← UI Crash Test</a><p>EXTERNAL-SOURCE INVESTIGATION · ${e(result.createdAt)}</p><h1>Checkout below the viewport.</h1><p>In the pinned shopping-app header, a 388px cart popup stays anchored to a fixed header. At 640×320, the checkout button’s center remains at y=${Math.round(originalBox.y + originalBox.height / 2)} after scrolling attempts, below the viewport’s 320px edge.</p><p><strong>Scope:</strong> unchanged source from <a href="https://github.com/sivadass/react-shopping-cart/tree/0e867f1caf6abd7114aab6ae704a2824064e84e0">sivadass/react-shopping-cart, revision 0e867f1 (2021)</a>, mounted in a local API fixture harness. This is not a finding against the current deployed site. Local fallback fonts and a modern compatibility runtime are used.</p><div class="grid"><figure><figcaption><strong>Original · cannot reach checkout with a pointer</strong><br><small>Playwright trial click also fails after trying to scroll.</small></figcaption><img src="original.png" alt="Original cart popup cut off below a 320px-high viewport"></figure><figure><figcaption><strong>Candidate CSS · same saved cart and viewport</strong><br><small>Both the rule and Playwright trial click pass.</small></figcaption><img src="candidate-fix.png" alt="The candidate height and flex fix keeps checkout inside the same viewport"></figure></div><h2>Independent check</h2><p>The generic campaign confirmed the same failure in three fresh contexts, reduced the fixture and executed its exported test. Separately, Playwright’s trial click fails on the original and passes after the candidate CSS is injected. The candidate also passes the normal control, all 14 supplied cases and the reduced saved input: ${verification.length}/${verification.length} checks. These results do not establish superiority over an ordinary Playwright assertion.</p><p><a href="replay-bundle.zip" download>Download the failing regression</a> · <a href="case.json">Saved input and recipe</a> · <a href="investigation.json">Independent verification details</a></p><h2>Reduced input</h2><pre>${e(JSON.stringify(saved.input, null, 2))}</pre><h2>Candidate CSS, for review</h2><p>The proposed change caps popup height to the available viewport and lets the item list scroll while the footer remains visible. It was injected only in verification pages; no vendored upstream file was changed.</p><pre>${e(patch)}</pre><p><a href="proposed-fix.css">Download candidate CSS</a></p><h2>Candidate verification</h2><div class="scroll"><table><thead><tr><th>Case</th><th>Viewport</th><th>Rule</th><th>Trial click</th></tr></thead><tbody>${verification.map(item => `<tr><td>${e(item.name)}</td><td>${item.viewport.width}×${item.viewport.height}</td><td>passed</td><td>passed</td></tr>`).join('')}</tbody></table></div><p>Chromium ${e(result.browser)}. Original source fingerprint: <code>${e(result.sourceHash)}</code>. Candidate CSS SHA256: <code>${e(result.patchSHA256)}</code>.</p></main></body></html>`;
  await writeFile(resolve(directory, 'report.html'), html);
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
