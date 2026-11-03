# Self-guided first-use trial

This trial is prepared for later use. No independent participant has completed it. The assisted TodoMVC integration is recorded separately in [MAINTAINED-APP.md](../case-studies/maintained-vue.md).

Use a local application and a component you own. A list row, card or dialog with one important action is a good fit for the current rule. Allow about 45 minutes; stop and record a blocker if the tool does not fit. You do not need to find a bug.

## Before reading an existing adapter

Record your start time in the [blank worksheet](worksheet.json). Note prior familiarity with the tool, application and Playwright, and whether a person or coding assistant helps. Record dependency/browser installation separately from adapting the component.

Choose one real action or one required text element and write a requirement in plain language: for example, “After the dialog opens and permitted scrolling, the confirm button remains inside the dialog and receives a pointer click.” State whether scrolling, hover and intentional text truncation are allowed. Use `kind: 'text-fit'` only for required horizontal text fit where truncation is forbidden; see TEXT-FIT.md. Enable `requireViewportCenter` only when that is an actual requirement.

Record the app revision and source/style files. Use synthetic but valid application data. Do not rebuild a lookalike component or change application CSS to create a failure. Adding stable selectors is an adaptation cost to record.

## Make one adapter

1. Install the local SDK tarball and Chromium in your app following [SDK.md](../sdk.md), then start your local app separately. Record the package version and installation time.
2. Run `npx ui-crash-test init`. Adapt `ui-crash.config.ts` and default-export a `defineScenario(...)` config imported from `ui-crash-test`. The source-checkout adapter guide is in [SCENARIOS.md](../scenarios.md) if you choose that distribution instead; record that choice.
3. Declare the real boundary: intercept an API response with `fixtures`, or enter a list of strings through an existing form with `form`.
4. Add an input validator, a normal baseline and at least three realistic cases: a longer value, a constrained viewport, and an application-specific state. Use supported states; do not silently pass invalid fixture values.
5. Declare setup, target, boundary, readiness and exact rendered-input proofs. Add domain-preserving reduction candidates if appropriate. Select the actual component/action, including a portal’s real container when needed.
6. Run:

```sh
npx ui-crash-test doctor --config ./ui-crash.config.ts --url http://localhost:3000
npx ui-crash-test run --config ./ui-crash.config.ts --url http://localhost:3000
```

Record the first passing control time from `doctor`, then the first complete campaign report time, plus every unclear instruction or selector/data problem. `doctor` checks the normal-data control and reports a blocking stage; it does not measure stress cases or create a campaign report. Record whether the diagnosis helped, and keep its output when useful. Keep the app port in sync with the command. The custom-config command connects to your running app; it does not start that app.

For a list entered by the user, a recipe can include:

```ts
form: { input: '.new-item', itemsPath: '/titles', submitKey: 'Enter' },
setup: [{ action: 'hover', selector: '.item:first-child' }],
proofs: [{ selector: '.item .label', kind: 'texts', inputPath: '/titles' }],
```

Use actual application selectors. A `texts` proof compares the complete ordered list with the supplied values; it does not only check that some rows exist. For an API example, see the SDK guide or the complete source-checkout example in SCENARIOS.md.

During this trial, do not change runner/core files. If the adapter needs a capability that does not exist, record **blocked: tool change required**, what is missing, and elapsed time. That is useful evidence about setup friction, not a failed participant.

## Interpret and retain the result

- **No failure found:** inspect the supplied inputs and action proof. Explain the narrow claim the report supports. Record whether this still felt useful. Do not manufacture a defect to finish the trial.
- **Inconclusive:** identify whether the problem is the locator, data, disabled state, resource readiness or scrolling policy. Record whether the report gave enough information to continue.
- **Confirmed failure:** compare original and reduced cases, identify what reduction removed, and independently check the same action with ordinary Playwright or manual browser interaction. A smaller fixture is not automatically faster to debug.

If a failing bundle is generated, extract it into a separate directory, run `npm install` and `npx playwright install chromium`, then set `UI_CRASH_BASE_URL` to the same local app and run `npm test`. An unfixed confirmed defect should fail the saved test. Record whether it was the same failure, not a missing server or locator. If you repair the app, run that same test again and retain it in the app’s normal test suite.

Record end time, help received, time interpreting the report and time retaining/replaying a useful test. Rate setup/report clarity only after writing what confused you. Leave unknown measurements blank.

## What success means

A useful trial can finish with a clean result, a real failure or an honest blocker. The questions are whether a developer can adapt the tool without changing its engine, understand its limited result and keep a test/evidence they would actually use.

One completed trial is not an adoption claim. Evaluate several independent first uses before making public setup-time or debugging-speed claims. Do not combine the current assisted integration’s elapsed time with human participant results.
