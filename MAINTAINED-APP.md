# Maintained-app integration: complete TodoMVC Vue

The complete upstream TodoMVC Vue application now runs unchanged through the configurable runner. Its normal control and **14/14 supplied stress cases pass** the declared delete-action rule. No defect was found under that rule.

This is a maintained framework showcase, not a production application. The upstream [maintenance statement](https://github.com/tastejs/todomvc/blob/ff43b02e59dfa604386bb382034b2cd07c2bcd8a/readme.md) explicitly lists the modern Vue example; its [framework refresh](https://github.com/tastejs/todomvc/commit/1f2bd7f0a1fa8c602284451d282c3821d0d96aec) was committed on 3 May 2026. The subject is pinned to `ff43b02e59dfa604386bb382034b2cd07c2bcd8a`, inspected on 3 November 2026.

## What actually ran

The [original prebuilt application](https://github.com/tastejs/todomvc/tree/ff43b02e59dfa604386bb382034b2cd07c2bcd8a/examples/vue/dist) is served directly, including its HTML, JavaScript with Vue runtime, CSS, favicon, original helper script and learning metadata. No component wrapper or replacement stylesheet was introduced. Source files are retained for inspection alongside the upstream distribution and MIT license.

All **16 retained files** match their upstream Git blob hashes. Browser tests verify the **six served runtime/metadata files** also match upstream response bytes; the production build copies those same bytes without recompiling the subject. This distinguishes the integration from rebuilding an app-shaped fixture using our own React components.

The adapter types the supplied tasks into the original `.new-todo` input and presses Enter. It compares the complete rendered list with the supplied values, scrolls to and hovers the first row, and measures the original delete button. A separate browser test clicks that button and verifies the actual first task is removed. No API fixture or direct application-state injection is used.

The native form trims titles, so the declared input contract requires trimmed, single-line values with 1–160 Unicode code points. Cases include long realistic text, unbroken text, multilingual text, narrow and short viewports, and multiple rows. Hover is a declared desktop interaction; narrow viewport cases do not establish mobile touch usability.

```sh
npm run scenarios -- --scenario todomvc-vue
```

The dashboard also includes the app in **Run all 5 scenarios**. Its original page is available at `/subjects/todomvc/examples/vue/dist/index.html#/` while the tool’s server is running.

[Visual integration report](examples/maintained-trial/report.html) · [all cases](examples/maintained-trial/campaign.html) · [timing/friction record](examples/maintained-trial/session.json).

## Setup friction, recorded rather than hidden

The existing runner could not express this integration without changes:

1. **Data entered through a form.** The runner required an HTTP fixture. It now accepts a declarative form input boundary as an alternative.
2. **Delete appears on hover.** The app’s specification deliberately uses hover, which was missing from setup actions. Hover is now explicit and replayable.
3. **The UI exposes a list of labels.** Existing proofs required one scalar/attribute or a JSON marker added by a fixture harness. A `texts` proof now compares an exact ordered list without changing app markup.
4. **The original build must remain untouched.** A restricted subject server and raw build asset copies preserve the upstream response bytes instead of letting Vite rewrite the prebuilt app.
5. **The adapter had a type error.** The first runtime result preceded correction of readonly tuples in the seeded generator. Type checking and tests were rerun after copying those titles into mutable arrays.

The resulting recipe is small:

```ts
form: { input: '.new-todo', itemsPath: '/titles', submitKey: 'Enter' },
setup: [
  { action: 'scroll', selector: '.todo-list > li:first-child' },
  { action: 'hover', selector: '.todo-list > li:first-child' },
],
proofs: [{
  selector: '.todo-list > li .view > label',
  kind: 'texts',
  inputPath: '/titles',
}],
```

A form boundary supports a list of 1–100 strings entered into one field with a declared submit key. Arbitrary workflows and storage-only state adapters remain outside this feature. All existing API interception checks remain required when an API fixture is declared.

## Timing and limits

Observed UTC milestones are in session.json. About **5m56s** elapsed from confirming the target to its first runtime control, and **9m55s** to the first passing type/browser validation checks. The initial runtime report predates the adapter’s type-error correction.

These are assisted-session wall-clock observations, including source inspection and new tool feature work. The actor was the agent already familiar with the tool; dependencies and Chromium were already installed. The app used its checked-in prebuilt distribution, so it needed no dependency installation or rebuild. This is not an independent first-use setup-time benchmark or a speed claim.

The result establishes support for an unchanged complete Vue app and a native form boundary. It does not establish overall app correctness, production readiness, comparative debugging speed or independent adoption. A developer trial still needs to happen. Per the user’s preference, the [self-guided trial](TRIAL.md) and [blank worksheet](examples/maintained-trial/worksheet.json) are prepared for later; no participant outcomes have been filled in.
