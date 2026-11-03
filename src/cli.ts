#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { runScenario } from './scenario/run.ts';
import { checkScenario } from './scenario/doctor.ts';
import type { ScenarioConfig } from './scenario/config.ts';

const help = `UI Crash Test — validated data → smaller failing case → saved Playwright regression

ui-crash-test init [--config ui-crash.config.ts]
ui-crash-test doctor [--config ui-crash.config.ts] [--url http://localhost:3000] [--json]
ui-crash-test run [--config ui-crash.config.ts] [--url http://localhost:3000]
                  [--seed 42] [--out-dir artifacts] [--json]

Config files are trusted executable TypeScript/JavaScript. The target app must already be running.
Exit codes: 0 = no failure found; 1 = confirmed failure; 2 = inconclusive or setup error.
doctor checks the config, sources and real normal-data control; exits 0 if ready, 2 if blocked.
doctor does not run stress cases, reduction or exports, and writes no artifacts.
init writes a starter file without overwriting an existing config. --version prints the local version.`;

const starter = `import { defineScenario } from 'ui-crash-test';

// Replace the path, selectors, data contract and source paths with your actual local application.
// This starter uses the app's native form. See the package README for an API-response boundary.
type Input = { titles: string[] };
export default defineScenario<Input>({
  id: 'my-list', name: 'My application list',
  description: 'After permitted scrolling and hover, the first row action remains reachable.',
  appURL: 'http://localhost:3000',
  baseline: { titles: ['Review pull request'] },
  validate(input) {
    const value = input as Input;
    return value && Array.isArray(value.titles) && value.titles.length > 0 && value.titles.length <= 5
      && value.titles.every(title => typeof title === 'string' && title.trim() === title && title.length > 0 && title.length <= 160)
      ? [] : ['Expected 1–5 trimmed nonempty titles up to 160 characters'];
  },
  cases: () => [{ name: 'Long task', origin: 'curated', input: { titles: ['Review the international customer onboarding experience before the next release'] } }],
  candidates: input => [{ label: 'Shorter first task', input: { titles: ['Review', ...input.titles.slice(1)] } }],
  recipe: {
    path: '/', viewport: { width: 390, height: 600 },
    form: { input: '.new-item', itemsPath: '/titles', submitKey: 'Enter' },
    setup: [{ action: 'scroll', selector: '.item:first-child' }, { action: 'hover', selector: '.item:first-child' }],
    ready: '.item:first-child',
    proofs: [{ selector: '.item .label', kind: 'texts', inputPath: '/titles' }],
    screenshot: 'viewport',
    rule: { id: 'row-action-reachable', target: '.item:first-child button', boundary: '.item:first-child' },
  },
  sourceFiles: [], // Add the subject's source/style files relative to this project or as absolute paths.
  provenance: { kind: 'application-adapter' },
});
`;

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { config: { type: 'string', default: 'ui-crash.config.ts' }, url: { type: 'string' }, seed: { type: 'string', default: '42' }, 'out-dir': { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean' }, version: { type: 'boolean' } } });
  if (values.help) { console.log(help); }
  else if (values.version) { console.log(JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version); }
  else {
    if (positionals.length > 1) throw new Error('Use a single command: run, doctor or init.');
    const command = positionals[0] ?? 'run', configPath = resolve(values.config!);
    if (command === 'init') {
      await writeFile(configPath, starter, { flag: 'wx' });
      console.log(`Created ${configPath}. Replace the selectors and boundary with your real app, then run ui-crash-test doctor.`);
    } else if (command === 'run' || command === 'doctor') {
      const imported = await tsImport(pathToFileURL(configPath).href, import.meta.url);
      const candidate = imported.default?.default ?? imported.default;
      if (command === 'doctor') {
        if (values['out-dir']) throw new Error('doctor writes no artifacts. Use --out-dir with run.');
        const report = await checkScenario(candidate, { appURL: values.url, seed: Number(values.seed) });
        if (values.json) console.log(JSON.stringify(report));
        else {
          console.log(`Adapter ${report.status === 'ready' ? 'ready' : 'blocked'}`);
          for (const check of report.checks) console.log(`[${check.status}] ${check.id}: ${check.message}`);
          if (report.status === 'ready') console.log('Normal-data control passed. Run a campaign to evaluate the supplied stress inputs.');
        }
        process.exitCode = report.status === 'ready' ? 0 : 2;
      } else {
        if (!candidate || !Array.isArray(candidate.sourceFiles)) throw new Error('Default-export a scenario with sourceFiles. Use doctor to diagnose the adapter.');
        const config: ScenarioConfig = { ...candidate, sourceFiles: [...candidate.sourceFiles, configPath] };
        const report = await runScenario(config, { appURL: values.url, seed: Number(values.seed), outputDir: values['out-dir'], onProgress: values.json ? undefined : console.log });
        if (values.json) console.log(JSON.stringify(report));
        else console.log(`Report: ${resolve(values['out-dir'] ?? 'artifacts', report.id, 'report.html')}`);
        process.exitCode = report.outcome === 'failure' ? 1 : report.outcome === 'inconclusive' ? 2 : 0;
      }
    } else throw new Error(`Unknown command ${command}. Use --help.`);
  }
} catch (error) { console.error(`UI Crash Test: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 2; }
