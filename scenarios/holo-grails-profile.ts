import type { ScenarioConfig } from 'ui-crash-test';

type Input = { displayNames: string[]; handle: string; bio: string; width: number; height: number };
const baseline: Input = { displayNames: ['Alex Morgan'], handle: 'alex_morgan', bio: 'Vintage holos and the stories behind each grail.', width: 390, height: 844 };
const longBio = 'Collector of vintage Japanese holos, international releases and hard-earned grails. Sharing provenance, grading notes and the story behind every card in the vault.'.slice(0, 160).trim();
const longName = 'Alexandria Konstantinou1';

const config: ScenarioConfig<Input> = {
  id: 'holo-grails-profile', name: 'Holo Grails · profile editor',
  description: 'With valid profile fields and permitted scrolling, Save profile remains inside the actual form and reachable in the viewport.',
  baseline,
  validate(input) {
    const value = input as Input;
    return value && Array.isArray(value.displayNames) && value.displayNames.length === 1
      && typeof value.displayNames[0] === 'string' && value.displayNames[0].trim() === value.displayNames[0] && value.displayNames[0].length > 0 && value.displayNames[0].length <= 24
      && typeof value.handle === 'string' && /^[a-z0-9_]{3,15}$/.test(value.handle)
      && typeof value.bio === 'string' && value.bio.trim() === value.bio && value.bio.length <= 160
      && Number.isInteger(value.width) && value.width >= 320 && value.width <= 1440
      && Number.isInteger(value.height) && value.height >= 320 && value.height <= 1024
      ? [] : ['Expected one trimmed 1–24 character display name, a 3–15 character handle, bio up to 160 characters and a supported viewport.'];
  },
  cases(seed) {
    let state = seed >>> 0;
    const pick = <T,>(values: T[]) => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return values[state % values.length]; };
    const widths = [320, 360, 390, 640, 768, 1440], heights = [320, 568, 844, 900, 1024];
    return [
      { name: '24-character display name and full bio at 320px', origin: 'curated' as const, input: { ...baseline, displayNames: [longName], bio: longBio, width: 320, height: 568 } },
      { name: 'Multilingual profile at phone width', origin: 'curated' as const, input: { ...baseline, displayNames: ['Zoë Şahin-Wiśniewska'], handle: 'zoe_sahin', width: 360, height: 844 } },
      { name: '15-character handle in landscape', origin: 'curated' as const, input: { ...baseline, handle: 'vintage_grails1', bio: longBio, width: 640, height: 320 } },
      { name: 'Empty optional bio on a tablet', origin: 'curated' as const, input: { ...baseline, bio: '', width: 768, height: 1024 } },
      { name: 'Long profile on a desktop', origin: 'curated' as const, input: { ...baseline, displayNames: [longName], bio: longBio, width: 1440, height: 900 } },
      { name: 'Short valid profile at constrained height', origin: 'curated' as const, input: { ...baseline, displayNames: ['Ada'], handle: 'ada', bio: '', width: 390, height: 320 } },
      ...Array.from({ length: 8 }, (_, i) => ({ name: `Seeded valid profile ${i + 1}`, origin: 'generated' as const, input: { displayNames: [pick([baseline.displayNames[0], longName, 'Zoë Şahin-Wiśniewska'])], handle: pick(['alex_morgan', 'vintage_grails1', 'ada']), bio: pick(['', baseline.bio, longBio]), width: pick(widths), height: pick(heights) } })),
    ];
  },
  candidates: input => [
    { label: 'Remove optional bio', input: { ...input, bio: '' } },
    { label: 'Shorten display name', input: { ...input, displayNames: ['Alex'] } },
    { label: 'Shorten handle', input: { ...input, handle: 'alex' } },
  ],
  recipe: {
    path: '/profile/edit', viewport: { width: 390, height: 844 },
    viewportFromInput: { width: '/width', height: '/height' },
    // Tab commits the controlled name field without submitting the profile.
    form: { input: 'main form input[id$="-name"]', itemsPath: '/displayNames', submitKey: 'Tab' },
    setup: [
      { action: 'fill', selector: 'main form input[id$="-handle"]', inputPath: '/handle' },
      { action: 'fill', selector: 'main form textarea[id$="-bio"]', inputPath: '/bio' },
      { action: 'scroll', selector: 'main form button[type="submit"]' },
    ],
    ready: 'main form button[type="submit"]',
    proofs: [
      { selector: 'main form input[id$="-name"]', kind: 'attribute', attribute: 'value', inputPath: '/displayNames/0' },
      { selector: 'main form input[id$="-handle"]', kind: 'attribute', attribute: 'value', inputPath: '/handle' },
      { selector: 'main form textarea[id$="-bio"]', kind: 'text', inputPath: '/bio' },
    ],
    screenshot: 'page',
    rule: { id: 'profile-save-reachable', target: 'main form button[type="submit"]', boundary: 'main form', requireViewportCenter: true },
  },
  sourceFiles: ['src/features/profile/profile-editor.tsx', 'src/features/profile/profile-setup-view.tsx', 'src/lib/domain/profile.ts', 'src/components/ui/button.tsx', 'src/styles/globals.css'],
  provenance: { kind: 'user-owned-application', repository: 'THE-SEVEN-SE4S/tradingcards-frontend', appRevision: '5e9ce9630960fccd94153402f1d2d011fcfdfd4a', mode: 'Built-in browser mock API and demo session; no real backend or wallet.' },
};

export default config;
