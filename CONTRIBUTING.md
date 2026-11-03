# Contributing

Start with a reproducible configured UI requirement. State which text must fit or which action must remain reachable, including allowed scrolling, hover and intentional truncation. A clean result is useful too.

Use Node 22.12+ and install Chromium. Run `npm ci`, `npx playwright install chromium`, `npm run build`, `npm test` and `npm run test:browser`. `npm run verify:sdk` checks the packed CLI/library in an isolated consumer after `npm run pack:sdk`.

For a rule change, include a healthy control, a failing control and any unsupported/uncertain cases. Preserve the known limits rather than turning authored match counts into an accuracy claim. Changes to the action rule should keep all 32 existing controls; text-fit changes should preserve its explicit horizontal scope.

Use a pull request with the requirement, resulting behavior and relevant validation. Add genuine integration needs before broadening the engine. The prepared first-use protocol is in [the trial protocol](docs/validation/trial.md); leave unknown measurements blank and distinguish assistance from independent use.

Share synthetic data and the smallest useful config/report. Do not include application secrets or private app source. Keep pinned upstream fixture bytes and licenses intact unless a provenance update is intentional. No stars, users, defects or debugging-time improvements should be inferred from generated examples.
