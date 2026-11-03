# Configurable scenarios

This guide describes source-checkout adapters. For the installed CLI/library, `init`, `doctor` and package imports, use [SDK.md](sdk.md).

The configurable runner is independent of the member-list input shape. Its public entry point is `runScenario(config, options)` in `src/scenario/run.ts`; the CLI loads a trusted TypeScript config. The original `npm run crash` flow and its red/green reference dashboard remain available.

```sh
npm run scenarios                         # card, dialog, table, cart checkout and complete Vue app
npm run scenarios -- --scenario dialog
npm run scenarios -- --scenario member-list
npm run scenarios -- --scenario cart-preview
npm run scenarios -- --scenario todomvc-vue
npm run scenarios -- --config ./scenarios/my-app.ts --url http://localhost:3000 --seed 42
```

Built-in scenarios start and stop a temporary Vite server unless `--url` is supplied. Custom configs connect to an already running application, using `--url` or the config’s `appURL`. They do not start an arbitrary application command. Config files execute with the same access as the CLI and should be your own trusted code.

## An adapter

Create a file under `scenarios/`. The selectors and endpoint below are examples: replace them with the real application boundary. Input paths are JSON pointers; an omitted pointer means the whole input. Inputs must be JSON values.

```ts
import { defineScenario } from '../src/scenario/config.ts';

type Input = { title: string };
export default defineScenario<Input>({
  id: 'my-product',
  name: 'My application · product card',
  description: 'The add button must remain usable after allowed scrolling.',
  appURL: 'http://localhost:3000',
  baseline: { title: 'Tea' },
  validate(input) {
    const value = input as Input;
    return value && typeof value.title === 'string'
      && [...value.title].length >= 1 && [...value.title].length <= 80
      ? [] : ['Expected a title with 1–80 Unicode code points'];
  },
  cases: seed => [
    { name: 'Long title', origin: 'curated',
      input: { title: 'International product collection with extended shipping options' } },
  ],
  candidates: input => [
    { label: 'Short title', input: { title: 'Tea' } },
  ],
  recipe: {
    path: '/products/fixture',
    viewport: { width: 390, height: 600 },
    fixtures: [{ url: '**/api/product' }],
    ready: '[data-ready="true"]',
    proofs: [{ selector: '[data-product-title]', kind: 'text', inputPath: '/title' }],
    setup: [{ action: 'scroll', selector: '[data-add-to-cart]' }],
    screenshot: 'page',
    rule: {
      id: 'product-add-reachable',
      target: '[data-add-to-cart]',
      boundary: '[data-product-card]',
    },
  },
  // Relative paths resolve from the UI Crash Test package root. Absolute paths work too.
  sourceFiles: ['scenarios/my-app.ts', '/absolute/path/to/app/Product.tsx'],
  provenance: { kind: 'application-adapter', application: 'My application' },
});
```

No runner changes are needed to add this config. The CLI automatically includes the loaded config file in the source fingerprint. Add the subject’s component, relevant styles and dependency lockfile to `sourceFiles`; this is an explicit record, not automatic dependency tracing.

## Browser recipe

| Field | Meaning |
| --- | --- |
| `path` | Same-origin application path, including any fixed query parameters. |
| `query` | Additional query keys mapped to input JSON pointers, for example `{ width: '/containerWidth' }`. |
| `viewport` | Fixed browser viewport. |
| `viewportFromInput` | Optional width/height overrides from JSON pointers. |
| `fixtures` | Playwright route patterns and optional pointers selecting each JSON response. Every declared route must be consumed. |
| `form` | Alternative input boundary: `input` locator, `itemsPath` pointing to a list of strings, and `submitKey`. Each value is filled and submitted through the original UI. Declare at least one API fixture or a form boundary. |
| `resources` | Optional asset URL, content type and base64 bytes for deterministic resource replay. The cart uses original mirrored icons; these bytes are included in its exported recipe. |
| `setup` | Ordered `click`, `fill`, `wait`, `scroll` or `hover` steps. Fill can use a literal value or `inputPath`. These are application interactions that you declare explicitly. |
| `ready` | Visible locator declaring the app is ready to inspect. |
| `proofs` | Exact rendered `text`, `attribute` or parsed `jsonAttribute` comparisons against input values. Those locators must resolve once. `texts` compares the full ordered list of matching text contents with an input array. These prove the supplied data reached the UI. |
| `screenshot` | A locator, `page` for a full-page capture, or `viewport` to preserve the measured viewport. Measurement happens before screenshot capture. |
| `rule` | One stable rule ID, one target selector and one containing boundary selector. |

The target must be rendered, enabled, geometrically inside the boundary and receive a pointer hit at its center. A missing, ambiguous, hidden or disabled target is **inconclusive**. The rule does not click the target. Setup steps can click the controls needed to reach the test state.

An off-screen center is inconclusive by default. Set `rule.requireViewportCenter: true` only when viewport reachability is a declared requirement after setup and permitted scrolling, as in the fixed cart checkout. This produces an `outside-viewport` failure. See [CONTROLS.md](controls.md) for the tested policies and known center-point limits.

Scrolling is a declared part of a scenario. The external card, dialog and table allow scrolling to their action before measuring. Content outside the initial viewport is therefore not automatically a failure. The reference member-list scenario intentionally measures its row’s initial containment. The rule checks neither all visible pixels nor text overflow, keyboard navigation, semantics or accessibility compliance.

## What a run retains

The control must pass before discovery proceeds. Every input is validated before launching discovery. Each evaluation gets a fresh Chromium context with a consistent locale, color scheme and motion preference; service workers are blocked so fixture routing stays observable. Font readiness is bounded, and the runner waits two animation frames before measuring.

A discovered failure is replayed three times in fresh contexts. Only an identical rule/target/boundary/failure-kind signature is accepted. Reduction calls the scenario’s domain-specific candidates, checks validity and strictly smaller serialized size, and accepts only that same confirmed failure. It stops after the declared candidates are exhausted or 30 evaluations. It does not claim a global minimum.

The JSON and HTML report include all cases, findings, inputs, source hashes, package/application provenance and screenshots. A no-failure report contains no failing-case export. A control failure, consumption mismatch or input-proof mismatch remains inconclusive. No external application repairs are attempted.

For a confirmed failure, the bundle includes the exact saved input, JSON browser recipe, replay source, measurement source and Playwright test. The runner actually executes that exported test and checks the attached finding and failure signature. External runs require no artificial “fixed” variant. The reference dashboard additionally retains its original red-to-green experiment.

The bundle needs the same application routes and selectors. It does not contain the app. Set `UI_CRASH_BASE_URL` when replaying against a different server; CLI-created temporary server URLs do not persist after a run. Replay uses the saved input directly, not the generator or seed.

## External component provenance

| Scenario | Imported implementation | Local integration |
| --- | --- | --- |
| Product card | `sivadass/react-shopping-cart`, commit `0e867f1caf6abd7114aab6ae704a2824064e84e0`: unchanged Product.jsx, cart context, storage hook and relevant original SCSS, MIT license retained. | Local API fixture, React mount and local illustration. The full upstream application is not running. |
| Dialog | `@radix-ui/themes` 3.3.0 and its actual CSS, dependency graph pinned in package-lock.json. | Local dialog composition with title, description and close button. Uses the real portal and scroll behavior. |
| Table row | `@radix-ui/themes` 3.3.0 and its actual CSS. | Local records and review button composed with the library’s table components. Horizontal scrolling is allowed. |
| Cart checkout | Same pinned shopping-app commit: unchanged header, cart preview, providers, storage hook and original cart/header SCSS. | Local API data populates the actual cart provider. Original icons are replayed from recorded bytes. The fixed popup has an explicit checkout viewport requirement. |
| TodoMVC Vue | Complete official maintained Vue example at commit `ff43b02e59dfa604386bb382034b2cd07c2bcd8a` (3 May 2026), including its original distribution, runtime, CSS and metadata. | No application source/style edits or wrappers. Data enters through the real form; ordered label proofs and explicit hover use the existing markup. It is a framework showcase, not a production product. |

The two Radix scenarios are library integrations, not two independent production applications. The shopping components’ upstream Git blob hashes are recorded in `fixtures/compat-app/vendor/react-shopping-cart/upstream-blobs.json`; a test verifies the vendored bytes against those hashes. The [cart case study](case-studies/cart.md) establishes a failure in pinned source mounted locally, not in the current deployed site.

Adapter work included identifying relevant source/styles, satisfying original context imports, defining valid data, declaring scroll policy, and proving that fixtures reached rendered content. Setup time was not measured independently, so this exercise cannot yet support a “minutes to integrate” claim. A future adoption trial should time that work and the first useful result separately.

The [maintained-app integration](case-studies/maintained-vue.md) records assisted-session timestamps and tool gaps separately. The [self-guided protocol](validation/trial.md) and blank worksheet are available for later independent use.
