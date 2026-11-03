import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
// @ts-expect-error The pinned JavaScript comparator has no TypeScript declarations.
import { RULE_IDS, analyzerSource } from '@ngocanhnckh/renderlint';
// @ts-expect-error The pinned JavaScript comparator has no TypeScript declarations.
import { renderlint } from '@ngocanhnckh/renderlint/playwright';
import { comparisonCases, comparisonSourceFiles } from '../src/comparison/cases.ts';
import { comparisonHTML, comparisonMarkdown, comparisonSummary, type Observation } from '../src/comparison/report.ts';
import { nativeAssertions } from '../src/comparison/native.ts';
import { measureAction, type ActionRule } from '../src/core/action-rule.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const id = `run-comparison-${Date.now()}-${randomUUID().slice(0, 6)}`, directory = resolve(root, 'artifacts', id);
await mkdir(directory, { recursive: true });
const methods = ['ui-crash-test', 'playwright-native', 'renderlint-layout'] as const;
const layoutRules = ['text-overflow', 'text-crowding', 'text-clipped', 'content-overflow', 'viewport-overflow', 'accidental-scrollbar', 'text-overlap', 'element-overlap', 'obscured-content', 'invisible-content', 'button-text-wrap', 'squashed-control'];
const rules = Object.fromEntries(RULE_IDS.map((rule: string) => [rule, layoutRules.includes(rule) ? 'error' : 'off']));
const cases = comparisonCases();
const catalog = cases.map(({ prepare, ...item }) => item);
await writeFile(resolve(directory, 'case-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
const sourcePaths = [...new Set(['scripts/compare.ts', 'src/comparison/native.ts', 'src/comparison/cases.ts', 'src/comparison/report.ts', 'src/core/action-rule.ts', 'src/controls/cases.ts', 'src/scenario/replay.ts', 'src/scenario/config.ts', 'package-lock.json', 'COMPARISON-PLAN.md', 'node_modules/@ngocanhnckh/renderlint/src/live.js', 'node_modules/@ngocanhnckh/renderlint/src/integrations/playwright.js', ...comparisonSourceFiles()])].sort();
const hashes = () => Promise.all(sourcePaths.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(resolve(root, path))).digest('hex') })));
const sources = await hashes();
const sourceHash = createHash('sha256').update(JSON.stringify({ sources, catalog })).digest('hex');

async function snapshot(page: Page, rule: ActionRule) {
  return page.evaluate(({ target, boundary }) => {
    const action = document.querySelector<HTMLElement>(target), region = document.querySelector<HTMLElement>(boundary);
    const a = action?.getBoundingClientRect(), r = region?.getBoundingClientRect();
    return { viewport: { width: innerWidth, height: innerHeight }, scroll: { x: scrollX, y: scrollY }, target: a ? { x: a.x, y: a.y, width: a.width, height: a.height, display: getComputedStyle(action!).display, visibility: getComputedStyle(action!).visibility } : null, boundary: r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null, focus: document.activeElement?.tagName ?? null };
  }, rule).catch(error => ({ snapshotError: String(error) }));
}

const server = await createServer({ configFile: resolve(root, 'vite.config.ts'), server: { port: 0, host: '127.0.0.1', open: false } });
const browser = await chromium.launch({ headless: true });
const observations: Observation[] = [];
try {
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('No local comparison server address.');
  const baseURL = `http://127.0.0.1:${address.port}`;
  for (const item of cases) {
    console.log(`${item.id} · ${item.group}`);
    for (const method of methods) {
      const context = await browser.newContext({ viewport: item.viewport, locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const started = performance.now();
      let preparationMs = 0, measurementMs = 0;
      try {
        await item.prepare(page, baseURL);
        const before = await snapshot(page, item.rule);
        preparationMs = performance.now() - started;
        let result: Observation['result'];
        if (method === 'renderlint-layout') {
          // Observe the analyzer's returned errors without changing its inputs or returned result.
          await page.evaluate(analyzerSource());
          await page.evaluate(() => {
            const w = window as unknown as { __renderlint: { analyze: (options: unknown) => { errors: string[]; meta: unknown } }; __comparisonAnalyzer: { errors: string[]; meta: unknown }[] };
            const original = w.__renderlint.analyze;
            w.__comparisonAnalyzer = [];
            Object.defineProperty(w.__renderlint, 'analyze', { configurable: true, writable: true, value(options: unknown) { const observed = original.call(this, options); w.__comparisonAnalyzer.push({ errors: observed.errors, meta: observed.meta }); return observed; } });
          });
        }
        const measureStart = performance.now();
        if (method === 'ui-crash-test') result = await measureAction(page, item.rule);
        else if (method === 'playwright-native') result = await nativeAssertions(page, item.rule);
        else {
          const findings = await renderlint(page, item.id, { role: item.id, auto: false, viewports: [item.viewport], colorSchemes: ['light'], stress: false, sweep: false, stressData: false, autoScroll: false, screenshots: false, rules, outputDir: resolve(directory, 'renderlint', item.id) });
          const analyzer = await page.evaluate(() => (window as unknown as { __comparisonAnalyzer: { errors: string[]; meta: unknown }[] }).__comparisonAnalyzer);
          result = { status: findings.some((finding: { rule: string }) => finding.rule === 'page-error') || analyzer.some(run => run.errors.length) ? 'inconclusive' : findings.length ? 'findings' : 'no-findings', findings, analyzer, scope: 'Configured broad layout audit; not a binary action-contract result.' };
        }
        measurementMs = performance.now() - measureStart;
        const after = await snapshot(page, item.rule);
        observations.push({ caseId: item.id, group: item.group, method, preparationMs, measurementMs, before, after, stateChanged: JSON.stringify(before) !== JSON.stringify(after), result, pageErrors: errors });
      } catch (error) {
        observations.push({ caseId: item.id, group: item.group, method, preparationMs, measurementMs, result: { status: 'inconclusive', reason: String(error) }, pageErrors: errors });
      } finally { await context.close(); }
      await writeFile(resolve(directory, 'observations.json'), JSON.stringify(observations, null, 2) + '\n');
    }
  }
  if (JSON.stringify(await hashes()) !== JSON.stringify(sources)) throw new Error('Comparison source files changed during the run.');
  const comparatorPackage = JSON.parse(await readFile(resolve(root, 'node_modules/@ngocanhnckh/renderlint/package.json'), 'utf8'));
  const report = { schemaVersion: 1, id, createdAt: new Date().toISOString(), status: 'completed', browser: browser.version(), node: process.version, sourceHash, sources, comparator: { name: comparatorPackage.name, version: comparatorPackage.version, repositoryCommit: 'd54018ce58a2b2faeb42e98a092bca9ec577eae3', distribution: 'Exact GitHub tarball; npm registry install returned 404.', layoutRules, settings: { stress: false, sweep: false, stressData: false, screenshots: false, singleInitialViewport: true, colorSchemes: ['light'] }, instrumentation: 'Analyzer return errors/meta recorded by a pass-through wrapper. Analyzer injection precedes measurement timing.' }, caseCount: cases.length, observations, limitations: ['Authored fixtures, not a blinded accuracy study.', 'Native trial clicks can scroll; the center-point rule has different preconditions.', 'The broad auditor may scroll/focus during analysis even when its final state is restored.', 'Timing scopes differ and analyzer injection is outside its measured phase; do not infer performance superiority.', 'No human debugging-speed or adoption evidence.'] };
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(resolve(directory, 'report.html'), comparisonHTML(report, catalog));
  await writeFile(resolve(directory, 'report.md'), comparisonMarkdown(report, catalog));
  await writeFile(resolve(directory, 'summary.json'), JSON.stringify(comparisonSummary(report, catalog), null, 2) + '\n');
  const temporary = resolve(root, 'artifacts', `${id}.tmp`);
  await writeFile(temporary, JSON.stringify({ id }) + '\n'); await rename(temporary, resolve(root, 'artifacts/comparison-latest.json'));
  console.log(`Saved ${observations.length} observations: ${directory}/report.json`);
} finally { await browser.close(); await server.close(); }
