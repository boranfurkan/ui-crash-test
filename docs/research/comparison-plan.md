# Matched-state comparison plan

Written before running the comparison on 3 November 2026. This is an authored fixture exercise, not a blinded accuracy benchmark or human debugging study.

## Methods

1. **UI Crash Test:** the existing declared action rule, unchanged for this experiment.
2. **Ordinary Playwright:** independent bounding-box containment assertions and native visibility, enabled-state and trial-click checks. Do not import the UI Crash Test rule. Record native checks and their automatic scrolling separately; their semantics differ from one center-point hit.
3. **renderlint:** its supported `renderlint(page, name, options)` in-place integration, at one identical starting viewport and light scheme, without data mutation, stress or width sweeps. Use its layout checks, retain raw findings, and record post-check state changes. It is a broad layout auditor rather than an implementation of our declared action contract. Do not turn its overall issue count into a binary action-failure score.

Each method starts in its own fresh browser context with identical input, viewport, locale and declared setup. Neither native trial-click scrolling nor renderlint scrolling/focus changes can affect another method. Record preparation time separately from measurement time. Timing is descriptive because workloads differ; it does not establish that the narrow rule is a faster equivalent auditor.

## Fixed case selection

- Include all 32 existing synthetic controls, including uncertain states and both known center-point scope limits. Their expected labels belong to our authored rule controls, not a universal oracle for the other tools.
- Include the normal/broken/fixed member-list reference, original and investigation-only CSS-fixed cart cases, the complete Vue app, constrained Radix dialog and long-content Radix table. Include original/reduced pairs for both known failing subjects so the usefulness of removed data is inspectable.
- Keep these groups separate. Report any infrastructure failure as inconclusive, never clean. Retain the actual input/HTML, source hashes, browser/package versions and commands.

## Interpretation

Report agreement on the declared supported action condition without claiming independent accuracy. Explain differences in opacity, disabled/inert states, off-screen/scroll policy and full-visibility versus center-hit semantics. Keep renderlint findings visible for review even if they do not concern the selected action. A general layout warning can be useful while our action passes; that is not automatically noise.

For reduction, retain the original/reduced fixture byte counts and what fields were removed. Do not infer faster human debugging from byte reduction or runtime. Ordinary Playwright detecting the same cases is expected and must be reported.

## Comparator provenance and setup

- Repository: https://github.com/ngocanhnckh/renderlint
- Pinned revision: `d54018ce58a2b2faeb42e98a092bca9ec577eae3`
- Package metadata version: 0.2.0.
- `npm install @ngocanhnckh/renderlint@0.2.0` returned registry 404. The comparison uses the exact public GitHub tarball as a development-only dependency; it is not represented as a published npm release.
- The selected integration, analyzer orchestrator and configuration were read before measurement. Its default stress, sweep and multiple-viewport behavior are intentionally disabled for matched starting states. Scope is explicitly narrower than its default audit.

No results have been collected at the time this plan was written. The runner must save raw observations and mark incomplete runs rather than populate a report from expectations.
