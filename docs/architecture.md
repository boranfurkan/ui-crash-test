# Repository layout

The source checkout contains the reusable engine, a local visual demo and the fixtures used to verify both. The published SDK is a separate, smaller package built from `src/index.ts` and `src/cli.ts`; it excludes the dashboard, research tooling and vendored applications.

| Directory | Purpose |
| --- | --- |
| `src/core/` | Reusable action/text measurements, rule dispatch and exported-test execution. |
| `src/scenario/` | Adapter contracts, preflight diagnostics, campaigns, valid-input reduction and replay/export. |
| `src/cli.ts`, `src/index.ts` | Published CLI and library entry points. |
| `src/demo/` | Deliberately broken member-list reference, its generator/reducer and demo-specific reports. |
| `src/app/`, `src/server/` | React dashboard, local campaign API and restricted upstream-subject server. |
| `scenarios/` | Concrete source-checkout adapters for the supplied applications. |
| `fixtures/` | Authored controls, deterministic comparison inputs and pinned upstream applications with licenses/provenance. |
| `tests/` | Unit and Chromium integration tests. |
| `scripts/` | Development commands, comparison tooling, packaging and independent verification. |
| `docs/` | Guides, case studies, research, validation and a curated evidence set. |
| `.github/` | CI and issue templates. |

Keep generated campaign output in `artifacts/`, compiled SDK output in `lib/`, frontend builds in `dist/` and Playwright output in `test-results/`. Those directories and `node_modules/` are ignored. Do not commit ordinary run output.

Pinned fixture files are intentionally retained: browser tests check their upstream hashes and licenses, and the untouched Vue distribution must be served byte for byte. They are test subjects, not generated build output from this project.

[Evidence policy](evidence/README.md) explains the small checked-in reports and full release archive. [Contributing](../CONTRIBUTING.md) lists the verification commands.
