# UI Crash Test — local release candidate

**Find a smaller valid input that breaks a declared UI action rule, and keep it as a Playwright regression.**

This Node/TypeScript library and CLI connects to an already running app through an explicitly configured API response or native form. The source repository also contains a dashboard and an evaluation corpus; demo apps and the comparator are not shipped inside this library package.

It is **not published to npm**. The package remains private. Install the supplied local tarball rather than assuming a public registry package with this name is this project.

## Install and run

Requires Node 22.12+ and Playwright 1.64.1. Local verification covers Node 22.12.0 and 24.21.0 on macOS/Chromium. CI configuration is not evidence that Linux or other platforms have passed.

```sh
# In your own local app, using the actual tarball path:
npm install --save-dev /path/to/ui-crash-test-0.2.0-rc.2.tgz @playwright/test@1.64.1
npx playwright install chromium
npx ui-crash-test init
```

`init` creates `ui-crash.config.ts` without overwriting an existing file. Replace its sample selectors, input contract and source paths with the real app. Keep that app running separately.

```sh
npx ui-crash-test doctor --url http://localhost:3000
npx ui-crash-test run --url http://localhost:3000
npx ui-crash-test run --config ./ui-crash.config.ts --seed 42 --out-dir ./artifacts --json
```

Exit codes: **0** = no failure found in the supplied cases; **1** = confirmed failure; **2** = inconclusive or setup error. JSON mode writes the report to stdout and still saves artifacts. Config files are trusted executable TypeScript/JavaScript.

## Check the adapter first

```sh
npx ui-crash-test doctor --config ./ui-crash.config.ts --url http://localhost:3000
npx ui-crash-test doctor --config ./ui-crash.config.ts --url http://localhost:3000 --json
```

`doctor` validates the recipe, baseline and generated discovery inputs, reads declared source files, launches Chromium and checks the real normal-data control through the configured input boundary and rendered-input proofs. It does not measure discovery inputs, execute reduction candidates, export regressions or write campaign artifacts. Form entry and any declared setup actions still run against your configured app.

It reports **ready** (exit 0) when the normal-data control passes, or **blocked** (exit 2) with the failed stage and actual reason. An already-failing normal control also blocks diagnosis; it is not a three-times-confirmed campaign failure. Empty `sourceFiles` produces a warning: the CLI fingerprints its config during `run`, but app drift requires actual component/style files. A ready diagnosis is a setup check, not a passing stress campaign.

Stages are `config`, `sources`, `url`, `browser` and `baseline`. Browser-launch errors include the Chromium installation command. Missing config files/import errors go to stderr with exit 2; `--json` returns a structured diagnosis after the config loads. Recipe validation catches unsupported setup actions, invalid JSON pointers and missing proof/attribute fields before browser launch.

Library callers can use `await checkScenario(config, { root, appURL, seed: 42 })`. It returns the structured checks and actual baseline finding. Run `runScenario` separately when ready.

## Native-form adapter

This example targets the unchanged Vue subject when the source repository's `npm run dev` server is running at port 4173. For your own app, use its actual path and selectors.

```ts
import { defineScenario } from 'ui-crash-test';
type Input = { titles: string[] };
export default defineScenario<Input>({
  id: 'vue-tasks', name: 'Vue task deletion',
  description: 'After scrolling and hover, delete stays inside the first row.',
  appURL: 'http://127.0.0.1:4173',
  baseline: { titles: ['Review pull request'] },
  validate(input) {
    const value = input as Input;
    return value && Array.isArray(value.titles) && value.titles.length > 0 && value.titles.length <= 5
      && value.titles.every(title => typeof title === 'string' && title.trim() === title && title.length > 0 && title.length <= 160)
      ? [] : ['Expected 1–5 trimmed titles of 1–160 characters'];
  },
  cases: () => [{ name: 'Long task', origin: 'curated', input: {
    titles: ['Review the international customer onboarding experience before the next release'],
  } }],
  candidates: input => [{ label: 'Shorter task', input: { titles: ['Review', ...input.titles.slice(1)] } }],
  recipe: {
    path: '/subjects/todomvc/examples/vue/dist/index.html#/',
    viewport: { width: 390, height: 600 },
    form: { input: '.new-todo', itemsPath: '/titles', submitKey: 'Enter' },
    setup: [{ action: 'scroll', selector: '.todo-list > li:first-child' },
            { action: 'hover', selector: '.todo-list > li:first-child' }],
    ready: '.todo-list > li:first-child',
    proofs: [{ selector: '.todo-list .view > label', kind: 'texts', inputPath: '/titles' }],
    screenshot: 'viewport',
    rule: { id: 'delete-reachable', target: '.todo-list > li:first-child .destroy', boundary: '.todo-list > li:first-child' },
  },
  sourceFiles: [],
  provenance: { kind: 'local-adapter', appRevision: 'record-your-revision' },
});
```

Add the subject's component/style files to `sourceFiles`, relative to the app root or as absolute paths. The CLI also fingerprints its config. Only declared app files are guarded against source drift; an empty array does not fingerprint the app implementation.

## API-response boundary

For an existing JSON API, replace the form boundary with:

```ts
fixtures: [{ url: '**/api/product', inputPath: '/product' }],
```

An omitted pointer serves the whole input. Every declared API route must be consumed. Rendered-input proofs must match: `text` expects one element/string, `texts` an exact ordered array, and `attribute`/`jsonAttribute` compare existing markers. At least one API fixture or form boundary is required.

## Library use

```ts
import { runScenario } from 'ui-crash-test';
import scenario from './ui-crash.config.js';
const report = await runScenario(scenario, {
  root: process.cwd(), appURL: 'http://localhost:3000',
  outputDir: './artifacts', seed: 42, onProgress: console.log,
});
```

Exports include `defineScenario`, `checkScenario`, `runScenario`, `measureAction` and their types. `measureAction(page, rule)` accepts an existing Playwright page and performs measurement alone.

`root` defaults to the current directory. Relative `sourceFiles` and `outputDir` paths resolve against that root. An absolute output directory is also supported, including outside the application's dependency tree. Library callers should include their config file in `sourceFiles`; the CLI adds its config automatically.

## Evidence and replay

The normal-data control must pass. Valid discovery inputs are measured in fresh contexts. A failure is confirmed three times, then reduced only with valid, strictly smaller serialized inputs preserving the same rule/target/boundary/failure-kind signature. Reduction is bounded, not a guaranteed global minimum.

Runs retain HTML/JSON reports, screenshots, values, browser/runtime information and source hashes. No-failure runs do not export a failing bundle. For a confirmed failure the tool executes the exported test and checks its measured attachment, not just the exit code. Installed-library runs copy their actual JavaScript replay/measurement files; source-checkout runs may copy TypeScript.

Extract a failing ZIP into a separate directory, follow its install instructions, keep the same app available and set `UI_CRASH_BASE_URL` if needed. `npm test` should fail for the saved defect and pass after repair. The app is not in the ZIP. No automatic app repairs or publication occur.

## Limits

Passing means a rendered, enabled action fits its declared region within 1px and receives a pointer hit at its center. Missing/ambiguous selectors, hidden/disabled states and unresolved setup are inconclusive. Off-screen centers are inconclusive unless `requireViewportCenter: true` explicitly requires viewport reachability after setup and permitted scrolling.

Scrolling and hover must be declared. Center-only checks can miss clipped edges and corner-only overlays. This is not an accessibility audit, arbitrary-site crawler, all-browser test or proof of overall usability. Ordinary Playwright assertions detect the demonstrated application defects too; the candidate value is the valid-data/reduction/replay workflow, not superior raw detection. Independent adoption and human debugging-speed results remain unestablished.
