import { createHash, randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile, rename, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scenarioCases, type Json, type ScenarioConfig } from './config.ts';
import { ScenarioRenderer } from './renderer.ts';
import { reduceScenario } from './reduce.ts';
import { exportScenario } from './export.ts';
import { runExportedTest } from '../core/regression.ts';
import { scenarioHTML, type ScenarioReport } from './report.ts';
import { runtimeExtension, runtimePath } from './runtime.ts';
import { viewportFor } from './replay.ts';

export type RunOptions = { root?: string; outputDir?: string; appURL?: string; seed?: number; onProgress?: (message: string) => void };
export async function runScenario<T extends Json>(config: ScenarioConfig<T>, options: RunOptions = {}): Promise<ScenarioReport> {
  const started = Date.now(), seed = options.seed ?? 42;
  const root = resolve(options.root ?? process.cwd());
  const outputDir = resolve(root, options.outputDir ?? 'artifacts');
  const scenarios = scenarioCases(config, seed);
  for (const input of [config.baseline, ...scenarios.map(item => item.input)]) viewportFor(config.recipe, input);
  const appURL = options.appURL ?? config.appURL;
  if (!appURL) throw new Error('Configure appURL or pass --url.');
  const parsed = new URL(appURL);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Use an HTTP application URL without embedded credentials.');
  const emit = options.onProgress ?? (() => {});
  const engineFiles = ['scenario/config', 'scenario/renderer', 'scenario/replay', 'scenario/reduce', 'scenario/run', 'scenario/export', 'scenario/runtime', 'core/regression', 'core/action-rule'];
  const sourcePaths = [...new Set(config.sourceFiles)].sort().map(path => ({ label: path, file: resolve(root, path) }));
  sourcePaths.push(...engineFiles.map(path => ({ label: `engine/${path}${runtimeExtension}`, file: runtimePath(path) })));
  const snapshotSources = () => Promise.all(sourcePaths.map(async ({ label, file }) => ({ path: label, sha256: createHash('sha256').update(await readFile(file)).digest('hex') })));
  const sources = await snapshotSources();
  const sourceHash = createHash('sha256').update(JSON.stringify({ sources, recipe: config.recipe, provenance: config.provenance })).digest('hex');
  const id = `run-${config.id}-${Date.now()}-${randomUUID().slice(0, 6)}`, directory = resolve(outputDir, id);
  await mkdir(directory, { recursive: true });
  const renderer = new ScenarioRenderer(appURL, config.recipe);
  let report: ScenarioReport;
  try {
    const browser = await renderer.start();
    emit(`${config.name}: normal-data control`);
    const baseline = await renderer.evaluate(config.baseline, resolve(directory, 'baseline.png'));
    report = { schemaVersion: 2, id, createdAt: new Date().toISOString(), seed, durationMs: 0, appURL,
      scenario: { id: config.id, name: config.name, description: config.description, provenance: config.provenance },
      environment: { browser, node: process.version, sourceHash, sources }, outcome: 'inconclusive', baseline: { input: config.baseline, finding: baseline },
      discovery: [], summary: { checked: 0, failed: 0, passed: 0, inconclusive: 0, valid: scenarios.length }, original: null, reduced: null, reduction: null, confirmation: null, regression: null };
    // An invalid control invalidates the experiment. Keep its evidence and stop discovery.
    if (baseline.status === 'passed') {
      for (const [index, item] of scenarios.entries()) {
        emit(`${config.name}: ${index + 1}/${scenarios.length} · ${item.name}`);
        const finding = await renderer.evaluate(item.input, index === 0 ? resolve(directory, 'sample.png') : undefined);
        report.discovery.push({ ...item, finding });
        report.summary.checked++; report.summary[finding.status === 'passed' ? 'passed' : finding.status === 'failed' ? 'failed' : 'inconclusive']++;
      }
      const first = report.discovery.find(item => item.finding.status === 'failed');
      report.outcome = first ? 'failure' : report.summary.inconclusive ? 'inconclusive' : 'no-failure';
      if (first) {
        emit(`${config.name}: confirming the same failure in three fresh contexts`);
        const original = await renderer.evaluate(first.input, resolve(directory, 'original.png'));
        const confirmations = [original, await renderer.evaluate(first.input), await renderer.evaluate(first.input)];
        const failures = confirmations.filter(finding => finding.status === 'failed' && finding.signature === first.finding.signature).length;
        report.confirmation = { attempts: 3, failures };
        if (failures !== 3) report.outcome = 'inconclusive';
        else {
          report.original = { name: first.name, input: first.input, finding: original };
          emit(`${config.name}: reducing valid data using this scenario’s candidates`);
          report.reduction = await reduceScenario(config, first.input as T, original.signature, input => renderer.evaluate(input));
          const reduced = await renderer.evaluate(report.reduction.input, resolve(directory, 'reduced.png'));
          if (reduced.status !== 'failed' || reduced.signature !== original.signature) throw new Error('Reduced input no longer reproduces the same failure.');
          report.reduced = { input: report.reduction.input, finding: reduced };
          await exportScenario(directory, { input: report.reduced.input, recipe: config.recipe, failureSignature: reduced.signature, scenario: report.scenario, environment: report.environment, seed, appURL });
        }
      }
    }
  } finally { await renderer.close(); }
  if (report.reduced) {
    emit(`${config.name}: executing the exported regression to verify the saved failure`);
    const result = await runExportedTest(root, directory, appURL, 'broken');
    if (result.failed !== 1 || result.passed !== 0) throw new Error('Expected one failing exported regression.');
    report.regression = { ...result, reproduced: true };
  }
  report.durationMs = Date.now() - started;
  report.screenshots = (await readdir(directory)).filter(file => ['baseline.png', 'sample.png', 'original.png', 'reduced.png'].includes(file));
  if (JSON.stringify(await snapshotSources()) !== JSON.stringify(sources)) throw new Error('Source files changed during the run. The experiment was not saved as a completed result.');
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(resolve(directory, 'report.html'), scenarioHTML(report));
  const latest = resolve(outputDir, `scenario-${config.id}-${randomUUID()}.tmp`);
  await writeFile(latest, JSON.stringify({ id }) + '\n');
  await rename(latest, resolve(outputDir, `scenario-${config.id}.json`));
  emit(`${config.name}: ${report.outcome} · ${report.summary.passed} pass / ${report.summary.failed} fail / ${report.summary.inconclusive} inconclusive`);
  return report;
}
