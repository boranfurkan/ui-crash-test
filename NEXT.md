# Remaining release gates

Implemented and verified: SDK/CLI and doctor, real saved replay, matched comparison, local Node 22/24 checks, actual Ubuntu Node 22/24 CI, unchanged Holo Grails integration, independent native profile saves, recorded demo and curated release evidence.

1. **Organization PR review.** [PR #1](https://github.com/QuechyDev/ui-crash-test/pull/1) contains the integration and release preparation. QuechyDev's No Direct Push rules require one approving review plus its security workflow. These requirements must be satisfied normally.
2. **Public release decision.** Inspect the prepared release, select public visibility and publish when ready. The GitHub repository remains private and the npm package remains unpublished/private; the draft is for review.
3. **Independent first use, later as requested.** Run [TRIAL.md](TRIAL.md) when a developer is available. Keep unknown measurements blank and leave the worksheet `not_started` until someone actually participates. The Holo integration was assisted.
4. **Measure human reduction value.** Preserved failures and smaller fixtures are established; faster debugging is not. The separately confirmed Holo profile-name clipping is a concrete next case for an explicit required-text-visibility rule; the current action rule does not detect it. Windows and other browser coverage remain unverified.

The previous heartbeat stays deleted. No outreach or usage purchase is planned. Popularity/stars remain outcomes to observe after public release, not a promised result.
