import { createServer } from 'vite';
import { mkdtemp, readFile, writeFile, mkdir, lstat, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { BASELINE, WORST_CASE } from '../src/shared/model.ts';
import { memberRecipe } from '../scenarios/member-list.ts';
import vue from '../scenarios/todomvc-vue.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const packageInfo = JSON.parse(await readFile(resolve(root, 'artifacts/sdk-package.json'), 'utf8'));
const tarball = resolve(root, '..', packageInfo.filename);
const consumer = await mkdtemp(join(tmpdir(), 'ui-crash-sdk-'));
const externalOutput = await mkdtemp(join(tmpdir(), 'ui-crash-sdk-evidence-'));
await writeFile(resolve(consumer, 'package.json'), JSON.stringify({ name: 'independent-sdk-consumer', private: true }) + '\n');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const install = spawnSync(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', resolve(root, 'artifacts/npm-cache'), tarball, '@playwright/test@1.64.1'], { cwd: consumer, encoding: 'utf8', timeout: 120000, shell: process.platform === 'win32' });
if (install.status !== 0) throw new Error(`Independent install failed: ${install.stderr}`);
const cli = resolve(consumer, 'node_modules/ui-crash-test/lib/cli.js');
await lstat(resolve(consumer, 'node_modules/.bin', process.platform === 'win32' ? 'ui-crash-test.cmd' : 'ui-crash-test'));
const execute = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: consumer, encoding: 'utf8', timeout: 60000 });
if (execute(['--version']).stdout.trim() !== packageInfo.version || execute(['--help']).status !== 0) throw new Error('Installed CLI version/help failed.');
if (execute(['init']).status !== 0) throw new Error('Installed init failed.');
const initialConfig = await readFile(resolve(consumer, 'ui-crash.config.ts'), 'utf8');
if (execute(['init']).status !== 2 || await readFile(resolve(consumer, 'ui-crash.config.ts'), 'utf8') !== initialConfig) throw new Error('init overwrote an existing config.');

const common = { id: 'sdk-vue', name: 'Installed Vue adapter', description: 'Independent installed-package form smoke test.', recipe: vue.recipe, baseline: { titles: ['Review pull request'], viewportWidth: 390, viewportHeight: 600 }, sourceFiles: [], provenance: { kind: 'installed-sdk-check' } };
const vueConfig = `import {defineScenario} from 'ui-crash-test';
export default defineScenario({ ...${JSON.stringify(common)}, validate: value => value && Array.isArray(value.titles) && value.titles.length > 0 && value.titles.every(title => typeof title === 'string' && title.trim() === title && title.length > 0) ? [] : ['invalid'], cases: () => [{name:'Long task',origin:'curated',input:{titles:['Review the international customer onboarding experience before release'],viewportWidth:390,viewportHeight:600}}], candidates: input => [{label:'Shorter',input:{...input,titles:['Review']}}] });\n`;
await writeFile(resolve(consumer, 'vue.config.ts'), vueConfig);
const memberConfig = `import {defineScenario} from 'ui-crash-test';
export default defineScenario({ id:'sdk-member',name:'Installed member adapter',description:'Independent installed-package failing replay.', recipe:${JSON.stringify(memberRecipe())}, baseline:${JSON.stringify(BASELINE)}, sourceFiles:[], provenance:{kind:'installed-sdk-check'},
validate: value => value && value.containerWidth===360 && Array.isArray(value.members) && value.members.length>0 && value.members.length<=5 && new Set(value.members.map(m=>m.id)).size===value.members.length && value.members.some(m=>m.id==='member-primary') && value.members.every(m=>typeof m.name==='string'&&m.name.length>0&&m.name.length<=80&&typeof m.email==='string'&&/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(m.email)&&['active','invited'].includes(m.status)&&[null,'Owner','Member','Viewer'].includes(m.role)&&[null,'sage','sand','lilac'].includes(m.avatar)) ? [] : ['invalid'],
cases:()=>[{name:'Long name',origin:'curated',input:${JSON.stringify(WORST_CASE)}}],candidates:input=>[{label:'Keep primary',input:{...input,members:input.members.filter(m=>m.id==='member-primary')}}] });\n`;
await writeFile(resolve(consumer, 'member.config.ts'), memberConfig);
const server = await createServer({ configFile: resolve(root, 'vite.config.ts'), server: { port: 0, host: '127.0.0.1', open: false } });
try {
  await server.listen(); const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('No fixture server address.');
  const url = `http://127.0.0.1:${address.port}`;
  // Child processes use an asynchronous spawn: a synchronous wait would block this fixture server.
  const { spawn } = await import('node:child_process');
  const runAsync = (args: string[]) => new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveRun, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = ''; const timer = setTimeout(() => child.kill('SIGTERM'), 60000);
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); resolveRun({ code, stdout, stderr }); });
  });
  const filesBeforeDoctor = (await readdir(consumer)).sort();
  const diagnosed = await runAsync(['doctor', '--config', 'vue.config.ts', '--url', url, '--json']);
  if (diagnosed.code !== 0) throw new Error(`Installed doctor did not pass: ${diagnosed.stderr} ${diagnosed.stdout}`);
  const diagnosis = JSON.parse(diagnosed.stdout);
  if (diagnosis.status !== 'ready' || diagnosis.baseline?.status !== 'passed' || diagnosis.checks.find((check: { id: string }) => check.id === 'sources')?.status !== 'warning') throw new Error('Expected real baseline proof and an undeclared-app-source warning.');
  if (JSON.stringify((await readdir(consumer)).sort()) !== JSON.stringify(filesBeforeDoctor)) throw new Error('doctor wrote artifacts into the consumer.');
  await writeFile(resolve(consumer, 'missing-source.config.ts'), vueConfig.replace('"sourceFiles":[]', '"sourceFiles":["missing-component.ts"]'));
  const missingSource = await runAsync(['doctor', '--config', 'missing-source.config.ts', '--url', url, '--json']);
  const missingSourceReport = JSON.parse(missingSource.stdout);
  if (missingSource.code !== 2 || missingSourceReport.checks.at(-1)?.id !== 'sources' || missingSourceReport.browser) throw new Error('doctor did not block unreadable sources before browser launch.');
  await writeFile(resolve(consumer, 'missing-target.config.ts'), vueConfig.replace(JSON.stringify(vue.recipe.rule.target), '".missing-action"'));
  const missingTarget = await runAsync(['doctor', '--config', 'missing-target.config.ts', '--url', url, '--json']);
  if (missingTarget.code !== 2 || JSON.parse(missingTarget.stdout).baseline?.status !== 'inconclusive') throw new Error('doctor accepted a missing normal-data action.');
  await writeFile(resolve(consumer, 'broken-baseline.config.ts'), memberConfig.replace(`baseline:${JSON.stringify(BASELINE)}`, `baseline:${JSON.stringify(WORST_CASE)}`));
  const brokenBaseline = await runAsync(['doctor', '--config', 'broken-baseline.config.ts', '--url', url, '--json']);
  if (brokenBaseline.code !== 2 || JSON.parse(brokenBaseline.stdout).baseline?.status !== 'failed') throw new Error('doctor must block an already-failing normal-data control with exit 2, not claim a confirmed campaign failure.');
  const doctorText = await runAsync(['doctor', '--config', 'vue.config.ts', '--url', url]);
  if (doctorText.code !== 0 || !doctorText.stdout.includes('Adapter ready') || !doctorText.stdout.includes('[warning] sources')) throw new Error('Human-readable doctor output is missing its status/warning.');
  const passed = await runAsync(['run', '--config', 'vue.config.ts', '--url', url, '--out-dir', 'evidence', '--json']);
  if (passed.code !== 0) throw new Error(`Installed passing run failed: ${passed.stderr} ${passed.stdout}`);
  const good = JSON.parse(passed.stdout);
  if (good.outcome !== 'no-failure' || good.summary.passed !== 1) throw new Error('Unexpected passing result.');
  const failed = await runAsync(['run', '--config', 'member.config.ts', '--url', url, '--out-dir', externalOutput, '--json']);
  if (failed.code !== 1) throw new Error(`Installed failing run had unexpected result: ${failed.code} ${failed.stderr} ${failed.stdout}`);
  const bad = JSON.parse(failed.stdout);
  if (!bad.regression?.reproduced || bad.confirmation?.failures !== 3) throw new Error('Installed package did not verify its exported failure.');
  const copiedRule = await readFile(resolve(externalOutput, bad.id, 'core/action-rule.js'));
  if (!copiedRule.equals(await readFile(resolve(consumer, 'node_modules/ui-crash-test/lib/core/action-rule.js')))) throw new Error('Exported compiled rule differs from installed runtime.');
  let linkRetained = false;
  try { await lstat(resolve(externalOutput, bad.id, 'node_modules/@playwright/test')); linkRetained = true; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  if (linkRetained) throw new Error('Verification dependency link was retained after replay.');
  const invalid = await runAsync(['run', '--config', 'missing.config.ts', '--url', url, '--json']);
  if (invalid.code !== 2) throw new Error('Expected exit 2 for a setup error.');
  await mkdir(resolve(consumer, 'application-root'));
  await writeFile(resolve(consumer, 'api-check.mjs'), `import {runScenario,checkScenario} from 'ui-crash-test';\nimport {resolve} from 'node:path';\nimport {access} from 'node:fs/promises';\nimport config from './api-config.mjs';\nconst d=await checkScenario(config,{root:resolve('application-root'),appURL:${JSON.stringify(url)}});if(d.status!=='ready')throw new Error(JSON.stringify(d));\nconst r=await runScenario(config,{root:resolve('application-root'),appURL:${JSON.stringify(url)},outputDir:'library-evidence'});await access('application-root/library-evidence/'+r.id+'/report.json');console.log(JSON.stringify({outcome:r.outcome,passed:r.summary.passed}));\n`);
  await writeFile(resolve(consumer, 'api-config.mjs'), vueConfig);
  const library = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveRun, reject) => {
    const child = spawn(process.execPath, ['api-check.mjs'], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'] }); let stdout = '', stderr = ''; const timer = setTimeout(() => child.kill('SIGTERM'), 60000);
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; }); child.on('error', error => { clearTimeout(timer); reject(error); }); child.on('close', code => { clearTimeout(timer); resolveRun({ code, stdout, stderr }); });
  });
  if (library.code !== 0 || JSON.parse(library.stdout).outcome !== 'no-failure') throw new Error(`Library import failed: ${library.stderr}`);
  const manifest = JSON.parse(await readFile(resolve(consumer, 'node_modules/ui-crash-test/package.json'), 'utf8'));
  const result = { createdAt: new Date().toISOString(), node: process.version, platform: process.platform, version: packageInfo.version, isolatedInstall: true, tarballIntegrity: packageInfo.integrity, doctor: { readyExit: diagnosed.code, missingSourceExit: missingSource.code, missingTargetExit: missingTarget.code, failingBaselineExit: brokenBaseline.code, sourceWarning: true, noArtifactsWritten: true, humanOutput: true }, consumerPackageType: 'No type field; TypeScript config loading verified.', cli: { binInstalled: true, help: true, version: true, init: true, preservesExistingConfig: true, passingExit: passed.code, failureExit: failed.code, setupErrorExit: invalid.code }, libraryImport: true, libraryDoctor: true, explicitApplicationRoot: true, externalOutputDirectory: true, verificationLinkRemoved: true, compiledReplayVerified: true, compiledRuleMatchesRuntime: true, normal: good.summary, confirmed: bad.summary, packageDependencies: manifest.dependencies, peerDependencies: manifest.peerDependencies, private: manifest.private };
  await mkdir(resolve(root, 'artifacts/qa'), { recursive: true });
  await writeFile(resolve(root, 'artifacts/qa/sdk-verification.json'), JSON.stringify(result, null, 2) + '\n');
  await writeFile(resolve(root, `artifacts/qa/sdk-verification-node-${process.versions.node}.json`), JSON.stringify(result, null, 2) + '\n');
  await writeFile(resolve(root, `artifacts/qa/doctor-ready-node-${process.versions.node}.json`), JSON.stringify(diagnosis, null, 2) + '\n');
  await writeFile(resolve(root, `artifacts/qa/doctor-blocked-node-${process.versions.node}.json`), missingTarget.stdout);
  console.log(JSON.stringify(result, null, 2));
} finally { await server.close(); }
