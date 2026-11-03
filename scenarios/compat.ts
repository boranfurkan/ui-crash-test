import fc from 'fast-check';
import { defineScenario, type BrowserRecipe, type ScenarioCase } from '../src/scenario/config.ts';

export type CompatInput = { title: string; description: string; price: number; rows: { id: string; name: string; email: string }[]; viewportWidth: number; viewportHeight: number };
const target = 'record-primary';
const longName = 'Alexandria Konstantinopoulou-Wiśniewska';
export const compatBaseline: CompatInput = { title: 'Fresh broccoli', description: 'Review the product details before continuing.', price: 120, rows: [{ id: target, name: 'Maya Chen', email: 'maya@example.com' }, { id: 'record-secondary', name: 'Sam Miller', email: 'sam@example.com' }], viewportWidth: 1000, viewportHeight: 900 };

export function validateCompat(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Expected an object'];
  const data = input as CompatInput;
  const errors: string[] = [];
  if (typeof data.title !== 'string' || [...data.title].length < 1 || [...data.title].length > 80) errors.push('Title must contain 1–80 Unicode code points');
  if (typeof data.description !== 'string' || data.description.length < 1 || data.description.length > 12000) errors.push('Description must contain 1–12000 characters');
  if (!Number.isInteger(data.price) || data.price < 0 || data.price > 100000) errors.push('Unsupported price');
  if (!Number.isInteger(data.viewportWidth) || data.viewportWidth < 320 || data.viewportWidth > 1280 || !Number.isInteger(data.viewportHeight) || data.viewportHeight < 280 || data.viewportHeight > 900) errors.push('Unsupported viewport');
  if (!Array.isArray(data.rows) || data.rows.length < 1 || data.rows.length > 5) return [...errors, 'Expected 1–5 records'];
  const ids = new Set<string>();
  for (const row of data.rows) {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) errors.push('Record IDs must be unique nonempty strings');
    else ids.add(row.id);
    if (!row || typeof row.name !== 'string' || [...row.name].length < 1 || [...row.name].length > 80) errors.push('Unsupported record name');
    if (!row || typeof row.email !== 'string' || row.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid record email');
  }
  if (!ids.has(target)) errors.push('The target record must exist');
  if (data.rows[0]?.id !== target) errors.push('The first record must be the declared target');
  return errors;
}

function cases(seed: number): ScenarioCase<CompatInput>[] {
  const make = (name: string, changes: Partial<CompatInput>): ScenarioCase<CompatInput> => ({ name, origin: 'curated', input: { ...structuredClone(compatBaseline), ...changes } });
  const list = [
    make('Long product and record names', { title: longName, rows: [{ id: target, name: longName, email: 'alexandria.konstantinopoulou@design.example.com' }] }),
    make('Narrow mobile viewport', { viewportWidth: 320 }),
    make('Constrained height with long description', { viewportWidth: 390, viewportHeight: 320, description: 'Shipping details and product information. '.repeat(180) }),
    make('Unbroken valid content', { title: 'InternationalProductCollectionWithExtendedAvailabilityAndShippingOptions', rows: [{ id: target, name: 'InternationalCustomerAccountWithoutSpaces', email: `${'a'.repeat(64)}@example.com` }], viewportWidth: 360 }),
    make('Unicode content', { title: '国際配送と製品情報 — العربية — Україна', rows: [{ id: target, name: '王小明 — Александра', email: 'international@example.com' }], viewportWidth: 390 }),
    make('Five table records', { rows: Array.from({ length: 5 }, (_, index) => ({ id: index ? `record-${index}` : target, name: index ? 'Sam Miller' : longName, email: `customer-${index}@example.com` })) }),
  ];
  const generated = fc.sample(fc.record({ title: fc.constantFrom('Fresh broccoli', longName, '国際配送の製品情報'), description: fc.constantFrom('Review the details.', 'Shipping details and product information. '.repeat(180)), viewportWidth: fc.constantFrom(320, 390, 768, 1000), viewportHeight: fc.constantFrom(320, 600, 900), price: fc.integer({ min: 0, max: 100000 }) }), { seed, numRuns: 8 });
  return [...list, ...generated.map((changes, index) => ({ name: `Seeded combination ${index + 1}`, origin: 'generated' as const, input: { ...structuredClone(compatBaseline), ...changes } }))];
}

function candidates(input: CompatInput) {
  const mutate = (label: string, change: (value: CompatInput) => void) => { const next = structuredClone(input); change(next); return { label, input: next }; };
  return [
    mutate('Remove unrelated records', value => { value.rows = value.rows.filter(row => row.id === target); }),
    mutate('Short product title', value => { value.title = 'Tea'; }),
    mutate('Short description', value => { value.description = 'Details.'; }),
    mutate('Short record name', value => { value.rows.find(row => row.id === target)!.name = 'Jo'; }),
    mutate('Short valid email', value => { value.rows.find(row => row.id === target)!.email = 'a@b.co'; }),
    mutate('Simplify price', value => { value.price = 0; }),
  ];
}

function recipe(component: 'product' | 'dialog' | 'table'): BrowserRecipe {
  const rules = {
    product: { id: 'product-add-reachable', target: '.product-action button', boundary: '.product' },
    dialog: { id: 'dialog-close-reachable', target: '[data-dialog-close]', boundary: '[role="dialog"]' },
    table: { id: 'table-review-reachable', target: '[data-record="record-primary"] [data-row-action]', boundary: '[data-record="record-primary"]' },
  };
  const subjectProof = component === 'product' ? { selector: '.product-name', kind: 'text' as const, inputPath: '/title' } : component === 'dialog' ? { selector: '[data-dialog-title]', kind: 'text' as const, inputPath: '/title' } : { selector: '[data-record="record-primary"] [data-record-name]', kind: 'text' as const, inputPath: '/rows/0/name' };
  return {
    path: `/fixtures/compat-app/index.html?component=${component}`,
    viewport: { width: 1000, height: 900 }, viewportFromInput: { width: '/viewportWidth', height: '/viewportHeight' },
    fixtures: [{ url: '**/api/compat-fixture?*' }], ready: '[data-ready="true"]', screenshot: 'page', rule: rules[component],
    proofs: [{ selector: '[data-ready="true"]', kind: 'jsonAttribute', attribute: 'data-input' }, subjectProof],
    // Scrolling is explicitly allowed; off-screen content alone is not a defect.
    setup: component === 'dialog' ? [{ action: 'click', selector: '[data-open-dialog]' }, { action: 'scroll', selector: '[data-dialog-close]' }] : [{ action: 'scroll', selector: rules[component].target }],
  };
}

const common = { baseline: compatBaseline, validate: validateCompat, cases, candidates, sourceFiles: ['fixtures/compat-app/main.tsx', 'scenarios/compat.ts', 'package-lock.json'] };
export const productScenario = defineScenario({ ...common, id: 'product-card', name: 'Shopping app · product card', description: 'The original add-to-cart button must remain inside its card and receive pointer events. This does not check text overflow.', recipe: recipe('product'),
  sourceFiles: [...common.sourceFiles, 'fixtures/compat-app/product.scss', 'fixtures/compat-app/vendor/react-shopping-cart/provenance.json', 'fixtures/compat-app/vendor/react-shopping-cart/src/components/Product.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/contexts/cart.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/hooks/useLocalStorage.js', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/base/_variables.scss', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/base/_reset.scss', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/components/_product.scss'],
  provenance: { kind: 'existing-app-component', repository: 'https://github.com/sivadass/react-shopping-cart', commit: '0e867f1caf6abd7114aab6ae704a2824064e84e0', license: 'MIT', adaptation: 'Original component, cart context and styles mounted in a local API fixture harness. Local illustration replaces remote imagery.' },
});
export const dialogScenario = defineScenario({ ...common, id: 'dialog', name: 'Radix · dialog', description: 'After opening and explicitly scrolling, the close action must be contained and receive pointer events. Tests an actual portal with constrained height.', recipe: recipe('dialog'), provenance: { kind: 'library-component-harness', package: '@radix-ui/themes', version: '3.3.0', repository: 'https://github.com/radix-ui/themes', adaptation: 'Local title, description and close-button composition using the unmodified library and its stylesheet.' } });
export const tableScenario = defineScenario({ ...common, id: 'table-row', name: 'Radix · table row', description: 'After allowed scrolling, the target record’s review button must stay inside its row and receive pointer events.', recipe: recipe('table'), provenance: { kind: 'library-component-harness', package: '@radix-ui/themes', version: '3.3.0', repository: 'https://github.com/radix-ui/themes', adaptation: 'Local records and review action using the unmodified table library and its stylesheet.' } });

export const compatScenarios = [productScenario, dialogScenario, tableScenario];
