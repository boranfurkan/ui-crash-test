# Holo Grails: unchanged user-owned app

The installed RC2 SDK checks the real profile editor from the Desktop Holo Grails repository at revision `5e9ce9630960fccd94153402f1d2d011fcfdfd4a`. This is a Next.js 16.4.2 / React 19.3.0 application, not a reconstructed component. The app runs from a separate local copy using its existing browser mock API and demo session. No API/Privy/wallet credentials or environment files were copied.

**The normal-data control and all 14 valid stress cases pass** the declared Save profile action rule. This is a clean result, not a new defect. [Campaign report (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [all measurements/source hashes (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [doctor result (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip).

## What was exercised

The adapter uses the existing controlled form: enter one display name, press Tab without submitting, fill handle/bio through declared setup steps, and scroll the real Save profile button into view. Rendered-input proofs compare the actual controlled name/handle attributes and textarea text before measuring. The rule requires containment in the form, a viewport-center hit and pointer reachability.

Inputs obey the app's actual limits: one trimmed 1–24 character name, a lowercase 3–15 character handle and optional bio up to 160 characters. Six curated and eight seeded cases cover long/multilingual names, long handles/bios, empty optional data and widths 320–1440 / heights 320–1024. Reduction candidates preserve the viewport; no reduction or failing bundle was generated because no action failure was found.

An independent script uses ordinary Playwright input-value assertions, bounding boxes, a native trial click and an actual save. Four fresh contexts (one normal phone and three long-content 320px phones) all save successfully, navigate to the expected profile and show the entered name/bio. It does not import UI Crash Test's measurement or replay. [Independent checks](../evidence/holo-action/independent-verification.json), [normal saved profile](../evidence/holo-action/saved-0.png), [long saved profile](../evidence/holo-action/saved-1.png). No backend requests or browser page errors were observed.

## Additional observed clipping

The independent post-save inspection finds the long profile name extending **23.14px beyond the profile header's clipping boundary at 320px**, reproduced in **3/3 fresh contexts**. The normal 390px profile is a clean control. The saved text's actual Range bounds extend to x=331.14 while the `overflow: hidden` header ends at x=308. [Original screenshot](../evidence/holo-action/saved-1.png), [raw geometry and repetitions](../evidence/holo-action/independent-verification.json).

An investigation-only `overflow-wrap: anywhere` override on the heading reduces the measured clipping to **0px** for the same input. [Candidate CSS (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip), [candidate screenshot (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip). Nothing was patched in the original app. Whether full name visibility is the desired policy should be decided in that application.

At the 0.2 milestone this observation came from separate text-bounds inspection after saving, **not the action rule**. Version 0.3 now also runs a distinct opt-in text-fit policy through the complete campaign; see [TEXT-FIT.md](../text-fit.md). The 14/14 Save-action result remains valid, but does not imply the rest of the screen is visually correct. The earlier independent inspection did not perform reduction or export; the separately retained 0.3 campaign does. `verify:holo` verifies saves and records these additional observations; successful command completion is not an all-layouts-pass score. This gives a concrete future use case for an explicit required-text-visibility rule.

## Source integrity and scope

All **726 compared application/config/public files match** the original repository, and its Desktop working tree remains clean. [Source verification](../evidence/holo-action/source-verification.json). Next's generated agent instructions/caches are separate from application behavior. The tool repository contains the adapter and evidence; it does not redistribute the private application's source or dependencies.

The SDK campaign fingerprints five declared app files and its actual compiled engine/config. This guards those declared files during the run, not every implementation dependency. The broader 726-file copy comparison is recorded separately. Default app mock data and the supplied synthetic profile values are not real customer data.

This was an assisted integration. Initial adapter values exceeded two field limits; `doctor` rejected them before Chromium measurement and they were corrected. Independent verification also needed a development-route budget and a visible named heading because view transitions retain earlier DOM. These are recorded adaptation details, not measured first-use times or an independent participant trial. No runner/measurement change was needed for this app.

## Repeat with access to the app

Run the app locally in its documented demo mode from a separate checkout, with real backend/wallet configuration absent:

```sh
NEXT_PUBLIC_API_URL= NEXT_PUBLIC_PRIVY_APP_ID= API_ORIGIN= NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname 127.0.0.1 --port 4180
```

Install the supplied SDK tarball and Playwright into a separate consumer, then copy [the adapter](../../scenarios/holo-grails-profile.ts) into that consumer. From the application directory, run the consumer's installed CLI so relative `sourceFiles` resolve against the real app:

```sh
node /absolute/path/consumer/node_modules/ui-crash-test/lib/cli.js doctor --config /absolute/path/consumer/ui-crash.config.ts --url http://127.0.0.1:4180
node /absolute/path/consumer/node_modules/ui-crash-test/lib/cli.js run --config /absolute/path/consumer/ui-crash.config.ts --url http://127.0.0.1:4180 --out-dir /absolute/path/evidence
```

From the UI Crash Test repository, the separate native action/save checks are:

```sh
npm run verify:holo -- --root /absolute/path/holo-grails-app --url http://127.0.0.1:4180
```

The private app is not installed by CI. CI checks the adapter's deterministic inputs and actual domain limits; the retained application campaign and native-save checks were executed locally. The self-guided human-trial worksheet stays `not_started`.
