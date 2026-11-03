# Checkout below the viewport

The first external-source finding concerns the shopping app’s **existing cart preview**, not the deliberately broken reference member list. The subject is pinned to [sivadass/react-shopping-cart, commit 0e867f1](https://github.com/sivadass/react-shopping-cart/tree/0e867f1caf6abd7114aab6ae704a2824064e84e0) from 16 June 2021.

The header, cart preview, providers, storage hook and relevant original SCSS are imported without edits. A local fixture initializes the original cart provider through its existing add action. The original header icons are mirrored byte-for-byte into the browser recipe, with their source URLs and hashes recorded. A local product image is supplied through the valid cart fixture. The compatibility harness uses modern dependencies and local fallback fonts; this is not the complete deployed application.

**Scope:** this reproduces a layout problem in that pinned source under an explicit checkout-visibility requirement. It is not a finding against the current deployed site and has not been reported to or confirmed by its maintainer.

## Trigger and evidence

At a **640×320** viewport, open the cart and try to reach checkout. The [original cart SCSS](https://github.com/sivadass/react-shopping-cart/blob/0e867f1caf6abd7114aab6ae704a2824064e84e0/src/assets/scss/components/_header.scss) assigns the popup a **388px height** and places its footer at the bottom. The popup is anchored to a fixed header. Its checkout button’s top is **y=399**, with center **y=417**, below the viewport’s 320px edge. Scrolling the document does not move the fixed header into view.

The normal **1000×900** control passes. Of 14 declared discovery cases, **7 pass and 7 fail**, with **0 inconclusive**. The first failure repeats in **3/3 fresh contexts**. The exported regression is actually executed and attaches the same `outside-viewport` finding.

This is a viewport-height defect. Long product text is not needed to cause it. Reduction removes two unrelated products and simplifies the primary product’s name and price: **401 → 156 UTF-8 bytes**, using **3 probes**, while retaining the 640×320 viewport and the same failure signature. Quantity remains 2 because changing a one-digit quantity does not reduce serialized size under this reducer. The result is best found among the declared candidates, not a global minimum.

The saved reduced input is:

```json
{
  "products": [{
    "id": "cart-primary",
    "name": "Tea",
    "price": 1,
    "quantity": 2,
    "image": "/fixtures/compat-app/product.svg"
  }],
  "viewportWidth": 640,
  "viewportHeight": 320
}
```

## Independent check and candidate change

An ordinary Playwright viewport assertion and a trial click also catch the original problem. The trial click fails after attempting to scroll. This corroborates the finding without relying solely on the tool’s own measurement.

The [candidate CSS](../../fixtures/compat-app/cart-candidate.css) caps popup height to the available viewport and gives the list the remaining scrollable area, keeping the footer in the popup. It is injected only in verification pages; no vendored upstream file is modified.

With the same reduced data and viewport, the candidate moves checkout to **y=235–271**, entirely visible, and both the measurement and Playwright trial click pass. The candidate also passes the baseline, all 14 discovery cases and the saved reduced case: **16/16 checks**.

[Open the visual investigation](../evidence/cart/report.html). It includes original/candidate screenshots, the exact fixture, independent verification JSON and a failing replay bundle. [The generic campaign report (evidence ZIP)](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip) retains all discovery cases and reduction decisions.

## Repeat

```sh
npm run scenarios -- --scenario cart-preview
# Keep the fixture app running in another terminal:
npm run dev
# With that server available:
npm run investigate:cart
```

The scenario command starts and stops its own temporary server. The investigator connects to an existing server, defaulting to port 4173; set `UI_CRASH_BASE_URL` for another port. It uses the last saved cart campaign, refuses a mismatched recipe, and verifies the candidate in fresh contexts. The regression bundle contains the recipe, saved data, original asset bytes and exact replay/measurement sources; it still needs the fixture app.

The saved ZIP was also extracted outside the tool package, installed independently and executed with its own Playwright 1.64.1. Exactly one test failed, without retries, and its attached measurement matched the saved failure signature. [Detached verification](../evidence/cart/detached-verification.json) records that check.

## What remains to learn

This establishes that the configurable pipeline can reduce and export a defect present in existing external source. It does not establish an advantage over handwritten Playwright tests, faster human debugging or independent adoption. The simple Playwright assertion catches this case too. The product hypothesis to evaluate is whether realistic inputs, domain-preserving reduction and retained evidence make useful regressions easier to create and keep.

Adapter setup time was not independently measured. The work included recovering original component context and styles, mirroring assets, proving fixture consumption, declaring a viewport requirement and checking scrolling behavior. A timed first-use trial with a separate developer is still needed.
