# Ready for local review — 0.2.0-rc.2

RC2 improves first use: `doctor` diagnoses an adapter before a full campaign, static validation catches malformed inputs/setup, and inconclusive reports show only captured evidence. Both supported Node runtime lines now have local test and installed-package evidence. [Changes](CHANGELOG.md).

## Start here

- [README](README.md) and [SDK guide](SDK.md): install the local tarball, initialize an adapter, run `doctor`, then run a campaign against your app.
- [RC2 verification](examples/rc2/verification.json): 24 unit / 52 browser tests pass on **Node 22.12.0 and 24.21.0**, macOS / Chromium 156.0.8078.4. The Node 22 browser run used its own Node 22 fixture server.
- Installed-package results for [Node 22](examples/rc2/sdk-verification-node-22.12.0.json) and [Node 24](examples/rc2/sdk-verification-node-24.21.0.json): actual pass/fail campaigns, CLI/API diagnosis, external output paths and executed compiled replay. Both results record the exact tarball integrity.
- Actual doctor output: [ready](examples/rc2/doctor-ready-node-24.21.0.json), [blocked by a missing action](examples/rc2/doctor-blocked-node-24.21.0.json). These are snapshots from temporary local consumers, not production-user results.
- [Comparison](COMPARISON.md) and [visual report](examples/comparison/report.html): 44 cases / 132 observations. Native Playwright detects the same application defects; the candidate value is valid-input reduction and saved replay. The recorded RC1 comparison remains a historical snapshot; RC2 keeps its action measurement unchanged.

## Deliverables beside this folder

- `ui-crash-test-0.2.0-rc.2.tgz`: private SDK, **20,872 bytes / 29 files**. CLI/library, types, README and license; no demo or comparator. [Inventory/integrity](examples/rc2/sdk-package.json).
- `ui-crash-test-prototype.zip`: current source, lockfile, docs, CI, fixture provenance/licenses and curated evidence, including the pinned Vue distribution. Dependency/build/ordinary artifact directories are excluded.
- `ui-crash-test-SHA256SUMS.txt`: SDK and source ZIP checksums. RC1's separate tarball is retained as the previous candidate; use RC2 for current evaluation.

Keep the target app running. A replay ZIP contains saved data, the recipe and actual measurement/replay code; it still requires the app. `doctor` runs configured native form/setup interactions against that app, but does not measure stress cases or write campaign artifacts. A ready diagnosis is not a passing stress campaign.

## Remaining external evidence

The GitHub Actions workflow is prepared, not remotely run. Docker's daemon is unavailable locally, so Linux and Windows remain unverified. Existing upstream Sass/client-directive build warnings remain. The rule still checks one declared action center and can miss edge clipping/corner overlays.

The self-guided [human trial](TRIAL.md) remains prepared for later and its worksheet is `not_started`. No participant/adoption, faster-debugging or popularity claim has been established. Nothing was published/deployed, no one was contacted and no usage was purchased. [LAUNCH.md](LAUNCH.md) remains draft copy. The prior heartbeat stays deleted.
