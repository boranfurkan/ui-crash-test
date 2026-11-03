import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonSummary, comparisonHTML, type ComparisonReport, type Observation } from "../scripts/comparison/report.ts";

const catalog = [{ id: 'app', name: '<img src=x onerror=alert(1)>', group: 'application', category: 'fixture' }, { id: 'control', name: 'Uncertain state', group: 'control', category: 'uncertain', expectedForOurRule: 'inconclusive' }];
const observations: Observation[] = catalog.flatMap(item => ['ui-crash-test', 'playwright-native', 'renderlint-layout'].map(method => ({ caseId: item.id, group: item.group, method, preparationMs: 1, measurementMs: 1, pageErrors: [], result: method === 'renderlint-layout' ? { status: 'findings', findings: [{ rule: 'example', message: '<script>bad()</script>' }] } : { status: item.group === 'application' ? 'failed' : method === 'ui-crash-test' ? 'inconclusive' : 'passed' } })));
const report: ComparisonReport = { id: 'example', createdAt: '2026-11-03', sourceHash: 'source', browser: 'browser', node: 'node', caseCount: 2, observations, comparator: { version: 'test', repositoryCommit: 'commit', layoutRules: [] } };

test('comparison summaries keep broad findings separate from action agreement and preserve disagreements', () => {
  const summary = comparisonSummary(report, catalog);
  assert.equal(summary.applicationAgreement, 1);
  assert.equal(summary.appRuleFailures, 1);
  assert.equal(summary.renderlintStatesWithFindings, 2);
  assert.equal(summary.controlDisagreements.length, 1);
  assert.equal(summary.ownControlMatches, 1);
});
test('incomplete or duplicated comparison observations cannot be presented as a completed report', () => {
  assert.throws(() => comparisonSummary({ ...report, observations: observations.slice(1) }, catalog), /Incomplete/);
  assert.throws(() => comparisonSummary({ ...report, observations: [...observations.slice(1), observations[1]] }, catalog), /Missing or duplicate/);
});
test('comparison reports escape application-derived names and raw finding text', () => {
  const html = comparisonHTML(report, catalog);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>bad()'));
  assert.ok(html.includes('&lt;script&gt;bad()'));
});
