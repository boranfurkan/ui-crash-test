# Verification

## Current local candidate: 0.3.0-rc.1

After reorganizing the repository, the SDK/frontend build, typechecking, all **26 unit tests** and **74 Chromium tests** pass on local Node 24.21.0. The 32 authored action controls also match their expected outcomes, including the documented limits. The freshly packed 33-file SDK passes isolated installation, CLI/library diagnostics, action/text replay execution and copied-rule checks. The dashboard campaign confirms and reduces a failure, executes its exported original-failing/fixed-passing test and has no page errors or overflow at 320/390/768/1440px. Guides and curated HTML report links resolve after relocation. The same engine and layout passed Linux Node 22.12.0 and Node 24 jobs in [PR #2 CI](https://github.com/boranfurkan/ui-crash-test/actions/runs/41654166244) and again on [merged main](https://github.com/boranfurkan/ui-crash-test/actions/runs/41655806571), commit `eb4683919a783c02c0f4b54f942bdd60bc396935`. The required organization security checks passed before transfer. The repository is now owned by `boranfurkan`; the organization-only private workflow caller was removed for public publication. Earlier checkpoints below retain their original counts and ownership context.

The full historical evidence is retained in the release evidence ZIP. Current generated runs stay in ignored `artifacts/`. The self-guided human trial remains not started.

## GitHub Linux CI and Holo Grails — 3 November 2026

The repository is private under [QuechyDev/ui-crash-test](https://github.com/QuechyDev/ui-crash-test), as the user instructed after identifying personal-account billing problems. [Linux CI run 41622292369](https://github.com/QuechyDev/ui-crash-test/actions/runs/41622292369) passed both Node 22.12.0 and Node 24 jobs: clean install, build/typechecking, **25 unit tests / 52 browser tests**, package creation and independent installed SDK/CLI/replay verification. The organization’s Security Guard also passed. [Retained job/step record (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip). This establishes actual Linux execution; earlier sections describe what was still unverified at their own checkpoints.

The unchanged user-owned Holo Grails app also passes its normal control and all **14 valid profile cases** through the independently installed RC2 SDK. Four separate native Playwright contexts verify containment, trial click, actual save/navigation and rendered saved values. The original working tree remains clean, and 726 compared application/config/public files are byte-identical. [Integration report](../case-studies/holo-grails.md), [campaign (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [native saves](../evidence/holo-action/independent-verification.json), [copy integrity](../evidence/holo-action/source-verification.json).

Separate post-save text inspection also reproduces 23.14px of profile-name clipping at 320px in 3/3 contexts; an investigation-only wrapping override removes it. This is outside the action rule, and is documented separately in HOLO-GRAILS.md. The original app is unchanged.

A [continuous Chromium demo](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-demo.webm) records a real member-reference campaign and exported failing-original → passing-fixed test. [Recording metadata (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip) retains its run ID, result and zero page errors. It visibly uses the deliberate reference defect and included fixed variant; no automatic repair is implied.

The app integration remains assisted, with no independent participant or debugging-speed measurement. The private application is not included in the tool repository/CI. Human trial remains `not_started`. Organization rules require a PR and one approval; these protections have not been bypassed. No public deployment, npm publication, outreach or purchased usage occurred.


## Local release candidate 0.2.0-rc.2 — 3 November 2026

**24 unit tests and 52 Chromium tests pass on both Node 22.12.0 and 24.21.0 on macOS.** The minimum-runtime browser driver launched a separate Node 22 Vite server at another loopback port. Typechecking passes under both; the SDK/frontend build passes on Node 24 and the frontend build also passes on Node 22. [Machine-readable matrix (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [Node 22 test log (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [Node 24 test log (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).

The same private RC2 tarball was installed into separate temporary consumers under each runtime. Checks verify `doctor` success, missing source/target failures, failing-normal-control exit 2, explicit source-coverage warning, no diagnosis artifact writes, human/JSON output and the library `checkScenario` export. Existing checks still verify init preservation, CLI 0/1/2 campaign exits, explicit app root/external output path, reduction and execution of the compiled saved regression. Both results retain the tarball integrity: [Node 22 (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [Node 24 (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).

New negative controls verify ignored form submissions cannot produce a ready diagnosis, malformed config/pointers/setup/proofs fail early, and unsupported discovery viewports are rejected before Chromium/artifact creation. A missing normal-data action stops discovery and exports no failing regression; its HTML includes only the actual captured baseline screenshot. Reports with no images use explanatory text rather than broken image links.

Fresh RC2 dashboard checks also pass: reference original 1 failing regression → fixed 1 passing regression; all five external campaigns check 70 inputs (63 pass / 7 fail / 0 inconclusive), with no page errors and duplicate-run 409 responses. The dashboard has no overflow at 320/390/768/1440px. [Scenario UI result (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [reference UI result (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [current UI check (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip). The seven failures remain the same pinned historical cart defect.

The action-measurement rule remains unchanged; the retained comparison below describes its measured RC1 snapshot. No independent trial, adoption, human speed, Linux or remote CI claim is added. Docker's local daemon is not running. [REVIEW.md](../evidence/README.md) links current deliverables; earlier sections retain historical counts, fingerprints and RC1 evidence.


## Local release candidate 0.2.0-rc.1 — 3 November 2026

- **18 unit tests / 49 Chromium browser tests passed**, SDK compilation, TypeScript checking and frontend build passed on Node 24.21.0 / macOS / Chromium 156.0.8078.4. Upstream Sass deprecation/client-directive warnings remain.
- The [matched comparison](../research/comparison.md) measured **44 cases × 3 methods = 132 observations**. Our rule and independent native Playwright agree on **12/12 app states** (8 passing, 4 failing states representing two defects). Four control disagreements are explained; renderlint broad findings are retained separately. Zero browser page errors/unresolved analyzer runs. No accuracy or equivalent-scope speed claim.
- The private local tarball contains **27 files**, the CLI/library, types, license and SDK README. Runtime dependencies are fflate 0.8.3 and tsx 4.23.15; the Playwright peer is pinned to 1.64.1. It excludes demo apps, comparison tooling, source corpus and development dependencies. [Package inventory/integrity (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).
- [Isolated installation verification (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip) passes: npm bin installed, version/help, init without overwrite, trusted TS config in a consumer without a package type field, CLI exits **0/1/2**, library import/run, relative output against explicit application root, absolute output outside the consumer tree, and real confirmed/reduced failure. The installed compiled rule matches the replay bytes; the exported test executes and attaches the saved failure. A temporary dependency-resolution link used for external-output verification is removed afterward and excluded from the bundle.
- Fresh local dashboard checks pass: reference **9 pass / 5 fail**, three confirmations, exported original **1 fail** → fixed **1 pass**; five external campaigns **63 pass / 7 fail / 0 inconclusive** across 70 cases; baseline controls pass and duplicate campaigns return **409**. The cart's exported test still executes; no-failure scenarios create no failing ZIP. [Reference UI (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [scenario UI (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).
- The new comparison link loads its real 44-row report and raw evidence. Dashboard and comparison have no page errors and no page overflow at **320/390/768/1440px**. [Link/layout check (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [dashboard image (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [comparison image (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).
- The refreshed source ZIP passes CRC and byte-for-byte comparison against every included file. It retains the pinned Vue distribution and CI while excluding dependency/generated directories. Parent `ui-crash-test-SHA256SUMS.txt` covers the SDK and source archive. Root documentation links resolve locally.
- GitHub Actions is prepared for Ubuntu/Node 22.12 and 24 with pinned official actions, build/unit/browser checks and isolated package verification. **No remote CI run has occurred.** Windows/other browser behavior is unverified.

[REVIEW.md](../evidence/README.md) lists the local deliverables and replay boundaries. The self-guided trial is prepared for later and its worksheet remains `not_started`. Independent participants: **0**. Nothing was published or deployed; no outreach or purchased usage occurred. Earlier checkpoints below retain their own historical counts and source fingerprints.


## Maintained complete Vue app and later-use trial packet — 3 November 2026

- **15 unit tests and 49 browser tests passed** on Node v24.21.0 / Chromium 156.0.8078.4 on macOS. Existing rule controls, source-drift rejection and the cart finding remain covered.
- The complete official TodoMVC Vue distribution at commit `ff43b02e59dfa604386bb382034b2cd07c2bcd8a`, refreshed in May 2026, runs unchanged through its real form. Its baseline and **14/14 valid stress cases pass** the declared hovered-delete action rule. No defect was found under that rule, and no failing bundle was generated.
- **All 16 retained upstream files match their Git blob hashes.** Browser tests compare all **six served runtime/metadata files** with those hashes. The production build also contains those six files with identical bytes. No app source/style edits or component wrappers were added.
- A real browser test verifies Vue is running, supplies tasks through the native input, confirms the ordered rendered labels, clicks the original delete action and verifies the first task is actually removed. No API fixture is used. Ignored submission and malformed form input are explicitly rejected.
- TypeScript checking and the frontend build passed. The build still retains the previously documented upstream Sass/client-directive warnings.
- The five-scenario dashboard completed **70 valid cases: 63 passed, 7 failed, 0 inconclusive**, with all normal controls passing. The seven failing cases remain the same pinned shopping-cart viewport defect; the Vue integration is a clean result. Duplicate campaigns returned **409**. The exported cart test still executed and reproduced its saved finding with the updated shared replay source.
- Final dashboard/report checks saw **no browser page errors**, loaded both maintained-app evidence images, verified the blank worksheet is `not_started`, and passed overflow checks at **320, 390, 768 and 1440px**.
- The maintained-app report fingerprint is `341dd78afa247b142f9d38024ba95caf80f1aa97d20a304d626d345a46bbd6c0`. [Visual report](../evidence/maintained-vue/report.html), [all cases](../evidence/maintained-vue/campaign.html) and [timing/friction JSON](../evidence/maintained-vue/session.json) are included.

The app is an official maintained framework showcase, not a production product. Setup required tool changes for native form entry, hover and ordered-list proofs; the first runtime result also preceded an adapter type-error correction. Recorded assisted timings are not independent first-use measurements. Per user preference, [TRIAL.md](trial.md) and its blank worksheet are prepared for later. **Independent participants: 0.** No adoption or debugging-speed claim follows from this exercise.

Repeat with `npm run scenarios -- --scenario todomvc-vue`, `npm test`, `npm run test:browser`, `npm run build`, and, with the local server running, `npm run verify:scenarios-ui`.

## Rule controls and external-source finding — 3 November 2026

Node v24.21.0 and Chromium 156.0.8078.4 on macOS.

- **13 unit tests and 45 browser tests passed.** The browser suite includes all **32 control scenes**, the reference/demo checks, real cart actionability, offline asset replay and explicit source-drift rejection.
- **32/32 expected control outcomes matched:** 10 healthy, 6 deliberately broken, 14 uncertain/adapter states and 2 documented scope limits. All 10 healthy scenes also pass a Playwright trial click. The two scope limits intentionally pass despite edge clipping or a corner-only overlay; this count is not a precision/recall claim.
- Control report fingerprint: `cbf00daa9f928ed7d17398215ca4fcdc8945a81823932e1e66de0a8dba81b4cd`. [Visual report (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [measurements](../evidence/controls/report.json) and exact scenes are included.
- All four external scenarios completed through the dashboard: **56 valid discovery cases**, **49 passed**, **7 failed**, **0 inconclusive**, and all normal controls passed. The card, dialog and table remain at 14/14 passing; the cart has 7 passing and 7 failing viewport cases.
- The **unmodified pinned shopping-app cart** reproduces checkout below a 640×320 viewport. It confirms in **3/3 fresh contexts**, reduces **401 → 156 bytes** in **3 probes**, and its exported test executes with the same `outside-viewport` signature. Cart source fingerprint: `872c2a6e131c303c54c55bb611616a1c2fbfa0073f54f3e70d5d0c137d7c8957`.
- An independent Playwright viewport assertion and trial click corroborate the failure. A candidate CSS change, injected only in verification pages, passes the baseline, all 14 discovery cases and the reduced saved case: **16/16**. The original button center is y=417 below the 320px viewport; the candidate places the button at y=235–271.
- The replay ZIP was extracted outside the tool package and installed independently. The locally installed Playwright 1.64.1 executed exactly one test, with **1 expected regression failure**, no retries and an attached finding matching the saved signature. The copied measurement bytes match the runner. This still requires the configured fixture application.
- The original dashboard campaign continues to verify **1 failing original test → 1 passing fixed test**, with no retries. Latest reference source fingerprint: `fd2eddd6065670fc`.
- New dashboard and reference flows reported **no browser page errors**, rejected duplicate campaigns with **409**, loaded all evidence images, and passed overflow checks at **320, 390, 768 and 1440px**. No-failure scenarios exported no failing bundle.
- TypeScript checking and the frontend build passed. npm installation/audit reported **0 vulnerabilities**. The build retains upstream Sass deprecation and client-directive warnings.

[Read the case study](../case-studies/cart.md) and [visual original/candidate evidence](../evidence/cart/report.html). The [independent investigation JSON](../evidence/cart/investigation.json), [detached replay verification](../evidence/cart/detached-verification.json) and [generic campaign report (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip) retain exact measurements and provenance.

The source revision is from 2021, mounted in a local compatibility harness with local fallback fonts. This is not a finding against the current deployed site. It does not establish superiority over handwritten Playwright assertions; those assertions detect the same failure. Independent adoption, timed setup, comparative debugging value and cross-platform behavior remain unvalidated.

## Earlier configurable-scenario milestone

Node v24.21.0 and Chromium 156.0.8078.4 on macOS. The dashboard’s external-scenario controls ran all three configs and retained separate reports. All normal-data controls passed.

| Scenario | Valid stress cases | Passed | Failed | Inconclusive | Recorded duration |
| --- | ---: | ---: | ---: | ---: | ---: |
| Shopping app product card | 14 | 14 | 0 | 0 | 4.043s |
| Radix dialog | 14 | 14 | 0 | 0 | 4.629s |
| Radix table row | 14 | 14 | 0 | 0 | 3.392s |

These are checks of one action rule per component under the declared scrolling policy, not a benchmark or proof of overall correctness. The card imports unchanged source/styles from a pinned external application; the dialog and table are actual library components composed in a local fixture app. No upstream bug was established.

- **11 unit tests passed**, including deterministic valid scenarios, invalid fixture contracts, reducer budget/failure identity, JSON-pointer handling and byte verification against the shopping app’s pinned upstream Git blobs.
- **10 browser tests passed**, including the reference defect/fix, pointer occlusion, intentional truncation, missing target, a real portal dialog at constrained height, horizontal table scrolling, unused fixture interception, incorrect rendered-input proofs and API validation.
- TypeScript checking and the frontend production build passed. The build retains upstream Sass deprecation and client-directive warnings; the functional local API still requires the development server.
- The configurable runner reproduced the known member-list defect: **9 passed, 5 failed, 0 inconclusive**, **3/3** fresh confirmations, **11 reduction probes**, **457 → 170 bytes**. Its generated Playwright test executed and reproduced the same saved failure signature. No artificial fixed variant was required by this runner.
- Loading that adapter through `--config scenarios/member-list.ts --url http://127.0.0.1:4173` also completed successfully against the already running app, including reduction and execution of the exported test.
- The original dashboard flow also still verified **1 failing original test → 1 passing fixed test**, using the shared renderer. Latest reference source fingerprint: `3fb77671ce739af6`.
- Dashboard runs completed through the new controls, produced three fresh report IDs, rejected a concurrent duplicate with **409**, and produced **no browser page errors**. Responsive overflow checks passed at **320, 390, 768 and 1440px**. All saved report images loaded, and no no-failure run exported a failing bundle.
- npm audit reported **0 vulnerabilities** after the compatible fflate 0.8.3 patch.

An initial card experiment measured its off-screen button before scrolling and generated a misleading failure. Declaring permitted scrolling removed that result. The final runs above use this corrected policy. This is why viewport visibility and intentional scroll behavior need separate controls.

Saved examples: [product card (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [dialog (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [table row (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), and [generic reference defect (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip). The exact inputs, per-file hashes and provenance are in each sibling report.json. The [dashboard UI verification (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip) records the external run IDs and fingerprints.

Repeat with `npm test`, `npm run test:browser`, `npm run build`, `npm run scenarios`, and `npm run scenarios -- --scenario member-list`. With the app running at port 4173, `npm run verify:scenarios-ui` checks the full external-scenario UI and `npm run verify:ui` checks the reference red-to-green flow.

At that earlier milestone, first-time adapter setup, adoption, unseeded defects, matched comparisons, cross-platform behavior and detached replay installation were still unvalidated. Later sections above record the comparison and detached-replay work actually completed.

## Historical first-prototype run

Verified on 3 November 2026, using Node v24.21.0 and Chromium 156.0.8078.4 on macOS.

Source fingerprint: **b6b7be092de51456** (the component, its CSS and the shared measurement source).
Verified run: **run-20261103t001120267z-66e850**. Recorded duration: **6.498 seconds** in this environment; not a general performance promise.

### Results

- 6 core tests passed: seeded generation, validation, reduction validity, preserving failure identity, budget enforcement and HTML escaping.
- 5 browser tests passed: the baseline, real stress failure, fixed variant, intentional truncation, pointer occlusion, missing target, mobile preview controls and invalid campaign options.
- TypeScript checking and the Vite frontend build passed.
- The dashboard Run button completed a real campaign with 14 valid cases: 9 passed, 5 exposed the same deliberately introduced defect, 0 inconclusive.
- The original failure reproduced in 3/3 fresh browser contexts.
- Reduction used 12 probes and reduced serialized input from 457 to 170 UTF-8 bytes. It retained the pending status because the reduced active-state variant passed.
- The exported test ran without retries: original layout 1 failed; fixed layout 1 passed. The attached measurements matched the saved failure signature and passing result respectively.
- The browser downloaded the replay ZIP. Its bytes matched the generated artifact, archive integrity passed, and its rule source matched the runner verbatim.
- Dashboard page overflow checks passed at 320, 390, 768 and 1440 pixels. The UI verification saw no browser page errors.
- A separate 640px-container campaign checked all 14 cases with 0 failures and produced no failing-case bundle.

### Inspect or repeat

[Open the standalone verified report (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).
[Inspect the saved run JSON (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).
[Download its replay bundle (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).

Run npm test, npm run test:browser, npm run build, and npm run crash. With the dashboard server already running at port 4173, npm run verify:ui checks the browser Run flow, duplicate-run rejection, case/test views, downloads, responsive page widths and standalone report images.

These historical results establish the original demonstration. The configurable-scenario results above extend its integration coverage; comparative performance and adoption remain unvalidated.
