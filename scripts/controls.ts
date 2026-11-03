import { chromium } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROL_RULE, RULE_CONTROLS, mountControl } from '../src/controls/cases.ts';
import { measureAction, type ActionFinding } from '../src/core/action-rule.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const id = `run-controls-${Date.now()}-${randomUUID().slice(0, 6)}`;
const directory = resolve(root, 'artifacts', id);
await mkdir(directory, { recursive: true });
const sourceFiles = ['src/core/action-rule.ts', 'src/controls/cases.ts'];
const sources = await Promise.all(sourceFiles.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(resolve(root, path))).digest('hex') })));
const sourceHash = createHash('sha256').update(JSON.stringify(sources)).digest('hex');
type Result = { id: string; name: string; category: string; expected: string; finding: ActionFinding; matched: boolean; explanation: string; trialClick: boolean | null; screenshot: boolean; scroll: boolean };
const results: Result[] = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const control of RULE_CONTROLS) {
    const context = await browser.newContext({ viewport: { width: 600, height: 400 }, locale: 'en-GB', reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await mountControl(page, control);
      const finding = await measureAction(page, control.rule ?? CONTROL_RULE);
      if (control.screenshot) await page.screenshot({ path: resolve(directory, `${control.id}.png`) });
      let trialClick: boolean | null = null;
      if (control.category === 'healthy') {
        try { await page.locator(CONTROL_RULE.target).click({ trial: true, timeout: 1500 }); trialClick = true; } catch { trialClick = false; }
      }
      const matched = finding.status === control.expected && (!control.suffix || finding.signature.endsWith(`|${control.suffix}`)) && trialClick !== false;
      results.push({ id: control.id, name: control.name, category: control.category, expected: control.expected, finding, matched, explanation: control.explanation, trialClick, screenshot: !!control.screenshot, scroll: !!control.scroll });
      await writeFile(resolve(directory, `${control.id}.html`), control.html);
      console.log(`${matched ? '✓' : '✗'} ${control.name}: ${finding.status}`);
    } finally { await context.close(); }
  }
  const report = { schemaVersion: 1, id, createdAt: new Date().toISOString(), browser: browser.version(), viewport: { width: 600, height: 400 }, sourceHash, sources,
    summary: { checked: results.length, matched: results.filter(result => result.matched).length, mismatched: results.filter(result => !result.matched).length, healthy: results.filter(result => result.category === 'healthy').length, defects: results.filter(result => result.category === 'defect').length, uncertain: results.filter(result => result.category === 'uncertain').length, limitations: results.filter(result => result.category === 'limitation').length }, results };
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(resolve(directory, 'action-rule.ts'), await readFile(resolve(root, 'src/core/action-rule.ts')));
  const e = (value: unknown) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rule controls · UI Crash Test</title><style>body{font:15px/1.6 system-ui;background:#f5f4ed;color:#1c3c2c;margin:0}main{max-width:1150px;padding:32px 20px;margin:auto}h1{font-size:36px;line-height:1.2}a{color:#285e43}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #d6dfd1;vertical-align:top}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}figure{margin:0;padding:12px;background:white;border:1px solid #d6dfd1;border-radius:8px}img{width:100%;height:auto}small{color:#647468}.ok{color:#266244}.bad{color:#a64023}code{overflow-wrap:anywhere}</style></head><body><main><a href="/">← UI Crash Test</a><p>MEASUREMENT CONTROLS · ${e(report.createdAt)}</p><h1>${report.summary.matched}/${report.summary.checked} expected outcomes matched</h1><p>Curated synthetic scenes test the declared containment and center-point hit rule. These are regression controls, not an independent accuracy benchmark. Healthy controls also pass Playwright’s trial click after the measurement.</p><p>${report.summary.healthy} healthy controls · ${report.summary.defects} deliberately broken scenes · ${report.summary.uncertain} uncertain states · ${report.summary.limitations} documented scope limits.</p><h2>Known scope limits</h2><p>A clipped edge or a corner-only overlay can pass if the center remains available. This rule does not establish full hitbox visibility, readability, keyboard usability or accessibility compliance. A contained off-screen action remains inconclusive until a scrolling policy is declared.</p><div class="grid">${results.filter(result => result.screenshot).map(result => `<figure><figcaption><strong>${e(result.name)}</strong><br><small>${e(result.category)} · ${e(result.finding.status)}</small></figcaption><img src="${result.id}.png" alt="${e(result.name)}"></figure>`).join('')}</div><h2>Full corpus</h2><div class="scroll"><table><thead><tr><th>Scene</th><th>Expected / measured</th><th>Match</th><th>Reason and scope</th></tr></thead><tbody>${results.map(result => `<tr><td><a href="${result.id}.html">${e(result.name)}</a><br><small>${e(result.category)}${result.scroll ? ' · scroll allowed' : ''}</small></td><td>${e(result.expected)} / ${e(result.finding.status)}</td><td class="${result.matched ? 'ok' : 'bad'}">${result.matched ? 'Matched' : 'MISMATCH'}</td><td>${e(result.explanation)}<br><small>Measured: ${e(result.finding.reason)}</small></td></tr>`).join('')}</tbody></table></div><p>Chromium ${e(report.browser)} · viewport 600×400 · fingerprint <code>${e(sourceHash)}</code>.</p><p><a href="report.json">Measurements and per-file hashes</a> · <a href="action-rule.ts">Exact measured rule source</a>. Repeat with <code>npm run controls</code> or <code>npm run test:browser</code>.</p></main></body></html>`;
  await writeFile(resolve(directory, 'report.html'), html);
  const temporary = resolve(root, 'artifacts', `${id}.tmp`);
  await writeFile(temporary, JSON.stringify({ id }) + '\n');
  await rename(temporary, resolve(root, 'artifacts', 'controls-latest.json'));
  console.log(`\n${report.summary.matched}/${report.summary.checked} matched. Report: ${directory}/report.html`);
  if (report.summary.mismatched) process.exitCode = 1;
} finally { await browser.close(); }
