import type { ActionRule } from '../core/action-rule.ts';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type SetupStep = { action: 'click' | 'fill' | 'wait' | 'scroll' | 'hover'; selector: string; value?: string; inputPath?: string };
export type RenderProof = { selector: string; kind: 'text' | 'texts' | 'attribute' | 'jsonAttribute'; attribute?: string; inputPath?: string };
/** This JSON recipe is copied into exported tests; replay never imports the generator. */
export type BrowserRecipe = {
  path: string;
  query?: Record<string, string>;
  viewport: { width: number; height: number };
  viewportFromInput?: { width?: string; height?: string };
  fixtures?: { url: string; inputPath?: string }[];
  form?: { input: string; itemsPath: string; submitKey: string };
  resources?: { url: string; contentType: string; base64: string }[];
  setup?: SetupStep[];
  ready: string;
  proofs: RenderProof[];
  screenshot: string;
  rule: ActionRule;
};
export type ScenarioCase<T extends Json> = { name: string; input: T; origin: 'curated' | 'generated' };
export type ScenarioConfig<T extends Json = Json> = {
  id: string;
  name: string;
  description: string;
  appURL?: string;
  recipe: BrowserRecipe;
  baseline: T;
  validate: (input: unknown) => string[];
  cases: (seed: number) => ScenarioCase<T>[];
  candidates: (input: T) => { label: string; input: T }[];
  sourceFiles: string[];
  provenance: Record<string, Json>;
};
export function defineScenario<T extends Json>(config: ScenarioConfig<T>): ScenarioConfig<T> { return config; }

/** Retain validation when combining configs with different input types in one registry. */
export function asScenario<T extends Json>(config: ScenarioConfig<T>): ScenarioConfig {
  return { ...config, candidates(input) {
    if (config.validate(input).length) throw new Error('Candidate input does not satisfy this scenario’s contract.');
    return config.candidates(input as T);
  } };
}

export function inputAt(input: Json, path = ''): Json {
  if (!path) return input;
  if (!path.startsWith('/')) throw new Error('Input paths must be JSON pointers.');
  let value: Json = input;
  for (const part of path.slice(1).split('/')) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) throw new Error(`Missing input path: ${path}`);
    value = (value as Record<string, Json>)[key];
  }
  return value;
}

export function validateRecipe(recipe: BrowserRecipe) {
  if (!recipe || typeof recipe.path !== 'string' || !recipe.path.startsWith('/') || recipe.path.startsWith('//') || recipe.path.includes('\\')) throw new Error('A recipe needs a same-origin application path.');
  const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  const pointer = (value: unknown) => typeof value === 'string' && (value === '' || value.startsWith('/')) && !/~(?:[^01]|$)/.test(value);
  if (!recipe.viewport || !['width', 'height'].every(key => Number.isInteger(recipe.viewport[key as 'width' | 'height']) && recipe.viewport[key as 'width' | 'height'] >= 200 && recipe.viewport[key as 'width' | 'height'] <= 3000)) throw new Error('Declare viewport width and height as integers from 200 to 3000.');
  if (recipe.fixtures !== undefined && (!Array.isArray(recipe.fixtures) || recipe.fixtures.some(fixture => !fixture || !text(fixture.url) || (fixture.inputPath !== undefined && !pointer(fixture.inputPath))))) throw new Error('Every API fixture needs a URL pattern and an optional JSON pointer.');
  if (!(recipe.fixtures?.length || recipe.form) || !Array.isArray(recipe.proofs) || !recipe.proofs.length || !text(recipe.ready) || !text(recipe.screenshot)) throw new Error('Declare an API or form input boundary, rendered-input proofs, readiness and screenshot selectors.');
  if (recipe.form && (!text(recipe.form.input) || !pointer(recipe.form.itemsPath) || !text(recipe.form.submitKey))) throw new Error('A form boundary needs input, itemsPath (a JSON pointer) and submitKey.');
  if (!recipe.rule || !text(recipe.rule.id) || !text(recipe.rule.target) || !text(recipe.rule.boundary)) throw new Error('Declare a rule target and boundary.');
  if (recipe.rule.requireViewportCenter !== undefined && typeof recipe.rule.requireViewportCenter !== 'boolean') throw new Error('requireViewportCenter must be a boolean.');
  for (const value of [...Object.values(recipe.query ?? {}), ...Object.values(recipe.viewportFromInput ?? {})]) if (!pointer(value)) throw new Error('Query and viewport input paths must be JSON pointers.');
  for (const proof of recipe.proofs) {
    if (!proof || !text(proof.selector) || !['text', 'texts', 'attribute', 'jsonAttribute'].includes(proof.kind)) throw new Error('Every rendered-input proof needs a selector and a supported kind.');
    if (['attribute', 'jsonAttribute'].includes(proof.kind) && !text(proof.attribute)) throw new Error('Attribute proofs need an attribute name.');
    if (proof.inputPath !== undefined && !pointer(proof.inputPath)) throw new Error('Proof inputPath must be a JSON pointer.');
  }
  if (recipe.setup !== undefined && (!Array.isArray(recipe.setup) || recipe.setup.some(step => !step || !['click', 'fill', 'wait', 'scroll', 'hover'].includes(step.action) || !text(step.selector)))) throw new Error('Every setup step needs a supported action and selector.');
  for (const step of recipe.setup ?? []) if (step.inputPath !== undefined && !pointer(step.inputPath)) throw new Error('Setup inputPath must be a JSON pointer.');
}

/** Validate the supplied campaign before launching Chromium. Does not execute reduction candidates. */
export function scenarioCases<T extends Json>(config: ScenarioConfig<T>, seed: number): ScenarioCase<T>[] {
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new Error('Seed must be an integer from 0 to 2147483647.');
  if (!config || typeof config.id !== 'string' || !/^[a-z0-9-]+$/.test(config.id)) throw new Error('Scenario ID must use lowercase letters, numbers and hyphens.');
  if (typeof config.name !== 'string' || !config.name.trim() || typeof config.description !== 'string') throw new Error('Declare a scenario name and description.');
  if (typeof config.validate !== 'function' || typeof config.cases !== 'function' || typeof config.candidates !== 'function') throw new Error('Default-export a scenario with validate, cases and candidates functions.');
  if (!Array.isArray(config.sourceFiles) || config.sourceFiles.some(path => typeof path !== 'string' || !path.trim())) throw new Error('sourceFiles must be an array of file paths.');
  if (!config.provenance || typeof config.provenance !== 'object' || Array.isArray(config.provenance)) throw new Error('Declare a provenance object.');
  validateRecipe(config.recipe);
  const cases = config.cases(seed);
  if (!Array.isArray(cases) || !cases.length || cases.length > 200) throw new Error('Declare 1–200 discovery cases.');
  for (const item of cases) if (!item || typeof item.name !== 'string' || !item.name.trim() || !['curated', 'generated'].includes(item.origin)) throw new Error('Each case needs a name, origin (curated or generated) and valid input.');
  for (const item of [{ name: 'baseline', input: config.baseline }, ...cases]) {
    const errors = config.validate(item.input);
    if (!Array.isArray(errors) || errors.some(error => typeof error !== 'string')) throw new Error('validate(input) must return an array of error strings.');
    if (errors.length) throw new Error(`Invalid ${item.name}: ${errors.join('; ')}`);
  }
  return cases;
}
