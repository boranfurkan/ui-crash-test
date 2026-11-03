# Comparison: what the tool adds

Ordinary Playwright checks detect the same demonstrated application defects. The release candidate therefore focuses on **valid input → confirmed failure → smaller valid case → executed replay**, rather than claiming a better general layout detector.

On 3 November 2026, `npm run compare` measured 44 authored cases in 132 separate method runs. The [pre-measurement plan](COMPARISON-PLAN.md), [visual report](examples/comparison/report.html), [full table](examples/comparison/report.md), [case catalog](examples/comparison/case-catalog.json), [raw observations](examples/comparison/observations.json) and [summary](examples/comparison/summary.json) are retained.

## Same starting state, different policies

Each method gets a fresh Chromium context with identical supplied data, viewport, locale and declared setup. Our existing action measurement was unchanged. The independent [native checks](src/comparison/native.ts) use visibility/enabled preconditions, bounding-box containment with 1px tolerance and a 600ms Playwright trial click. They do not call our measurement implementation. Trial clicks may scroll after setup; the before/after snapshots retain that difference.

renderlint uses its documented in-place Playwright integration at commit `d54018ce58a2b2faeb42e98a092bca9ec577eae3`, metadata version 0.2.0. The npm registry install returned 404, so the development-only dependency uses that exact public GitHub tarball. The profile selects 12 layout rules, one viewport/light scheme, and disables stress, sweeps and data mutation. Raw analyzer errors/meta are captured through a pass-through wrapper. This is narrower than renderlint's default audit.

## Results

| Corpus | UI Crash Test | Independent Playwright | renderlint layout profile |
| --- | --- | --- | --- |
| 12 application states | 8 passed, 4 failed | 8 passed, 4 failed | Findings in 5 states |
| 32 synthetic controls | 12 passed, 6 failed, 14 inconclusive | 15 passed, 6 failed, 11 inconclusive | Findings in 3 states |

There were no browser page errors or unresolved analyzer runs. The four failing application states are original/reduced pairs for **two defects**, not four independently discovered bugs. The member-list defect is intentional; the cart is pinned historical external source. The fixed member and investigation-only cart CSS candidate pass both action methods. Vue, Radix dialog and Radix table supplied states also pass both.

All four control disagreements have concrete policy explanations:

| Control | Our rule | Native checks | Difference |
| --- | --- | --- | --- |
| Ancestor clips center | Failed | Passed | The trial click scrolls the clipped container to reveal the button. |
| Inert region | Inconclusive | Failed | Our measurement treats inert as an unavailable action; native enabled preconditions allow the trial, which times out. |
| Fully transparent ancestor | Inconclusive | Passed | Native Playwright visibility/actionability permits opacity-zero content; our precondition excludes it. |
| Unscrolled off-screen action | Inconclusive | Passed | Native trial clicking scrolls automatically; our rule measures after declared setup. |

The explicit viewport-required control fails both methods. Both methods pass the two known edge-clipping/corner-overlay limits. The 32 authored expected labels describe our rule and include those limits; they are not independent truth labels or an accuracy benchmark.

renderlint's member findings concern clipped badge text and overflowing action content. Its cart findings concern background heading/paragraphs covered by the popup, including the CSS candidate whose checkout action is reachable. These are broader audit findings to review, not automatically false positives. Zero layout findings does not imply that the declared action passed. All raw selectors/messages remain in the report and comparator JSONL files.

## Reduction: demonstrated and unmeasured

| Subject | Original → reduced UTF-8 JSON | What was removed | Retained evidence |
| --- | --- | --- | --- |
| Member reference | 457 → 170 bytes | Extra members and optional identity data; a shorter valid name remains. | Pending invitation is necessary for this failure; action still overflows its row. |
| Pinned cart | 401 → 156 bytes | Extra products and longer product data. | One valid product at 640×320 still leaves checkout below the viewport. |

Both original/reduced pairs fail independent native checks. The runner validates candidates, retains the same failure signature, confirms in three fresh contexts and executes its saved test. These are inspectable workflow properties. They do not establish faster human debugging, first-use setup ease or adoption.

## Reproduce and limits

```sh
npm ci
npx playwright install chromium
npm run compare
```

The command starts/closes its own temporary server and writes a new `artifacts/run-comparison-…/` report. The retained run is `run-comparison-1793681086316-67921a`, Node 24.21.0 / macOS / Chromium 156.0.8078.4. Source fingerprint: `04fd8022c9fed20dd8140555d7c35e30cf091f91efe727d7ac1966bd03995ccd`; per-file inputs and versions are in report.json.

This corpus is selected, authored and non-blinded. Fixtures and cases overlap the tool's development. Preparation/measurement durations are retained, but phases differ and analyzer injection precedes renderlint timing: no equivalent-scope speed ranking follows. No independent reviewer labeled audit noise or useful findings. Linux/other browser comparison and human debugging value remain unmeasured.
