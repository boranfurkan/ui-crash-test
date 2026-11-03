import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { compatBaseline, compatScenarios, validateCompat } from '../scenarios/compat.ts';
import member from '../scenarios/member-list.ts';
import cart, { validateCart, cartBaseline } from '../scenarios/cart-preview.ts';
import todomvc, { validateTodo } from '../scenarios/todomvc-vue.ts';
import holo from '../scenarios/holo-grails-profile.ts';
import { inputAt, validateRecipe, type Json, type ScenarioConfig } from '../src/scenario/config.ts';
import { reduceScenario } from '../src/scenario/reduce.ts';
import type { ActionFinding } from '../src/core/action-rule.ts';

const finding = (status: ActionFinding['status'], signature = 'same'): ActionFinding => ({ status, signature, reason: status, contained: false, receivesEvents: false, overflowPx: 10 });

test('external configs generate valid repeatable cases with declared scroll and portal setup', () => {
  for (const config of compatScenarios) {
    assert.deepEqual(config.validate(config.baseline), []);
    assert.deepEqual(config.cases(42), config.cases(42));
    assert.notDeepEqual(config.cases(42), config.cases(43));
    assert.equal(config.cases(42).length, 14);
    validateRecipe(config.recipe);
    for (const item of config.cases(42)) assert.deepEqual(config.validate(item.input), []);
    assert.ok(config.recipe.setup?.some(step => step.action === 'scroll'));
    for (const candidate of config.candidates(config.cases(42)[0].input)) assert.deepEqual(config.validate(candidate.input), []);
  }
  assert.equal(compatScenarios[1].recipe.rule.boundary, '[role="dialog"]');
  assert.equal(compatScenarios[1].recipe.setup?.[0].action, 'click');
});

test('fixture contract rejects corrupt fields and lost target identities', () => {
  assert.deepEqual(validateCompat(compatBaseline), []);
  for (const input of [null, [], { ...compatBaseline, title: '' }, { ...compatBaseline, viewportHeight: 0 }, { ...compatBaseline, rows: null }, { ...compatBaseline, rows: [null] }, { ...compatBaseline, rows: [...compatBaseline.rows, compatBaseline.rows[0]] }, { ...compatBaseline, rows: [...compatBaseline.rows].reverse() }]) assert.ok(validateCompat(input).length);
});

test('JSON pointers support escaping and reject prototype/inherited paths', () => {
  assert.equal(inputAt({ 'a/b': { '~x': 3 } }, '/a~1b/~0x'), 3);
  assert.equal(inputAt({ array: ['a'] }, '/array/0'), 'a');
  assert.throws(() => inputAt({}, '/toString'));
  assert.throws(() => inputAt({}, 'bad'));
  assert.throws(() => validateRecipe({ ...member.recipe, path: '//elsewhere.test' }));
});

test('generic reduction validates candidates, preserves the exact failure, uses fresh candidates and respects budget', async () => {
  const config: ScenarioConfig<{ text: string }> = { ...member, baseline: { text: 'long input' }, validate: input => typeof (input as { text: string })?.text === 'string' ? [] : ['invalid'], cases: () => [], candidates: input => [{ label: 'invalid', input: { text: null as unknown as string } }, { label: 'halve', input: { text: input.text.slice(0, Math.floor(input.text.length / 2)) } }] };
  const original = { text: 'abcdefghijk' };
  const visited: Json[] = [];
  const result = await reduceScenario(config, original, 'same', async input => { visited.push(input); return finding('failed'); }, 3);
  assert.equal(result.evaluations, 3);
  assert.equal(result.complete, false);
  assert.equal(result.input.text, 'a');
  assert.equal(original.text, 'abcdefghijk');
  assert.ok(visited.every(input => typeof (input as { text: string }).text === 'string'));
  for (const failure of [finding('failed', 'different'), finding('inconclusive'), finding('passed')]) {
    const unchanged = await reduceScenario(config, original, 'same', async () => failure);
    assert.deepEqual(unchanged.input, original);
    assert.ok(unchanged.steps.every(step => !step.accepted));
  }
});

test('vendored shopping app sources match the blob hashes fetched at the pinned upstream commit', async () => {
  const root = new URL('../fixtures/compat-app/vendor/react-shopping-cart/', import.meta.url);
  const blobs: Record<string, string> = JSON.parse(await readFile(new URL('upstream-blobs.json', root), 'utf8'));
  for (const [path, expected] of Object.entries(blobs)) {
    const source = await readFile(new URL(path, root));
    const actual = createHash('sha1').update(`blob ${source.length}\0`).update(source).digest('hex');
    assert.equal(actual, expected, `Original upstream bytes changed: ${path}`);
  }
});

test('cart cases and reductions preserve the valid cart contract and viewport conditions', () => {
  assert.deepEqual(validateCart(cartBaseline), []);
  assert.deepEqual(cart.cases(42), cart.cases(42));
  assert.equal(cart.cases(42).length, 14);
  for (const item of cart.cases(42)) {
    assert.deepEqual(validateCart(item.input), []);
    for (const candidate of cart.candidates(item.input)) {
      assert.deepEqual(validateCart(candidate.input), []);
      assert.equal(candidate.input.viewportHeight, item.input.viewportHeight);
      assert.equal(candidate.input.viewportWidth, item.input.viewportWidth);
    }
  }
  for (const input of [null, [], { ...cartBaseline, products: [] }, { ...cartBaseline, products: [null] }, { ...cartBaseline, products: [...cartBaseline.products, cartBaseline.products[0]] }, { ...cartBaseline, viewportHeight: 0 }]) assert.ok(validateCart(input).length);
});

test('mirrored original cart images match recorded hashes and embedded replay resources', async () => {
  const root = new URL('../fixtures/compat-app/assets/', import.meta.url);
  const assets: { file: string; url: string; sha256: string }[] = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
  for (const asset of assets) {
    const data = await readFile(new URL(asset.file, root));
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256);
    assert.deepEqual(Buffer.from(cart.recipe.resources!.find(resource => resource.url === asset.url)!.base64, 'base64'), data);
  }
});

test('the Vue adapter has valid repeatable tasks and needs a declared API or form input boundary', () => {
  assert.deepEqual(todomvc.cases(42), todomvc.cases(42));
  assert.notDeepEqual(todomvc.cases(42), todomvc.cases(43));
  assert.equal(todomvc.cases(42).length, 14);
  validateRecipe(todomvc.recipe);
  for (const item of todomvc.cases(42)) {
    assert.deepEqual(validateTodo(item.input), []);
    for (const candidate of todomvc.candidates(item.input)) {
      assert.deepEqual(validateTodo(candidate.input), []);
      assert.equal(candidate.input.viewportWidth, item.input.viewportWidth);
      assert.equal(candidate.input.viewportHeight, item.input.viewportHeight);
    }
  }
  for (const input of [null, [], { ...todomvc.baseline, titles: [] }, { ...todomvc.baseline, titles: [''] }, { ...todomvc.baseline, titles: [' leading space'] }, { ...todomvc.baseline, titles: [null] }, { ...todomvc.baseline, viewportWidth: 0 }]) assert.ok(validateTodo(input).length);
  assert.throws(() => validateRecipe({ ...todomvc.recipe, form: undefined }), /input boundary/);
  assert.throws(() => validateRecipe({ ...todomvc.recipe, form: { input: '', itemsPath: '/titles', submitKey: 'Enter' } }), /form boundary/);
});

test('all retained TodoMVC source and distribution files match the pinned upstream Git blobs', async () => {
  const root = new URL('../fixtures/todomvc/', import.meta.url);
  const manifest: { files: { path: string; gitBlob: string }[] } = JSON.parse(await readFile(new URL('provenance.json', root), 'utf8'));
  for (const file of manifest.files) {
    const body = await readFile(new URL(file.path, root));
    assert.equal(createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex'), file.gitBlob, file.path);
  }
});

test('the Holo Grails adapter keeps all generated fields within the actual profile limits', () => {
  assert.deepEqual(holo.validate(holo.baseline), []);
  assert.deepEqual(holo.cases(42), holo.cases(42));
  assert.notDeepEqual(holo.cases(42), holo.cases(43));
  assert.equal(holo.cases(42).length, 14);
  validateRecipe(holo.recipe);
  for (const item of holo.cases(42)) {
    assert.deepEqual(holo.validate(item.input), [], item.name);
    for (const candidate of holo.candidates(item.input)) {
      assert.deepEqual(holo.validate(candidate.input), []);
      assert.equal(candidate.input.width, item.input.width);
      assert.equal(candidate.input.height, item.input.height);
    }
  }
  for (const input of [{ ...holo.baseline, displayNames: ['A'.repeat(25)] }, { ...holo.baseline, handle: 'a'.repeat(16) }, { ...holo.baseline, bio: 'a'.repeat(161) }]) assert.ok(holo.validate(input).length);
});
