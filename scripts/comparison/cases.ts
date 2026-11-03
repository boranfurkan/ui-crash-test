import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import type { ActionRule } from "../../src/core/action-rule.ts";
import { RULE_CONTROLS, CONTROL_RULE, mountControl } from "../../fixtures/controls/cases.ts";
import { preparePage, viewportFor } from "../../src/scenario/replay.ts";
import type { BrowserRecipe, Json } from "../../src/scenario/config.ts";
import member, { memberRecipe } from '../../scenarios/member-list.ts';
import cart from '../../scenarios/cart-preview.ts';
import vue from '../../scenarios/todomvc-vue.ts';
import { dialogScenario, tableScenario } from '../../scenarios/compat.ts';

export type ComparisonCase = { id: string; name: string; group: 'control' | 'application'; category: string; expectedForOurRule?: string; viewport: { width: number; height: number }; rule: ActionRule; input?: Json; html?: string; recipe?: BrowserRecipe; patch?: string; prepare: (page: Page, baseURL: string) => Promise<void> };
const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

export function comparisonCases(): ComparisonCase[] {
  const controls: ComparisonCase[] = RULE_CONTROLS.map(control => ({ id: `control-${control.id}`, name: control.name, group: 'control', category: control.category, expectedForOurRule: control.expected, viewport: { width: 600, height: 400 }, rule: control.rule ?? CONTROL_RULE, html: control.html, prepare: page => mountControl(page, control) }));
  const applications: ComparisonCase[] = [];
  const add = (id: string, name: string, recipe: BrowserRecipe, input: Json, patch?: string) => {
    if (recipe.rule.kind === 'text-fit') throw new Error('The matched action comparison requires an action rule.');
    const rule = recipe.rule;
    applications.push({ id, name, group: 'application', category: patch ? 'candidate-css' : 'declared-application-state', viewport: viewportFor(recipe, input), rule, recipe, input, patch,
    prepare: async (page, baseURL) => { await preparePage(page, baseURL, recipe, input); if (patch) { await page.addStyleTag({ content: patch }); await page.locator(recipe.rule.target).scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); } },
  });
  };
  const memberSaved = read('fixtures/corpus/member-inputs.json');
  const cartSaved = read('fixtures/corpus/cart-input.json');
  add('member-normal', 'Member reference · normal control', memberRecipe(), member.baseline);
  add('member-original', 'Member reference · original valid failure', memberRecipe(), memberSaved.original);
  add('member-reduced', 'Member reference · reduced failure', memberRecipe(), memberSaved.reduced);
  add('member-fixed', 'Member reference · fixed same input', memberRecipe('fixed'), memberSaved.reduced);
  add('cart-normal', 'Pinned cart · normal control', cart.recipe, cart.baseline);
  add('cart-original', 'Pinned cart · original landscape case', cart.recipe, cart.cases(42)[0].input);
  add('cart-reduced', 'Pinned cart · reduced same failure', cart.recipe, cartSaved);
  add('cart-candidate', 'Pinned cart · investigation-only CSS candidate', cart.recipe, cartSaved, readFileSync(new URL('../../fixtures/compat-app/cart-candidate.css', import.meta.url), 'utf8'));
  add('vue-normal', 'Unchanged complete Vue app · normal tasks', vue.recipe, vue.baseline);
  add('vue-long-narrow', 'Unchanged Vue app · long task at 320px', vue.recipe, { ...vue.cases(42)[0].input, viewportWidth: 320 });
  add('dialog-constrained', 'Radix dialog · long content at constrained height', dialogScenario.recipe, dialogScenario.cases(42)[2].input);
  add('table-long', 'Radix table · long valid email with scrolling', tableScenario.recipe, tableScenario.cases(42)[3].input);
  return [...controls, ...applications];
}

export function comparisonSourceFiles(): string[] {
  return [...new Set([member, cart, vue, dialogScenario, tableScenario].flatMap(config => config.sourceFiles))].sort();
}
