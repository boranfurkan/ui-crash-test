# Measurement controls and limits

Run `npm run controls` for a visual report, exact synthetic scenes and JSON findings. `npm run test:browser` also executes the corpus as browser tests. The dashboard links the latest report and marks it stale if its measurement/corpus fingerprint differs from the current source. The [curated measurements](evidence/controls/report.json) are retained. Full scenes and the visual control report are in the release evidence ZIP.

The 32 curated controls cover:

| Kind | Count | Expected behavior |
| --- | ---: | --- |
| Healthy | 10 | Pass containment and center-point hit testing. Playwright’s trial click independently succeeds after the measurement. |
| Deliberately broken | 6 | Detect an outside-region action, opaque or transparent intercepting overlay, center clipping, disabled pointer events, or a violated explicit viewport requirement. |
| Uncertain state or adapter | 14 | Return inconclusive for disabled/inert/hidden states, transparent ancestors, zero-size/missing/ambiguous targets, wrong portal boundaries, invalid selectors or off-screen centers with no explicit viewport requirement. |
| Known scope limit | 2 | A clipped edge or corner-only obstruction can pass while the center remains available. These are documented limits, not healthy UI claims. |

Other healthy scenes cover intentional ellipsis, pointer-transparent decoration, icon children, translated containers, subpixel tolerance, horizontal and vertical scrolling, portals and explicit ARIA-disabled overrides. Native disabled fieldsets and inherited ARIA disabled states are checked.

## Viewport policy

An off-screen center alone is **inconclusive** by default. Declare permitted scrolling in `recipe.setup` before measurement. This avoids presenting a scrollable page as a confirmed defect just because it was inspected too early.

Some components must keep an action in the viewport: for example, checkout in a popup attached to a fixed header. An adapter can explicitly declare:

```ts
rule: {
  id: 'cart-checkout-reachable',
  target: '.cart-preview.active .action-block button',
  boundary: '.cart-preview.active',
  requireViewportCenter: true,
}
```

After the declared setup and scrolling, an off-screen center is then a failure with the `outside-viewport` signature. This policy must come from an application requirement. The tool does not infer that every off-screen control is broken.

## What passing means

The action is rendered and enabled, its bounding box fits its declared region within 1px, and its center receives a pointer hit. A hit on a descendant counts as a hit on the action. Ancestor opacity and inert/ARIA-disabled state are checked before geometry.

This is a center-point rule. Passing does not establish full hitbox visibility, readable text, keyboard operation, touch-target size, accessibility compliance or overall usability. Shadow-root traversal, all-animation settling, all-browser behavior and arbitrary-site scanning are not implemented.

The corpus is authored with the rule and uses deliberately constructed scenes. Matching all expected outcomes is a regression result, not an independent precision/recall estimate. It includes two expected misses. Do not present its count as “100% accuracy.”

## Reproduction and comparability

Each control gets a fresh browser context at a 600×400 viewport. Reports retain the browser version, per-file hashes, exact rule source, every scene’s HTML and selected screenshots. Healthy trial clicks run after measurement so their automatic scrolling cannot silently change the measurement.

Application campaigns also re-hash declared subject and engine files before completion. A source change invalidates the run and does not update the latest completed report. A browser regression explicitly mutates a temporary declared source file to verify this guard. This checks declared files, not an automatically traced dependency graph or remote service state.
