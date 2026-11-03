import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioCases, validateRecipe } from '../src/scenario/config.ts';
import { checkScenario } from '../src/scenario/doctor.ts';
import { runScenario } from '../src/scenario/run.ts';
import vue from '../scenarios/todomvc-vue.ts';
import { scenarioHTML, type ScenarioReport } from '../src/scenario/report.ts';

test('campaign contracts reject malformed JS configs before browser setup', () => {
  assert.throws(() => scenarioCases({ ...vue, validate: () => undefined as never }, 42), /array of error strings/);
  assert.throws(() => scenarioCases({ ...vue, cases: () => [] }, 42), /1–200/);
  assert.throws(() => scenarioCases({ ...vue, sourceFiles: [null as never] }, 42), /sourceFiles/);
  assert.throws(() => scenarioCases(vue, -1), /Seed/);
  assert.throws(() => validateRecipe({ ...vue.recipe, setup: [{ action: 'typo' as never, selector: '.todoapp' }] }), /setup step/);
  assert.throws(() => validateRecipe({ ...vue.recipe, proofs: [{ selector: '.todoapp', kind: 'attribute' }] }), /attribute name/);
  assert.throws(() => validateRecipe({ ...vue.recipe, proofs: [{ selector: '.todoapp', kind: 'text', inputPath: '/invalid~2pointer' }] }), /JSON pointer/);
});

test('doctor blocks invalid contracts without evaluating candidates or launching Chromium', async () => {
  const report = await checkScenario({ ...vue, validate: () => ['bad fixture'], candidates: () => { throw new Error('must not run'); } });
  assert.equal(report.status, 'blocked');
  assert.equal(report.browser, undefined);
  assert.deepEqual(report.checks.map(check => [check.id, check.status]), [['config', 'failed']]);
  assert.match(report.checks[0].message, /Invalid baseline: bad fixture/);
});

test('doctor reports unreadable sources before a browser launch', async () => {
  const report = await checkScenario({ ...vue, sourceFiles: ['does-not-exist-ui-crash-test.ts'] });
  assert.equal(report.status, 'blocked');
  assert.equal(report.browser, undefined);
  assert.equal(report.checks.at(-1)?.id, 'sources');
  assert.match(report.checks.at(-1)!.message, /does-not-exist/);
});

test('doctor keeps an explicit warning for undeclared app sources and rejects invalid URLs', async () => {
  for (const appURL of ['file:///tmp/app.html', 'http://username:password@localhost:3000']) {
    const report = await checkScenario({ ...vue, sourceFiles: [] }, { appURL });
    assert.equal(report.status, 'blocked');
    assert.equal(report.browser, undefined);
    assert.equal(report.checks.find(check => check.id === 'sources')?.status, 'warning');
    assert.equal(report.checks.at(-1)?.id, 'url');
  }
});

test('inconclusive reports show only screenshots actually captured', () => {
  const report: ScenarioReport = {
    schemaVersion: 2, id: 'blocked', createdAt: '2026-11-03', seed: 42, durationMs: 0,
    scenario: { id: 'vue', name: '<Adapter>', description: 'Blocked setup', provenance: {} },
    outcome: 'inconclusive', appURL: 'http://localhost:3000', environment: { browser: 'test', node: 'test', sourceHash: 'test', sources: [] },
    baseline: { input: {}, finding: { status: 'inconclusive', signature: 'test', reason: '<Missing target>', overflowPx: 0, contained: false, receivesEvents: false } },
    discovery: [], summary: { checked: 0, failed: 0, passed: 0, inconclusive: 0, valid: 1 },
    original: null, reduced: null, reduction: null, confirmation: null, regression: null, screenshots: [],
  };
  const missing = scenarioHTML(report);
  assert.doesNotMatch(missing, /<img/);
  assert.match(missing, /No screenshot was captured/);
  assert.match(missing, /&lt;Missing target&gt;/);
  const captured = scenarioHTML({ ...report, screenshots: ['baseline.png'] });
  assert.match(captured, /src="baseline.png"/);
  assert.doesNotMatch(captured, /src="sample.png"/);
});


test('an invalid discovery viewport is rejected before campaign setup or artifact writes', async () => {
  const bad = { ...vue, cases: () => [{ name: 'Invalid viewport', origin: 'curated' as const, input: { ...vue.baseline, viewportWidth: 199 } }], validate: () => [] };
  const diagnosis = await checkScenario(bad);
  assert.equal(diagnosis.status, 'blocked');
  assert.equal(diagnosis.browser, undefined);
  assert.match(diagnosis.checks[0].message, /viewport/);
  await assert.rejects(runScenario(bad), /viewport/);
});


test('text-fit is an explicit rule and rejects action-only options or unknown kinds', () => {
  const rule = { kind: 'text-fit' as const, id: 'name-fit', target: 'h1', boundary: 'header' };
  assert.doesNotThrow(() => validateRecipe({ ...vue.recipe, rule }));
  assert.throws(() => validateRecipe({ ...vue.recipe, rule: { ...rule, kind: 'typo' as never } }), /rule kinds/);
  assert.throws(() => validateRecipe({ ...vue.recipe, rule: { ...rule, requireViewportCenter: true } as never }), /action rules only/);
});
