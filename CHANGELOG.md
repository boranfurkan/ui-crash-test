# Changelog

## 0.2.0-rc.2 — 3 November 2026

- Add `ui-crash-test doctor` and the library `checkScenario` API: validate config/inputs, read declared sources, launch Chromium and prove the normal-data control before a campaign. No stress measurement, reduction, export or artifact writes. Ready exits 0; blocked exits 2, including a failing normal control.
- Report missing app-source coverage explicitly. Diagnose malformed setup/proofs/JSON pointers and unsupported discovery viewports before browser launch.
- Show only screenshots actually captured in an inconclusive report; omit unexecuted stress evidence.
- Verify 24 unit and 52 Chromium tests, installed CLI/API and compiled replay on Node 22.12.0 and 24.21.0 on macOS. Linux/remote CI remain unexecuted.

## 0.2.0-rc.1 — 3 November 2026

First local private SDK/CLI release candidate. Validated configured API/form inputs, action measurement, three fresh confirmations, bounded reduction, retained HTML/JSON evidence and executed regression exports. Includes a 44-case / 132-observation comparison against native Playwright and a pinned renderlint layout profile, plus curated controls and upstream fixtures.

Neither candidate has been published to npm. No independent adoption or human debugging-speed result is claimed.
