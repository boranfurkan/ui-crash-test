# Release review — 0.2.0-rc.2

The source is now in the private organization repository [QuechyDev/ui-crash-test](https://github.com/QuechyDev/ui-crash-test), with [PR #1](https://github.com/QuechyDev/ui-crash-test/pull/1) for the latest integration/release preparation. The organization requires one approving review and a successful security workflow before merge; no protections have been bypassed.

## Verified results

- Real Ubuntu CI has passed on Node 22.12.0 and 24, including build, 25 unit tests, 52 Chromium tests, isolated package installation and execution of the saved regression. [CI result](https://github.com/QuechyDev/ui-crash-test/actions/runs/41622292369), [retained job details](examples/github/linux-ci.json). Security Guard passed too.
- The installed SDK exercises the unchanged Holo Grails profile editor: baseline plus 14 valid cases pass. Four independent native checks actually save the supplied profiles. All 726 compared app/config/public files match and the original Desktop tree is clean. [Integration](HOLO-GRAILS.md).
- [Recorded demo](examples/demo/ui-crash-test-demo.webm) shows the actual reference campaign, reduced input and exported original-failing/fixed-passing test. [Run metadata](examples/demo/recording.json).
- [Comparison](COMPARISON.md) retains 44 cases / 132 observations; ordinary Playwright detects the demonstrated defects too. The focus remains valid-input reduction and saved replay.

## Reviewable deliverables

- `ui-crash-test-0.2.0-rc.2.tgz`: private local SDK, 20,872 bytes / 29 files. The engine/package content is unchanged by the additional app integration and release scripts. [Inventory](examples/rc2/sdk-package.json).
- `ui-crash-test-prototype.zip`: current source, CI, docs, fixture provenance/licenses, comparison/app evidence and recorded demo. Excludes dependency/build/ordinary artifact directories and the private Holo Grails application source.
- `ui-crash-test-demo.webm`: separate continuous Chromium video.
- `ui-crash-test-SHA256SUMS.txt`: current deliverable hashes.

The README and SDK guide contain actual commands. Replay still requires the configured app. The five declared Holo app files are guarded during the campaign; the broader copy comparison is separate evidence. Passing the one center-point rule is not overall usability, accessibility or functional correctness.

The self-guided human trial remains prepared for later and its worksheet is `not_started`. Holo validation was assisted. No independent adoption/debugging-speed/popularity claim is established. Windows and other browsers remain unverified. The repository is private, npm publication/deployment/outreach have not occurred and no usage was purchased. The prior heartbeat remains deleted.
