import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { externalScenarios } from '../scenarios/index.ts';
import member from '../scenarios/member-list.ts';
import { runScenario } from '../src/scenario/run.ts';
import { asScenario, type ScenarioConfig } from '../src/scenario/config.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const { values } = parseArgs({ options: { scenario: { type: 'string', default: 'all' }, config: { type: 'string' }, url: { type: 'string' }, seed: { type: 'string', default: '42' }, help: { type: 'boolean' } } });
if (values.help) {
  console.log('npm run scenarios -- [--scenario all|product-card|dialog|table-row|cart-preview|member-list|todomvc-vue] [--seed 42] [--url http://localhost:3000]\n\nCustom adapter: --config ./my-scenario.ts --url http://localhost:3000\nConfig files are trusted executable TypeScript and must default-export defineScenario(...).');
  process.exit(0);
}
let selected: ScenarioConfig[];
if (values.config) {
  const path = resolve(values.config);
  const imported = (await import(pathToFileURL(path).href)).default as ScenarioConfig;
  if (!imported || typeof imported.validate !== 'function' || typeof imported.cases !== 'function' || typeof imported.candidates !== 'function') throw new Error('Config must default-export a scenario with validate, cases and candidates functions.');
  selected = [{ ...imported, sourceFiles: [...imported.sourceFiles, path] }];
} else {
  const all = [...externalScenarios, asScenario(member)];
  selected = values.scenario === 'all' ? externalScenarios : all.filter(config => config.id === values.scenario);
  if (!selected.length) throw new Error('Unknown scenario. Use --help.');
}
const needsLocalServer = !values.config && !values.url;
const server = needsLocalServer ? await createServer({ configFile: resolve(root, 'vite.config.ts'), server: { port: 0, host: '127.0.0.1', open: false } }) : undefined;
try {
  let appURL = values.url;
  if (server) { await server.listen(); const address = server.httpServer!.address(); if (!address || typeof address === 'string') throw new Error('No local server address'); appURL = `http://127.0.0.1:${address.port}`; }
  for (const config of selected) {
    const report = await runScenario(config, { root, appURL, seed: Number(values.seed), onProgress: console.log });
    console.log(`Report: ${root}/artifacts/${report.id}/report.html\n`);
    if (report.outcome === 'inconclusive') process.exitCode = 2;
  }
} finally { await server?.close(); }
