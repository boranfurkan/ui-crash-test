import * as fc from 'fast-check';
import { BASELINE, WORST_CASE, cloneInput, type CaseInput } from '../shared/model.ts';

export type Scenario = { name: string; input: CaseInput; origin: 'curated' | 'generated' };

export function generateScenarios(seed: number, width: number): Scenario[] {
  const preset = (name: string, changes: Partial<CaseInput['members'][number]>): Scenario => {
    const input = cloneInput(BASELINE);
    input.containerWidth = width;
    Object.assign(input.members[0], changes);
    return { name, input, origin: 'curated' };
  };
  const curated: Scenario[] = [
    { name: 'Compound name + pending invitation', input: { ...cloneInput(WORST_CASE), containerWidth: width }, origin: 'curated' },
    preset('Long email address', { email: 'bartholomew.fitzgerald@northwind-industries.example.test' }),
    preset('One-letter name', { name: 'J' }),
    preset('Missing avatar and role', { name: 'Jo', avatar: null, role: null }),
    preset('Vietnamese diacritics', { name: 'Đặng Thị Ngọc Hân' }),
    preset('Emoji grapheme in a name', { name: '👩🏽‍💻 Priya' }),
  ];
  const member = fc.record({
    name: fc.constantFrom('Maya Chen', 'Alexandria Konstantinopoulou-Wiśniewska', 'Aleksandra Wiśniewska-Kowalczyk', 'Konstantin Oberhauser', 'Jo', '王秀英', 'Noor Ali'),
    email: fc.constantFrom('maya@orbit.test', 'ops@sub.department.example.test', 'a@b.co', 'alexandria.konstantinopoulou@northwind.example.test'),
    role: fc.constantFrom<'Owner' | 'Member' | 'Viewer' | null>('Owner', 'Member', 'Viewer', null),
    status: fc.constantFrom<'active' | 'invited'>('active', 'invited'),
    avatar: fc.constantFrom<'sage' | 'sand' | 'lilac' | null>('sage', 'sand', 'lilac', null),
  });
  return [...curated, ...fc.sample(member, { seed, numRuns: 8 }).map((values, index): Scenario => {
    const input = cloneInput(BASELINE);
    input.containerWidth = width;
    Object.assign(input.members[0], values);
    return { name: `Seeded combination ${index + 1}`, input, origin: 'generated' };
  })];
}
