import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkScenario } from '../src/scenario/doctor.ts';
import { runScenario } from '../src/scenario/run.ts';
import vue from '../scenarios/todomvc-vue.ts';

test('doctor proves the normal-data control without measuring discovery or reducing', async ({ baseURL }) => {
  let candidatesCalled = false;
  const report = await checkScenario({ ...vue, sourceFiles: [], candidates: () => { candidatesCalled = true; throw new Error('must not run'); } }, { appURL: baseURL });
  expect(report.status).toBe('ready');
  expect(report.baseline?.status).toBe('passed');
  expect(report.browser).toBeTruthy();
  expect(report.checks.find(check => check.id === 'sources')?.status).toBe('warning');
  expect(candidatesCalled).toBe(false);
});

test('doctor blocks ignored input instead of accepting default app data', async ({ baseURL }) => {
  const report = await checkScenario({ ...vue, sourceFiles: [], recipe: { ...vue.recipe, form: { ...vue.recipe.form!, submitKey: 'Tab' }, setup: [], ready: '.todoapp' } }, { appURL: baseURL });
  expect(report.status).toBe('blocked');
  expect(report.checks.at(-1)?.id).toBe('baseline');
  expect(report.baseline?.reason).toContain('Rendered input differs');
});

test('a missing normal-data target blocks diagnosis and produces no pretend stress evidence', async ({ baseURL }) => {
  const config = { ...vue, sourceFiles: [], recipe: { ...vue.recipe, rule: { ...vue.recipe.rule, target: '.missing-action' } } };
  const doctor = await checkScenario(config, { appURL: baseURL });
  expect(doctor.status).toBe('blocked');
  expect(doctor.baseline?.status).toBe('inconclusive');
  const output = await mkdtemp(join(tmpdir(), 'ui-crash-inconclusive-'));
  try {
    const report = await runScenario(config, { appURL: baseURL, outputDir: output });
    expect(report.outcome).toBe('inconclusive');
    expect(report.discovery).toEqual([]);
    expect(report.screenshots).toEqual(['baseline.png']);
    const html = await readFile(resolve(output, report.id, 'report.html'), 'utf8');
    expect(html).toContain('src="baseline.png"');
    expect(html).not.toContain('src="sample.png"');
    expect(await readdir(resolve(output, report.id))).not.toContain('replay-bundle.zip');
  } finally { await rm(output, { recursive: true, force: true }); }
});
