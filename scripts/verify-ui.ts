import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/qa', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const previous = (await (await page.request.get('http://127.0.0.1:4173/api/report')).json()).report?.id;
  await page.getByRole('button', { name: /Run again|Run crash test/ }).click();
  await expect(page.locator('.running-banner')).toBeVisible();
  const duplicate = await page.request.post('http://127.0.0.1:4173/api/run', { data: { seed: 42, width: 360 } });
  expect(duplicate.status()).toBe(409);
  await expect(page.locator('.running-banner')).toHaveCount(0, { timeout: 60000 });
  await expect(page.locator('.error-banner')).toHaveCount(0);
  const result = (await (await page.request.get('http://127.0.0.1:4173/api/report')).json()).report;
  expect(result.id).not.toBe(previous);
  expect(result.regression.verified).toBe(true);
  await expect(page.getByText('Keep the case. Lose the distraction.')).toBeVisible();
  await page.screenshot({ path: 'artifacts/qa/report-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /Saved case/ }).click();
  await expect(page.locator('.code-panel')).toContainText('a@b.co');
  await page.getByRole('button', { name: 'Regression', exact: true }).click();
  await expect(page.locator('.code-panel')).toContainText("test.info().attach('action-finding'");
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Replay bundle', exact: true }).click()]);
  await download.saveAs('artifacts/qa/downloaded-replay.zip');
  await page.getByRole('button', { name: /Overview/ }).click();
  await page.getByRole('button', { name: 'Verify fix', exact: true }).click();
  await expect(page.locator('.verified-card img')).toHaveAttribute('src', /fixed\.png$/);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Dashboard overflow at ${width}px`).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: 'artifacts/qa/report-mobile.png', fullPage: true });
  const standalone = await page.context().newPage();
  await standalone.goto(`http://127.0.0.1:4173/artifacts/${result.id}/report.html`);
  await expect(standalone.locator('h1')).toContainText('A smaller case.');
  await expect(standalone.locator('img')).toHaveCount(4);
  expect(await standalone.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ runId: result.id, summary: result.summary, regression: result.regression, sourceHash: result.environment.sourceHash, browserErrors: errors, testedWidths: [320, 390, 768, 1440], duplicateRunStatus: duplicate.status() }, null, 2));
} finally {
  await browser.close();
}
