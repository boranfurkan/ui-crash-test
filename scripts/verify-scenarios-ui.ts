import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import type { ScenarioReport } from '../src/scenario/report.ts';

await mkdir('artifacts/qa', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  const panel = page.getByRole('region', { name: 'External component scenarios' });
  await expect(panel.locator('.scenario-card')).toHaveCount(5);
  const previous = (await (await page.request.get('/api/scenarios')).json()).scenarios.map((item: { latest: { id: string } | null }) => item.latest?.id);
  await panel.getByRole('button', { name: 'Run all 5 scenarios' }).click();
  await expect(panel.getByRole('button', { name: 'Testing components…' })).toBeDisabled();
  const duplicate = await page.request.post('/api/scenarios/run', { data: { scenario: 'all' } });
  expect(duplicate.status()).toBe(409);
  await expect.poll(async () => (await (await page.request.get('/api/scenarios')).json()).status.state, { timeout: 60000, intervals: [500, 1000] }).toBe('completed');
  await expect(panel.getByRole('button', { name: 'Run all 5 scenarios' })).toBeEnabled({ timeout: 5000 });
  await expect(panel.getByText('NO FAILURE FOUND', { exact: true })).toHaveCount(4);
  const data = await (await page.request.get('/api/scenarios')).json();
  const reports: ScenarioReport[] = [];
  for (const [index, scenario] of data.scenarios.entries()) {
    expect(scenario.latest.id).not.toBe(previous[index]);
    const report: ScenarioReport = await (await page.request.get(`/artifacts/${scenario.latest.id}/report.json`)).json();
    expect(report.baseline.finding.status).toBe('passed');
    if (scenario.id === 'cart-preview') {
      expect(report.summary).toEqual({ checked: 14, passed: 7, failed: 7, inconclusive: 0, valid: 14 });
      expect(report.regression?.reproduced).toBe(true);
      expect(report.confirmation?.failures).toBe(3);
      expect((await page.request.get(`/artifacts/${report.id}/replay-bundle.zip`)).status()).toBe(200);
    } else {
      expect(report.summary).toEqual({ checked: 14, passed: 14, failed: 0, inconclusive: 0, valid: 14 });
      expect(report.regression).toBe(null);
      expect((await page.request.get(`/artifacts/${report.id}/replay-bundle.zip`)).status()).toBe(404);
    }
    const evidence = await context.newPage();
    await evidence.goto(`http://127.0.0.1:4173/artifacts/${report.id}/report.html`);
    await expect(evidence.locator('tbody tr')).toHaveCount(14);
    const images = await evidence.locator('img').evaluateAll(images => images.map(image => ({ complete: (image as HTMLImageElement).complete, width: (image as HTMLImageElement).naturalWidth })));
    expect(images.length).toBe(scenario.id === 'cart-preview' ? 3 : 2);
    expect(images.every(image => image.complete && image.width > 0)).toBe(true);
    await evidence.close();
    reports.push(report);
  }
  await expect(panel.getByRole('complementary', { name: 'Measurement controls' })).toContainText('32/32 control outcomes matched');
  await panel.screenshot({ path: 'artifacts/qa/external-scenarios-desktop.png' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Dashboard overflow at ${width}px`).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await panel.screenshot({ path: 'artifacts/qa/external-scenarios-mobile.png' });
  const reference = JSON.parse(await readFile('artifacts/scenario-member-list.json', 'utf8'));
  const referenceReport: ScenarioReport = JSON.parse(await readFile(`artifacts/${reference.id}/report.json`, 'utf8'));
  expect(referenceReport.regression?.reproduced).toBe(true);
  expect(referenceReport.confirmation?.failures).toBe(3);
  expect(errors).toEqual([]);
  const result = { reports: reports.map(report => ({ id: report.id, scenario: report.scenario.id, summary: report.summary, sourceHash: report.environment.sourceHash })), referenceRun: reference.id, browserErrors: errors, duplicateRunStatus: duplicate.status(), testedWidths: [320, 390, 768, 1440] };
  await writeFile('artifacts/qa/scenario-ui-verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
