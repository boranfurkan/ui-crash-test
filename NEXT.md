# Optional work after review

The original backlog and renewed RC2 continuation are complete: comparison, local CLI/library, adapter diagnostics, actual Node 22/24 verification, documentation, draft launch material and source archive. See [REVIEW.md](REVIEW.md). No further overnight feature work is required.

The next evidence to collect, when the user chooses to continue:

1. Run the prepared [self-guided trial](TRIAL.md) on a developer-owned component. Record fresh setup time, adapter friction, whether a saved case is understood and whether it is retained. Leave the worksheet `not_started` until someone actually participates.
2. Measure original-versus-reduced debugging with people. The byte reductions and preserved failures are verified; a human time benefit is not.
3. Run the prepared CI on Linux/Node 22.12 and 24, then record actual results. Local macOS verification is not CI evidence.
4. Add rules/integrations only for observed needs. Full-hitbox visibility, text visibility and Storybook integration are possible later work, each requiring clear policies and controls.
5. Decide on naming, repository ownership and publication after reviewing the local candidate. Popularity and stars are outcomes to observe, not promised properties.

Deferred: automatic repairs, arbitrary-site crawling, all-browser support, an MCP server, schema inference and publication. The [comparison](COMPARISON.md) explains why this candidate focuses on reduction/replay rather than a general layout detector. The trial remains for later per the user's choice.
