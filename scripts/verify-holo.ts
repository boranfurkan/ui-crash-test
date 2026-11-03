import { chromium, expect } from '@playwright/test';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import config from '../scenarios/holo-grails-profile.ts';

const { values } = parseArgs({ options: { root: { type: 'string' }, url: { type: 'string', default: 'http://127.0.0.1:4180' }, 'out-dir': { type: 'string', default: 'artifacts/holo-independent' } } });
if (!values.root) throw new Error('Pass --root /path/to/the/unchanged/Holo-Grails/app. Run its built-in demo mode separately; no real backend or wallet should be configured.');
const appRoot = resolve(values.root), output = resolve(values['out-dir']!);
const snapshot = () => Promise.all(config.sourceFiles.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(resolve(appRoot, path))).digest('hex') })));
const sources = await snapshot();
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [index, input] of [config.baseline, ...Array.from({ length: 3 }, () => config.cases(42)[0].input)].entries()) {
    const context = await browser.newContext({ viewport: { width: input.width, height: input.height }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'en-GB', colorScheme: 'light' });
    try {
      const page = await context.newPage(), errors: string[] = [], backendRequests: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      // The original app's in-browser mock must be used. No backend requests are fulfilled by this check.
      await page.route(/\/trpc(?:\/|\?|$)/, route => { backendRequests.push(route.request().url()); return route.abort(); });
      await page.goto(new URL('/profile/edit', values.url).href, { waitUntil: 'domcontentloaded' });
      const name = page.locator('main form input[id$="-name"]'), handle = page.locator('main form input[id$="-handle"]'), bio = page.locator('main form textarea[id$="-bio"]');
      await name.fill(input.displayNames[0]); await handle.fill(input.handle); await bio.fill(input.bio);
      await expect(name).toHaveValue(input.displayNames[0]); await expect(handle).toHaveValue(input.handle); await expect(bio).toHaveValue(input.bio);
      const action = page.getByRole('button', { name: 'Save profile', exact: true });
      await action.scrollIntoViewIfNeeded();
      const actionBox = await action.boundingBox(), formBox = await page.locator('main form').boundingBox();
      if (!actionBox || !formBox) throw new Error('Native Playwright did not return the actual form/action geometry.');
      const overflow = Math.max(0, formBox.x - actionBox.x, formBox.y - actionBox.y, actionBox.x + actionBox.width - formBox.x - formBox.width, actionBox.y + actionBox.height - formBox.y - formBox.height);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(actionBox.y + actionBox.height / 2).toBeLessThan(input.height);
      await action.click({ trial: true, timeout: 3000 });
      await page.screenshot({ path: resolve(output, `form-${index}.png`), fullPage: true });
      await action.click();
      await expect(page).toHaveURL(new RegExp(`/u/${input.handle}$`), { timeout: 30000 });
      const savedHeading = page.getByRole('heading', { name: input.displayNames[0], exact: true });
      await expect(savedHeading).toBeVisible({ timeout: 30000 });
      if (input.bio) await expect(page.locator('main header').filter({ has: savedHeading })).toContainText(input.bio);
      await page.waitForTimeout(1000); // Let the completed navigation paint before retaining a visual, including view-transition snapshots.
      await page.screenshot({ path: resolve(output, `saved-${index}.png`), fullPage: false });
      const nameBounds = () => savedHeading.evaluate(element => {
        const header = element.closest('header')!;
        const region = header.getBoundingClientRect(), box = element.getBoundingClientRect();
        const range = document.createRange(); range.selectNodeContents(element);
        const rects = [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }));
        const clippedPx = Math.max(0, ...rects.map(rect => rect.right - region.right), ...rects.map(rect => region.left - rect.left));
        return { status: clippedPx > 1 ? 'failed' : 'passed', clippedPx, text: element.textContent, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, heading: { left: box.left, right: box.right }, boundary: { left: region.left, right: region.right }, rects, boundaryOverflow: getComputedStyle(header).overflow };
      });
      const profileName = await nameBounds();
      let cssCandidate;
      if (index === 1 && profileName.status === 'failed') {
        await page.addStyleTag({ content: 'main header h1 { overflow-wrap: anywhere; }' });
        await page.evaluate(() => new Promise<void>(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))));
        cssCandidate = { rule: 'main header h1 { overflow-wrap: anywhere; }', scope: 'Investigation-only browser injection; application source remains unchanged.', finding: await nameBounds() };
        await page.screenshot({ path: resolve(output, 'name-wrap-candidate.png'), fullPage: false });
      }
      expect(errors).toEqual([]); expect(backendRequests).toEqual([]);
      results.push({ input, actualSavedPath: new URL(page.url()).pathname, containmentOverflow: overflow, nativeTrialClick: 'passed', actualSave: 'passed', renderedValues: 'matched', profileName, cssCandidate, pageErrors: errors, backendRequests });
    } finally { await context.close(); }
  }
  if (JSON.stringify(sources) !== JSON.stringify(await snapshot())) throw new Error('Declared application files changed during verification.');
  const report = { createdAt: new Date().toISOString(), browser: browser.version(), node: process.version, appRevision: config.provenance.appRevision, browserPreferences: { reducedMotion: 'reduce', locale: 'en-GB', colorScheme: 'light' }, sources, results, scope: 'Independent native Playwright checks and actual saves in the unchanged app’s built-in in-memory demo. No UI Crash Test measurement/replay function is used. This is an assisted integration, not a human trial.' };
  await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
