# Draft launch material — release preview

## Repository description

Find smaller valid inputs that break UI actions. Save the failing case as an executed Playwright regression. TypeScript CLI, library and visual reports.

## Draft release copy

UI Crash Test is a local TypeScript tool for a question ordinary layout screenshots can hide: which valid input makes this action unreachable?

Declare the real input boundary, rendered-value proofs and permitted setup. The tool checks a normal control, runs supplied valid cases in Chromium, confirms a failure three times, reduces only through valid smaller candidates and executes its exported Playwright regression. The report keeps the original/reduced input, screenshots, source hashes and replay bundle.

The public demo source includes an intentional member-list defect, pinned shopping-app components, actual Radix components and a complete unchanged Vue TodoMVC app. In the retained cart example, the input shrinks from 401 to 156 bytes while checkout remains below the landscape viewport. The maintained Vue example passes all supplied cases.

Ordinary Playwright detects the same demonstrated application defects. We are exploring whether the reduction/evidence/replay workflow makes keeping those regressions easier. The comparison corpus and raw results are included. This release candidate is Chromium-only and requires an explicit adapter; independent first-use and debugging-time results remain open.

## 60–90 second demo outline

1. Show the member reference with ordinary data and a passing normal control.
2. Run a real campaign. Point to the valid input, action overflow and three confirmations.
3. Compare original/reduced fixtures; retain the necessary pending-invitation condition.
4. Open the actual saved test and its measured attachment. Show original failing and fixed passing.
5. Show the pinned external cart and the healthy unchanged Vue result. Explain their provenance.
6. Show `init`, `doctor`, a real adapter and the isolated package check. Link comparison, controls and limits.

Use real output only. Label the intentional reference defect, historical cart and investigation-only CSS candidate visibly. Do not turn duplicate failing states into unique bug counts. Do not imply automatic repair, universal scanning, npm availability, stars, independent users, faster debugging or detector superiority.

## Review before any future publication

Choose a repository name and owner, inspect licenses/source provenance, review the README and trial feedback, and decide whether to publish. No repository URL is invented here. No outreach, public release, deployment or registry publication has been performed. The self-guided trial stays prepared for later.

## Recorded demonstration

A continuous native Chromium recording is saved as [ui-crash-test-demo.webm](examples/demo/ui-crash-test-demo.webm), with the actual [run/verification metadata](examples/demo/recording.json). It shows a real reference campaign, reduced fixture, exported test and supplied fixed variant. Re-record locally with `npm run record:demo` while the demo server is running. Presentation pauses make the views readable; the recorded campaign and test outcomes are real.

The private organization repository is [QuechyDev/ui-crash-test](https://github.com/QuechyDev/ui-crash-test). The validation change is in [PR #1](https://github.com/QuechyDev/ui-crash-test/pull/1), subject to the organization’s required review. Public launch and npm publication have not occurred.
