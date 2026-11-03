import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { defineScenario, type ScenarioCase } from '../src/scenario/config.ts';

export type CartInput = { products: { id: string; name: string; price: number; quantity: number; image: string }[]; viewportWidth: number; viewportHeight: number };
const image = '/fixtures/compat-app/product.svg';
export const cartBaseline: CartInput = { products: [{ id: 'cart-primary', name: 'Broccoli — family pack', price: 120, quantity: 2, image }, { id: 'cart-secondary', name: 'Fresh carrots', price: 80, quantity: 1, image }, { id: 'cart-third', name: 'Green beans', price: 90, quantity: 1, image }], viewportWidth: 1000, viewportHeight: 900 };
export function validateCart(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Expected a cart object'];
  const value = input as CartInput, errors: string[] = [];
  if (!Number.isInteger(value.viewportWidth) || value.viewportWidth < 320 || value.viewportWidth > 1280 || !Number.isInteger(value.viewportHeight) || value.viewportHeight < 280 || value.viewportHeight > 900) errors.push('Unsupported viewport');
  if (!Array.isArray(value.products) || !value.products.length || value.products.length > 5) return [...errors, 'Expected 1–5 cart products'];
  const ids = new Set(), names = new Set();
  for (const product of value.products) {
    if (!product || typeof product.id !== 'string' || !product.id || ids.has(product.id)) errors.push('Product IDs must be unique');
    else ids.add(product.id);
    if (!product || typeof product.name !== 'string' || [...product.name].length < 1 || [...product.name].length > 80 || names.has(product.name)) errors.push('Product names must be unique and contain 1–80 characters');
    else names.add(product.name);
    if (!product || !Number.isInteger(product.price) || product.price < 1 || product.price > 100000 || !Number.isInteger(product.quantity) || product.quantity < 1 || product.quantity > 9 || product.image !== image) errors.push('Invalid product data');
  }
  if (value.products[0]?.id !== 'cart-primary') errors.push('The first product must retain the primary identity');
  return errors;
}

const assets: { file: string; url: string; sha256: string }[] = JSON.parse(readFileSync(new URL('../fixtures/compat-app/assets/manifest.json', import.meta.url), 'utf8'));
const resources = assets.map(asset => ({ url: asset.url, contentType: 'image/png', base64: readFileSync(new URL(`../fixtures/compat-app/assets/${asset.file}`, import.meta.url)).toString('base64') }));
const cases = (seed: number): ScenarioCase<CartInput>[] => {
  const make = (name: string, changes: Partial<CartInput>): ScenarioCase<CartInput> => ({ name, origin: 'curated', input: { ...structuredClone(cartBaseline), ...changes } });
  return [
    make('Landscape phone viewport', { viewportWidth: 640, viewportHeight: 320 }),
    make('Tall mobile viewport', { viewportWidth: 390, viewportHeight: 844 }),
    make('Narrow phone viewport', { viewportWidth: 320, viewportHeight: 600 }),
    make('Short desktop window', { viewportWidth: 1000, viewportHeight: 280 }),
    make('Long valid product name', { products: [{ ...cartBaseline.products[0], name: 'International broccoli family collection with refrigerated express shipping' }] }),
    make('Five cart products', { products: Array.from({ length: 5 }, (_, index) => ({ id: index ? `cart-${index}` : 'cart-primary', name: `Fresh produce collection ${index + 1}`, price: 120, quantity: 1, image })) }),
    ...fc.sample(fc.record({ viewportWidth: fc.constantFrom(320, 390, 640, 1000), viewportHeight: fc.constantFrom(280, 320, 390, 600, 900) }), { seed, numRuns: 8 }).map((changes, index) => ({ ...make(`Seeded viewport ${index + 1}`, changes), origin: 'generated' as const })),
  ];
};
export default defineScenario({
  id: 'cart-preview', name: 'Shopping app · cart checkout',
  description: 'Checkout in the fixed cart popup must remain inside the popup and have its center in the viewport after permitted scrolling. Tests a pinned upstream component, not the deployed site.',
  baseline: cartBaseline, validate: validateCart, cases,
  candidates: input => [
    { label: 'Remove unrelated products', input: { ...structuredClone(input), products: [structuredClone(input.products[0])] } },
    { label: 'Short product name', input: { ...structuredClone(input), products: input.products.map((product, index) => index ? { ...product } : { ...product, name: 'Tea' }) } },
    { label: 'Simplify price', input: { ...structuredClone(input), products: input.products.map((product, index) => index ? { ...product } : { ...product, price: 1 }) } },
    { label: 'Simplify quantity', input: { ...structuredClone(input), products: input.products.map((product, index) => index ? { ...product } : { ...product, quantity: 1 }) } },
  ],
  recipe: {
    path: '/fixtures/compat-app/cart.html', viewport: { width: 1000, height: 900 }, viewportFromInput: { width: '/viewportWidth', height: '/viewportHeight' },
    fixtures: [{ url: '**/api/cart-fixture' }], resources,
    setup: [{ action: 'wait', selector: '[data-ready="true"]' }, { action: 'click', selector: '.cart-icon' }, { action: 'wait', selector: '.cart-preview.active' }, { action: 'scroll', selector: '.cart-preview.active .action-block button' }],
    ready: '[data-ready="true"]', proofs: [{ selector: '[data-ready="true"]', kind: 'jsonAttribute', attribute: 'data-input' }, { selector: '.cart-item:first-child .product-name', kind: 'text', inputPath: '/products/0/name' }],
    screenshot: 'viewport', rule: { id: 'cart-checkout-reachable', target: '.cart-preview.active .action-block button', boundary: '.cart-preview.active', requireViewportCenter: true },
  },
  sourceFiles: ['scenarios/cart-preview.ts', 'fixtures/compat-app/cart.tsx', 'fixtures/compat-app/cart.scss', 'fixtures/compat-app/vendor/react-shopping-cart/src/components/Header.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/components/CartPreview.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/contexts/cart.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/contexts/common.jsx', 'fixtures/compat-app/vendor/react-shopping-cart/src/hooks/useLocalStorage.js', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/base/_variables.scss', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/base/_reset.scss', 'fixtures/compat-app/vendor/react-shopping-cart/src/assets/scss/components/_header.scss', 'fixtures/compat-app/assets/manifest.json', ...assets.map(asset => `fixtures/compat-app/assets/${asset.file}`), 'package-lock.json'],
  provenance: { kind: 'existing-app-component', repository: 'https://github.com/sivadass/react-shopping-cart', commit: '0e867f1caf6abd7114aab6ae704a2824064e84e0', revisionDate: '2021-06-16', license: 'MIT', adaptation: 'Unchanged header, cart preview, providers and styles mounted locally. API data initializes the original cart provider. Original remote icons are mirrored byte-for-byte in the browser recipe. This is not the complete deployed application; fonts use local fallback.', requirement: 'A shopper must be able to reach checkout in the open fixed cart popup after scrolling.', assetHashes: assets.map(asset => ({ url: asset.url, sha256: asset.sha256 })) },
});
