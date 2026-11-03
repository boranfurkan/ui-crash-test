import type { ScenarioConfig } from 'ui-crash-test';
import profile from './holo-grails-profile.ts';

type Input = typeof profile.baseline;
const config: ScenarioConfig<Input> = {
  ...profile,
  id: 'holo-grails-name', name: 'Holo Grails · required profile name',
  description: 'After a real demo profile save, the required name must fit horizontally inside its profile header and overflow clips.',
  recipe: {
    ...profile.recipe,
    setup: [
      ...profile.recipe.setup!,
      { action: 'click', selector: 'main form button[type="submit"]' },
      { action: 'wait', selector: 'main header h1' },
      { action: 'scroll', selector: 'main header h1' },
    ],
    ready: 'main header h1',
    proofs: [{ selector: 'main header h1', kind: 'text', inputPath: '/displayNames/0' }],
    rule: { kind: 'text-fit', id: 'required-profile-name-fits', target: 'main header h1', boundary: 'main header:has(h1)' },
  },
  candidates: input => [
    { label: 'Remove optional bio', input: { ...input, bio: '' } },
    { label: 'Keep final name token', input: { ...input, displayNames: [input.displayNames[0].split(/\s+/).at(-1)!] } },
    { label: 'Shorten handle', input: { ...input, handle: 'alex' } },
    { label: 'Short control name', input: { ...input, displayNames: ['Alex'] } },
    { label: 'Remove final name character', input: { ...input, displayNames: [input.displayNames[0].slice(0, -1).trim()] } },
  ],
  sourceFiles: [...profile.sourceFiles, 'src/features/profile/profile-header.tsx', 'src/lib/queries/account.ts', 'src/lib/api/mock/account.ts'],
  provenance: { ...profile.provenance, policy: 'Explicit horizontal fit for the full displayed name. Vertical clipping and occlusion are outside this rule.' },
};
export default config;
