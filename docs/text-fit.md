# Explicit horizontal text fit

`kind: 'text-fit'` checks whether required text Range fragments fit horizontally inside a declared region and supported CSS overflow clips. It uses a 1px tolerance. The existing default action rule continues to check containment and center-point pointer reachability.

## Why it is explicit

The Holo Grails Save action works with long names, while the saved profile heading clips at 320px. The former action result was correct for that rule. Text fit supplies a separate contract for the heading where its full text is required.

```ts
rule: {
  kind: 'text-fit', id: 'required-profile-name-fits',
  target: 'main header h1', boundary: 'main header:has(h1)',
},
```

Choose a normal-data control, prove the rendered name matches the input, and declare form submission/navigation/scrolling before measurement. The [Holo name adapter](../scenarios/holo-grails-name.ts) uses the unchanged application's own form and demo save.

## Measurement scope

- Uses nonempty native text-node Range rectangles, with budgets of 256 text nodes and 2048 fragments. It does not estimate text width from character count.
- Allows ordinary multiline wrapping and axis-aligned translation/scaling. Horizontal clipping ancestors, including the text element itself, narrow the effective region to their client area.
- Missing/ambiguous selectors, hidden/empty text, unsupported clip paths/masks, legacy clips, rotations/skews/3D/mirroring, vertical writing and descendant-specific transforms/clips are inconclusive. Narrow the selector when appropriate.
- Intentionally ellipsized text passes the existing action rule when its action is reachable. It fails an explicit full-text contract. Do not apply text fit where truncation is intended.
- This is horizontal geometry. It does not prove vertical visibility, viewport presence, glyph-pixel paint, curved-corner clipping, occlusion, accessibility or overall readability. Font/layout settling is the caller's responsibility for direct measurement; the campaign runner already does it.

The rule checks one declared boundary and retains clipping geometry, source hashes and exact input. Its failure signature ends with `horizontal-text-overflow`; reduction must preserve that kind, target and boundary. It does not claim a global minimum.

## Validation

The authored browser controls include wrapping, contained elements with overflowing text, ellipsis policy, outer clips, nested visible spans, translation/scaling, missing/hidden/ambiguous targets, complex unsupported clips/transforms and a wrapping candidate. Counts describe an authored corpus, not accuracy on arbitrary pages. The installed-SDK check also executes an exported text regression against an intentionally ellipsized reference under an explicit full-name contract.

The [installed-SDK Holo campaign](evidence/text-fit/report.html) checks 14 valid states: 12 pass and two expose the same horizontal name-clipping defect. The normal control passes, the first failure confirms in 3/3 fresh contexts and the reducer finds a 262 → 83 byte case in six probes. The reduced surname remains clipped; making it one character shorter passes. That is the best found under the declared candidates, not a global minimum.

The [detached saved test](evidence/text-fit/detached-verification.json) was extracted and independently installed outside the tool/SDK consumer. It executes one failing regression with the exact saved signature and attached text measurement. [Candidate verification](evidence/text-fit/candidate-verification.json) reproduces the reduced failure with the actual exported JavaScript and passes after a browser-only wrapping override; declared app files remain unchanged.

The earlier independent inspection in HOLO-GRAILS.md remains separate evidence. Its border-box comparison reports 23.14px; the new rule uses the supported client clipping area and reports 24.14px for the original input and 6.95px for the reduced input. These are different documented region edges, not conflicting outcomes. No production app repair or human debugging-time benefit is claimed.
