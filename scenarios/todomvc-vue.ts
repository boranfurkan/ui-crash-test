import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { defineScenario, type ScenarioCase } from '../src/scenario/config.ts';

export type TodoInput = { titles: string[]; viewportWidth: number; viewportHeight: number };
export const todoBaseline: TodoInput = { titles: ['Review the pull request', 'Write release notes', 'Update the documentation'], viewportWidth: 1000, viewportHeight: 900 };
export function validateTodo(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Expected a todo input object'];
  const value = input as TodoInput, errors: string[] = [];
  if (!Number.isInteger(value.viewportWidth) || value.viewportWidth < 320 || value.viewportWidth > 1280 || !Number.isInteger(value.viewportHeight) || value.viewportHeight < 280 || value.viewportHeight > 900) errors.push('Unsupported viewport');
  if (!Array.isArray(value.titles) || !value.titles.length || value.titles.length > 5) return [...errors, 'Expected 1–5 todo titles'];
  for (const title of value.titles) if (typeof title !== 'string' || [...title].length < 1 || [...title].length > 160 || title.trim() !== title || /[\r\n]/.test(title)) errors.push('Titles must be trimmed single-line strings of 1–160 Unicode code points');
  return errors;
}
const longTitle = 'Investigate the international customer onboarding experience and prepare the accessibility review before the next release';
const cases = (seed: number): ScenarioCase<TodoInput>[] => {
  const make = (name: string, changes: Partial<TodoInput>): ScenarioCase<TodoInput> => ({ name, origin: 'curated', input: { ...structuredClone(todoBaseline), ...changes } });
  return [
    make('Long realistic task', { titles: [longTitle, 'Write release notes'] }),
    make('Narrow mobile viewport', { viewportWidth: 320, viewportHeight: 600 }),
    make('Landscape phone viewport', { viewportWidth: 640, viewportHeight: 320 }),
    make('Unbroken task title', { titles: ['InternationalCustomerOnboardingAccessibilityAndRegionalShippingConfiguration'.repeat(2)], viewportWidth: 360 }),
    make('Unicode and right-to-left content', { titles: ['国際配送の確認 — مراجعة الطلب — Україна'], viewportWidth: 390 }),
    make('Five tasks and a tall first row', { titles: [longTitle, 'Review pull request', 'Update documentation', 'Run regression checks', 'Publish release notes'], viewportWidth: 320, viewportHeight: 320 }),
    ...fc.sample(fc.record({ titles: fc.constantFrom(['Review the pull request'], [longTitle, 'Write release notes'], ['国際配送の確認 — مراجعة الطلب']), viewportWidth: fc.constantFrom(320, 390, 640, 1000), viewportHeight: fc.constantFrom(320, 600, 900) }), { seed, numRuns: 8 }).map((changes, index) => ({ ...make(`Seeded combination ${index + 1}`, { ...changes, titles: [...changes.titles] }), origin: 'generated' as const })),
  ];
};
const provenance = JSON.parse(readFileSync(new URL('../fixtures/todomvc/provenance.json', import.meta.url), 'utf8'));

export default defineScenario({
  id: 'todomvc-vue', name: 'TodoMVC · complete Vue app',
  description: 'Enter tasks through the unchanged app’s real form, then hover the first row. Its delete action must remain inside the row and receive a pointer hit. This is the maintained upstream framework example, not a production application.',
  baseline: todoBaseline, validate: validateTodo, cases,
  candidates: input => [
    { label: 'Remove unrelated tasks', input: { ...structuredClone(input), titles: [input.titles[0]] } },
    { label: 'Shorten the target task', input: { ...structuredClone(input), titles: input.titles.map((title, index) => index ? title : 'Review') } },
  ],
  recipe: {
    path: '/subjects/todomvc/examples/vue/dist/index.html#/', viewport: { width: 1000, height: 900 }, viewportFromInput: { width: '/viewportWidth', height: '/viewportHeight' },
    form: { input: '.new-todo', itemsPath: '/titles', submitKey: 'Enter' },
    setup: [{ action: 'scroll', selector: '.todo-list > li:first-child' }, { action: 'hover', selector: '.todo-list > li:first-child' }],
    ready: '.todo-list > li:first-child', proofs: [{ selector: '.todo-list > li .view > label', kind: 'texts', inputPath: '/titles' }], screenshot: 'viewport',
    rule: { id: 'todo-delete-reachable', target: '.todo-list > li:first-child .destroy', boundary: '.todo-list > li:first-child' },
  },
  sourceFiles: ['scenarios/todomvc-vue.ts', 'src/server/subjects.ts', 'fixtures/todomvc/provenance.json', ...provenance.files.map((file: { path: string }) => `fixtures/todomvc/${file.path}`)],
  provenance: { kind: 'complete-upstream-application', repository: provenance.repository, commit: provenance.commit, revisionDate: provenance.commitDate, license: 'MIT', maintenanceEvidence: provenance.maintenanceEvidence, adaptation: 'Complete upstream prebuilt Vue example served byte-for-byte, including its original HTML, CSS, Vue runtime and auxiliary metadata. No application source, wrappers or styles are changed. Synthetic tasks enter via the native form. Hover is a declared desktop interaction. This is an official maintained example, not a production product or independent developer study.' },
});
