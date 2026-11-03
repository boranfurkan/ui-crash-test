import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE, WORST_CASE, cloneInput, inputComplexity, primaryMember, validateInput } from "../src/demo/model.ts";
import { generateScenarios } from "../src/demo/generate.ts";
import { reduceCase } from "../src/demo/reduce.ts";
import { standaloneReport } from "../src/demo/standalone.ts";
import type { ActionFinding } from '../src/core/action-rule.ts';

const finding = (status: ActionFinding['status'], signature = 'same-rule'): ActionFinding => ({ status, signature, reason: status, contained: false, receivesEvents: false, overflowPx: status === 'failed' ? 30 : 0 });

test('generator is repeatable, has both curated and generated cases, and respects the input contract', () => {
  const first = generateScenarios(42, 360);
  assert.deepEqual(first, generateScenarios(42, 360));
  assert.notDeepEqual(first, generateScenarios(43, 360));
  assert.equal(first.length, 14);
  assert.equal(first.filter(item => item.origin === 'generated').length, 8);
  for (const width of [320, 360, 640]) for (const item of generateScenarios(42, width)) assert.deepEqual(validateInput(item.input), []);
});

test('validator rejects invalid identities, duplicate targets, invalid emails and unsupported widths', () => {
  assert.deepEqual(validateInput(BASELINE), []);
  assert.deepEqual(validateInput(WORST_CASE), []);
  assert.ok(validateInput(null).length);
  const duplicate = cloneInput(BASELINE);
  duplicate.members[1].id = duplicate.members[0].id;
  assert.ok(validateInput(duplicate).some(message => message.includes('unique')));
  const invalid = cloneInput(BASELINE);
  invalid.containerWidth = 319;
  primaryMember(invalid).email = 'not an email';
  assert.equal(validateInput(invalid).length, 2);
});

test('reduction retains a valid target, decreases complexity and does not mutate the supplied fixture', async () => {
  const original = cloneInput(WORST_CASE);
  const retained: number[] = [];
  const result = await reduceCase(original, 'same-rule', async input => {
    assert.deepEqual(validateInput(input), []);
    return finding('failed');
  }, { onStep: step => { if (step.accepted) retained.push(step.complexity); } });
  assert.deepEqual(original, WORST_CASE);
  assert.deepEqual(validateInput(result.input), []);
  assert.equal(result.input.members.length, 1);
  assert.equal(result.input.containerWidth, original.containerWidth);
  assert.ok(result.finalComplexity < result.initialComplexity);
  assert.ok(retained.every((score, index) => index === 0 || score < retained[index - 1]));
  assert.equal(result.finalComplexity, inputComplexity(result.input));
});

test('a different failure or an inconclusive experiment is never accepted as a reduction', async () => {
  for (const outcome of [finding('failed', 'different-rule'), finding('inconclusive')]) {
    const result = await reduceCase(WORST_CASE, 'same-rule', async () => outcome);
    assert.deepEqual(result.input, WORST_CASE);
    assert.ok(result.steps.every(step => !step.accepted));
  }
});

test('reducer respects the evaluation budget and labels an unfinished search honestly', async () => {
  let calls = 0;
  const result = await reduceCase(WORST_CASE, 'same-rule', async () => { calls++; return finding('failed'); }, { budget: 1 });
  assert.equal(calls, 1);
  assert.equal(result.evaluations, 1);
  assert.equal(result.complete, false);
  assert.deepEqual(validateInput(result.input), []);
});

test('standalone reports escape application-derived values', () => {
  const report = {
    id: 'run-test', outcome: 'no-failure', seed: 42, createdAt: '<script>alert(1)</script>',
    summary: { checked: 1, failed: 0 }, environment: { browser: 'test', node: 'test', sourceHash: 'abc' },
    discovery: [{ name: '<img src=x onerror=alert(1)>', status: 'passed', reason: 'safe' }],
  } as unknown as Parameters<typeof standaloneReport>[0];
  const html = standaloneReport(report);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('<img src=x onerror='));
  assert.ok(html.includes('&lt;script&gt;'));
});
