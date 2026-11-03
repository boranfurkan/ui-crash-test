import type { ActionRule } from '../core/action-rule.ts';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type SetupStep = { action: 'click' | 'fill' | 'wait' | 'scroll'; selector: string; value?: string; inputPath?: string };
export type RenderProof = { selector: string; kind: 'text' | 'attribute' | 'jsonAttribute'; attribute?: string; inputPath?: string };
/** This JSON recipe is copied into exported tests; replay never imports the generator. */
export type BrowserRecipe = {
  path: string;
  query?: Record<string, string>;
  viewport: { width: number; height: number };
  viewportFromInput?: { width?: string; height?: string };
  fixtures: { url: string; inputPath?: string }[];
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
  if (!recipe.path.startsWith('/') || recipe.path.startsWith('//') || recipe.path.includes('\\')) throw new Error('A recipe needs a same-origin application path.');
  if (!recipe.fixtures.length || !recipe.proofs.length || !recipe.ready || !recipe.screenshot) throw new Error('Declare fixtures, rendered-input proofs, readiness and screenshot selectors.');
  if (!recipe.rule.id || !recipe.rule.target || !recipe.rule.boundary) throw new Error('Declare a rule target and boundary.');
}
