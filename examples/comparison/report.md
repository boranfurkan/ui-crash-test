# Matched-state comparison

44 authored cases, 132 observations, Chromium 156.0.8078.4.

Our action rule and independent Playwright checks agree on 12/12 comparable application states (4 failing states). This does not establish superior raw detection. The candidate value is validated data, bounded reduction and retained replay.

The authored controls include 4 method disagreements and two expected center-point limits. Native trial clicks can reveal content by scrolling, whereas our rule measures the state after declared setup. Native Playwright also treats opacity/inert states differently. These are policy differences, not an accuracy ranking.

Renderlint's selected broad layout profile returned findings in 8 states and 0 inconclusive runs. Its findings are not a binary action-contract score: the cart's covered background text is reported even after checkout is reachable. Read the raw selectors/messages.

| Case | UI Crash Test | Native Playwright | renderlint layout profile |
| --- | --- | --- | --- |
| Ordinary contained action | passed | passed | 0 layout findings |
| Intentional text ellipsis | passed | passed | 0 layout findings |
| Intentional decoration over button | passed | passed | 0 layout findings |
| Icon child receives the hit | passed | passed | 0 layout findings |
| Translated containing component | passed | passed | 0 layout findings |
| Subpixel edge tolerance | passed | passed | 0 layout findings |
| Allowed horizontal scrolling | passed | passed | 0 layout findings |
| Allowed nested vertical scrolling | passed | passed | 0 layout findings |
| Portal with the correct boundary | passed | passed | 0 layout findings |
| Descendant opts out of inherited ARIA disabled state | passed | passed | 0 layout findings |
| Action outside its declared region | failed | failed | 0 layout findings |
| Pointer-blocking overlay | failed | failed | 0 layout findings |
| Transparent intercepting overlay | failed | failed | 0 layout findings |
| Ancestor clips the action center | failed | passed | 1 layout findings |
| Pointer events disabled on the action | failed | failed | 0 layout findings |
| Native disabled action | inconclusive | inconclusive | 0 layout findings |
| Disabled through a fieldset | inconclusive | inconclusive | 0 layout findings |
| ARIA-disabled action | inconclusive | inconclusive | 0 layout findings |
| ARIA-disabled ancestor | inconclusive | inconclusive | 0 layout findings |
| Inert application region | inconclusive | failed | 0 layout findings |
| Hidden action | inconclusive | inconclusive | 0 layout findings |
| Fully transparent ancestor | inconclusive | passed | 0 layout findings |
| Collapsed action | inconclusive | inconclusive | 1 layout findings |
| Missing target | inconclusive | inconclusive | 0 layout findings |
| Ambiguous target | inconclusive | inconclusive | 1 layout findings |
| Ambiguous boundary | inconclusive | inconclusive | 0 layout findings |
| Portal with an app-shell boundary | inconclusive | inconclusive | 0 layout findings |
| Unscrolled off-screen action | inconclusive | passed | 0 layout findings |
| Explicit viewport requirement violated | failed | failed | 0 layout findings |
| Invalid CSS selector | inconclusive | inconclusive | 0 layout findings |
| Partial clipping away from center | passed | passed | 0 layout findings |
| Overlay covers only a corner | passed | passed | 0 layout findings |
| Member reference · normal control | passed | passed | 0 layout findings |
| Member reference · original valid failure | failed | failed | 1 layout findings |
| Member reference · reduced failure | failed | failed | 1 layout findings |
| Member reference · fixed same input | passed | passed | 0 layout findings |
| Pinned cart · normal control | passed | passed | 0 layout findings |
| Pinned cart · original landscape case | failed | failed | 3 layout findings |
| Pinned cart · reduced same failure | failed | failed | 3 layout findings |
| Pinned cart · investigation-only CSS candidate | passed | passed | 3 layout findings |
| Unchanged complete Vue app · normal tasks | passed | passed | 0 layout findings |
| Unchanged Vue app · long task at 320px | passed | passed | 0 layout findings |
| Radix dialog · long content at constrained height | passed | passed | 0 layout findings |
| Radix table · long valid email with scrolling | passed | passed | 0 layout findings |

## Reproduce and inspect

Run npm run compare. The report directory retains case-catalog.json, observations.json, report.json, this file and report.html. Each method starts in a fresh context with the same supplied data and setup. Renderlint stress, sweeps and data mutation are disabled; native trial click timeout is 600ms. Its analyzer is instrumented to retain returned errors/meta without changing those results.

Timing phases differ; analyzer injection precedes its measurement timing. Raw durations must not be presented as equivalent-scope performance scores. This authored exercise is not blinded, independently labeled or a human debugging/adoption study.

Source fingerprint: 04fd8022c9fed20dd8140555d7c35e30cf091f91efe727d7ac1966bd03995ccd. Comparator: renderlint 0.2.0, exact GitHub commit d54018ce58a2b2faeb42e98a092bca9ec577eae3; npm registry install returned 404.
