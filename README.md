# UI Crash Test

**Find the input that breaks your layout. Keep the test that catches it.**

![UI Crash Test: valid inputs, smaller failures, saved Playwright tests](docs/assets/banner.png)

[![npm prerelease](https://img.shields.io/npm/v/ui-crash-test/next?label=npm%20next&color=52733f)](https://www.npmjs.com/package/ui-crash-test) [![Node.js 22.12+](https://img.shields.io/badge/Node.js-%E2%89%A522.12-52733f)](https://nodejs.org/) [![Playwright](https://img.shields.io/badge/Playwright-Chromium-52733f)](https://playwright.dev/) [![MIT license](https://img.shields.io/badge/license-MIT-52733f)](LICENSE)

Stress your UI with valid data, confirm a layout failure, and shrink it into a reproducible Playwright test. Bring your local app and declare what must stay reachable or which text must fit.

[Quickstart](#quickstart) · [Documentation](docs/README.md) · [Watch the demo](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-demo.webm) · [Examples](scenarios) · [npm](https://www.npmjs.com/package/ui-crash-test)

## Why use it?

- **Stress real UI.** Supply valid data through an API response or native form, then prove it rendered.
- **Keep a smaller failure.** Confirm it in three fresh contexts and reduce the input within your declared contract.
- **Leave with a test.** Get screenshots, an HTML report and a replay ZIP whose exported regression actually ran.

A saved-profile example reduced a valid name-clipping case from **262 → 83 bytes**. A wrapping candidate then passed the same saved check. [See the case study](docs/text-fit.md).

## Quickstart

Requires **Node.js 22.12+**. This is an early release; install the `next` tag.

```sh
npm install --save-dev ui-crash-test@next @playwright/test@1.64.1
npx playwright install chromium
npx ui-crash-test init
```

Edit `ui-crash.config.ts` with your app's data, selectors and source files. Keep your app running, then:

```sh
npx ui-crash-test doctor --url http://localhost:3000
npx ui-crash-test run --url http://localhost:3000
```

`doctor` checks the adapter and normal input before you run a campaign. Open the report path printed by `run`. [Complete configuration example →](docs/sdk.md#native-form-adapter)

## Choose a rule

| Requirement | Rule |
| --- | --- |
| A button stays inside its region and receives a pointer hit at its center. | `action` |
| Required text fits horizontally inside its region and supported overflow clips. | `text-fit` |

Already using Playwright? Measure a rule directly in a test:

```ts
import { test, expect } from '@playwright/test';
import { measureRule } from 'ui-crash-test';

test('the full profile name fits', async ({ page }) => {
  await page.goto('/profile'); // Use your configured app and selectors.
  await page.evaluate(() => document.fonts.ready);
  const finding = await measureRule(page, {
    kind: 'text-fit', id: 'profile-name',
    target: 'header h1', boundary: 'header',
  });
  expect(finding.status, finding.reason).toBe('pass');
});
```

Direct measurement checks the current page. The CLI adds data injection, rendered-input proofs, confirmation, reduction and replay. [Rule details and limits →](docs/text-fit.md)

## Explore the visual demo

```sh
gh repo clone boranfurkan/ui-crash-test
cd ui-crash-test
npm ci
npx playwright install chromium
npm run dev
```

Open **http://127.0.0.1:4173**. The dashboard includes a deliberately broken/fixed reference and pinned shopping, Radix and unchanged Vue examples. [Preview the recorded campaign →](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-demo.webm)

## Scope

Chromium only. Rules check declared geometry and action reachability; they do not establish accessibility or overall usability. Unsupported states are inconclusive. Reduction is bounded, and only declared app sources are guarded against drift. Configs are trusted executable code. [All limits](docs/controls.md) · [Validation and comparison](docs/README.md#evidence)

[Documentation](docs/README.md) · [Report a bug](https://github.com/boranfurkan/ui-crash-test/issues/new/choose) · [Contribute](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [MIT](LICENSE)
