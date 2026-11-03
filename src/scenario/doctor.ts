import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scenarioCases, type Json, type ScenarioConfig } from './config.ts';
import { viewportFor } from './replay.ts';
import { ScenarioRenderer } from './renderer.ts';
import type { ActionFinding } from '../core/action-rule.ts';

export type DoctorCheck = { id: string; status: 'passed' | 'failed' | 'warning'; message: string };
export type DoctorReport = {
  schemaVersion: 1; createdAt: string; status: 'ready' | 'blocked';
  node: string; browser?: string; root: string; appURL?: string;
  checks: DoctorCheck[]; baseline?: ActionFinding;
};
export type DoctorOptions = { root?: string; appURL?: string; seed?: number };

/** Check the real normal-data control without discovery, reduction, exports or artifact writes. */
export async function checkScenario<T extends Json>(config: ScenarioConfig<T>, options: DoctorOptions = {}): Promise<DoctorReport> {
  const root = resolve(options.root ?? process.cwd());
  const report: DoctorReport = { schemaVersion: 1, createdAt: new Date().toISOString(), status: 'blocked', node: process.version, root, checks: [] };
  const check = (id: string, message: string, status: DoctorCheck['status'] = 'passed') => report.checks.push({ id, status, message });
  let stage = 'config';
  let renderer: ScenarioRenderer | undefined;
  try {
    const cases = scenarioCases(config, options.seed ?? 42);
    for (const input of [config.baseline, ...cases.map(item => item.input)]) viewportFor(config.recipe, input);
    check(stage, `Recipe, baseline and ${cases.length} discovery inputs satisfy the declared contract. Reduction candidates are not executed.`);
    stage = 'sources';
    for (const path of new Set(config.sourceFiles)) await readFile(resolve(root, path));
    check(stage, config.sourceFiles.length ? `${new Set(config.sourceFiles).size} declared source files are readable.` : 'No app sources declared. Add component/style files to detect source drift.', config.sourceFiles.length ? 'passed' : 'warning');
    stage = 'url';
    const appURL = options.appURL ?? config.appURL;
    if (!appURL) throw new Error('Configure appURL or pass --url. Keep the app running separately.');
    const parsed = new URL(appURL);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Use an HTTP application URL without embedded credentials.');
    report.appURL = appURL;
    check(stage, `Target: ${new URL(config.recipe.path, appURL).href}`);
    stage = 'browser';
    renderer = new ScenarioRenderer(appURL, config.recipe);
    report.browser = await renderer.start();
    check(stage, `Chromium ${report.browser} launched.`);
    stage = 'baseline';
    report.baseline = await renderer.evaluate(config.baseline);
    if (report.baseline.status !== 'passed') throw new Error(`Normal-data control is ${report.baseline.status}: ${report.baseline.reason}`);
    check(stage, 'Normal-data input was rendered and proved; the declared action passed after setup.');
    report.status = 'ready';
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    check(stage, stage === 'browser' ? `${reason}\nInstall Chromium with: npx playwright install chromium` : reason, 'failed');
  } finally { await renderer?.close(); }
  return report;
}
