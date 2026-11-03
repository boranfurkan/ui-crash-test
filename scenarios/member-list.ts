import { BASELINE, RULE, cloneInput, primaryMember, TARGET_ID, validateInput, type CaseInput } from '../src/shared/model.ts';
import { generateScenarios } from '../src/core/generate.ts';
import { defineScenario, type BrowserRecipe } from '../src/scenario/config.ts';

export function memberRecipe(layout: 'broken' | 'fixed' = 'broken'): BrowserRecipe {
  return { path: `/fixture?layout=${layout}`, query: { width: '/containerWidth' }, viewport: { width: 1000, height: 900 },
    fixtures: [{ url: '**/api/members?*' }], ready: '[data-fixture-stage][data-ready="true"]',
    proofs: [{ selector: '[data-fixture-stage][data-ready="true"]', kind: 'jsonAttribute', attribute: 'data-input' }], screenshot: '[data-fixture-stage]', rule: RULE };
}

export default defineScenario({
  id: 'member-list', name: 'Member list · reference defect', description: 'The primary member action must remain contained and receive pointer events.',
  recipe: memberRecipe(), baseline: BASELINE, validate: validateInput, cases: seed => generateScenarios(seed, 360),
  candidates: input => {
    const result: { label: string; input: CaseInput }[] = [];
    for (const row of input.members.filter(row => row.id !== TARGET_ID)) { const next = cloneInput(input); next.members = next.members.filter(item => item.id !== row.id); result.push({ label: 'Remove unrelated member', input: next }); }
    for (const [field, value] of [['avatar', null], ['role', null], ['status', 'active'], ['email', 'a@b.co']] as const) {
      const next = cloneInput(input); Object.assign(primaryMember(next), { [field]: value }); result.push({ label: `Simplify ${field}`, input: next });
    }
    for (const name of ['Jo', 'Maya Chen', 'Alexandria', ...primaryMember(input).name.split(/\s+/)]) { const next = cloneInput(input); primaryMember(next).name = name; result.push({ label: `Shorter name: ${name}`, input: next }); }
    return result;
  },
  sourceFiles: ['scenarios/member-list.ts', 'src/app/MemberList.tsx', 'src/app/styles.css', 'src/app/FixtureView.tsx'],
  provenance: { kind: 'reference-fixture', intentionalDefect: true, scope: 'Original local demonstration; serves as a failing control for the configurable runner.' },
});
