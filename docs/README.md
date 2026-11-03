# Documentation

Start with one UI requirement: an action must stay reachable, or required text must fit. Declare valid inputs, run the normal control, then stress and reduce.

## Start here

| I want to… | Read |
| --- | --- |
| Install the CLI, adapt a real app and run a campaign | [CLI and SDK guide](sdk.md) |
| Add a horizontal text check | [Text-fit rule](text-fit.md) |
| Understand action reachability and uncertain results | [Action controls and limits](controls.md) |
| Work with the source dashboard and supplied subjects | [Source adapter guide](scenarios.md) |
| Find an example config | [Supplied scenarios](../scenarios) |
| Change the project | [Contributing](../CONTRIBUTING.md) · [Repository layout](architecture.md) |

## Evidence

| Example | What it establishes |
| --- | --- |
| [Profile-name clipping](text-fit.md#validation) | Confirmed text failure, valid-input reduction and independently installed replay. |
| [Historical shopping cart](case-studies/cart.md) | A pinned 2021 source defect and an independently checked CSS candidate. |
| [Unchanged Vue app](case-studies/maintained-vue.md) | A complete upstream app exercised through its native form. All supplied cases pass. |
| [Holo Grails](case-studies/holo-grails.md) | Assisted integration against an unchanged real app and native profile-save verification. |
| [Matched comparison](research/comparison.md) | Authored cases measured with ordinary Playwright, UI Crash Test and renderlint. |
| [Verification](validation/verification.md) | Test/package checks, recorded versions and historical checkpoints. |

[Retained evidence policy](evidence/README.md) explains snapshots and release archives. The [self-guided human trial](validation/trial.md) is prepared for later; independent participant results remain unrecorded.

## Reference

[CLI and library API](sdk.md) · [Rule limits](controls.md) · [Release notes](../CHANGELOG.md) · [Next validation](roadmap.md) · [Issue tracker](https://github.com/boranfurkan/ui-crash-test/issues)
