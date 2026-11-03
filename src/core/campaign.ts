import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { BASELINE, cloneInput, validateInput } from '../shared/model.ts';
import type { CampaignReport, ProgressEvent } from '../shared/report.ts';
import { FixtureRenderer } from './render.ts';
import { generateScenarios } from './generate.ts';
import { reduceCase } from './reduce.ts';
import { exportRegression } from './export.ts';
import { runExportedTest } from './regression.ts';
import { standaloneReport } from './standalone.ts';

export async function runCampaign(options: { root: string; baseURL: string; seed?: number; width?: number; onProgress?: (event: ProgressEvent) => void }): Promise<CampaignReport> {
  const { root, baseURL, seed = 42, width = 360, onProgress } = options;
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new Error('Invalid generation seed.');
  if (!Number.isInteger(width) || width < 320 || width > 640) throw new Error('Container width must be an integer from 320 to 640.');
  const started = Date.now();
  const id = `run-${new Date().toISOString().replace(/[^0-9a-z]/gi, '').toLowerCase()}-${randomUUID().slice(0, 6)}`;
  const directory = resolve(root, 'artifacts', id);
  await mkdir(directory, { recursive: true });
  const events: ProgressEvent[] = [];
  const emit = (phase: string, message: string) => { const event = { time: new Date().toISOString(), phase, message }; events.push(event); onProgress?.(event); };
  const source = await Promise.all(['src/app/MemberList.tsx', 'src/app/styles.css', 'src/core/action-rule.ts'].map(path => readFile(resolve(root, path))));
  const sourceHash = createHash('sha256').update(Buffer.concat(source)).digest('hex').slice(0, 16);
  const renderer = new FixtureRenderer(baseURL);
  let report: CampaignReport;
  try {
    emit('Control', 'Starting a fresh Chromium context for the normal-data control.');
    const browser = await renderer.start();
    const baselineInput = cloneInput(BASELINE);
    baselineInput.containerWidth = width;
    const baseline = await renderer.evaluate(baselineInput, 'broken', resolve(directory, 'baseline.png'));
    if (baseline.status !== 'passed') throw new Error(`The baseline control did not pass: ${baseline.reason}`);
    const scenarios = generateScenarios(seed, width);
    const discovery: CampaignReport['discovery'] = [];
    for (const [index, scenario] of scenarios.entries()) {
      if (validateInput(scenario.input).length) throw new Error(`Generator produced invalid input: ${scenario.name}`);
      emit('Discover', `${index + 1}/${scenarios.length} · ${scenario.name}`);
      const result = await renderer.evaluate(scenario.input);
      discovery.push({ ...scenario, status: result.status, reason: result.reason });
    }
    const first = discovery.find(item => item.status === 'failed');
    report = {
      schemaVersion: 1, outcome: first ? 'failure' : discovery.some(item => item.status === 'inconclusive') ? 'inconclusive' : 'no-failure',
      id, createdAt: new Date().toISOString(), seed, durationMs: 0,
      environment: { browser, node: process.version, sourceHash, viewport: { width: 1000, height: 900 } },
      summary: { checked: discovery.length, failed: discovery.filter(item => item.status === 'failed').length, passed: discovery.filter(item => item.status === 'passed').length, inconclusive: discovery.filter(item => item.status === 'inconclusive').length, valid: discovery.length },
      baseline: { input: baselineInput, finding: baseline }, original: null, reduced: null, reduction: null, confirmation: null, regression: null, discovery, events,
    };
    if (first) {
      emit('Confirm', 'Replaying the original failure in three fresh browser contexts.');
      const original = await renderer.evaluate(first.input, 'broken', resolve(directory, 'original.png'));
      const confirmations = [original, await renderer.evaluate(first.input), await renderer.evaluate(first.input)];
      const failures = confirmations.filter(result => result.status === 'failed' && result.signature === original.signature).length;
      if (failures !== 3) throw new Error('The original failure did not reproduce in all three control reruns.');
      emit('Reduce', 'Removing unrelated data while preserving validity and the declared failure.');
      const reduction = await reduceCase(first.input, original.signature, input => renderer.evaluate(input), {
        budget: 30, onStep: step => emit('Reduce', `${step.accepted ? 'Kept' : 'Rejected'} · ${step.label}`),
      });
      const reduced = await renderer.evaluate(reduction.input, 'broken', resolve(directory, 'reduced.png'));
      if (reduced.status !== 'failed' || reduced.signature !== original.signature) throw new Error('The reduced case no longer reproduces the same failure.');
      const fixed = await renderer.evaluate(reduction.input, 'fixed', resolve(directory, 'fixed.png'));
      if (fixed.status !== 'passed') throw new Error(`The fixed demo variant did not pass: ${fixed.reason}`);
      report.original = { input: first.input, finding: original, name: first.name };
      report.reduced = { input: reduction.input, finding: reduced };
      report.reduction = reduction;
      report.confirmation = { attempts: 3, failures, fixed };
      await exportRegression(root, directory, reduction.input, { failureSignature: reduced.signature, sourceHash, environment: report.environment, seed, createdAt: report.createdAt });
    }
  } finally {
    await renderer.close();
  }
  if (report.original) {
    emit('Verify', 'Executing the exported Playwright test against the original layout (expect red).');
    const broken = await runExportedTest(root, directory, baseURL, 'broken');
    emit('Verify', 'Executing that same exported test against the fixed layout (expect green).');
    const fixed = await runExportedTest(root, directory, baseURL, 'fixed');
    const verified = broken.failed === 1 && broken.passed === 0 && fixed.passed === 1 && fixed.failed === 0;
    report.regression = { broken, fixed, verified };
    if (!verified) throw new Error('The exported test did not demonstrate the expected red-to-green transition.');
  }
  report.durationMs = Date.now() - started;
  emit('Complete', report.regression?.verified ? 'Saved case, screenshots and exported test verified.' : 'Campaign complete. No confirmed failing case was exported.');
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(resolve(directory, 'report.html'), standaloneReport(report));
  const latest = resolve(root, 'artifacts', `latest-${randomUUID()}.tmp`);
  await writeFile(latest, JSON.stringify({ id }) + '\n');
  await rename(latest, resolve(root, 'artifacts', 'latest.json'));
  return report;
}
