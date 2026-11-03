import { expect, type Page } from '@playwright/test';
import type { ActionRule } from '../core/action-rule.ts';

/** Independent native assertions. This deliberately does not import our measurement implementation. */
export async function nativeAssertions(page: Page, rule: ActionRule) {
  try {
    const target = page.locator(rule.target), boundary = page.locator(rule.boundary);
    if (await target.count() !== 1 || await boundary.count() !== 1) return { status: 'inconclusive', reason: 'Expected one target and boundary.' };
    if (!await target.isVisible() || !await target.isEnabled()) return { status: 'inconclusive', reason: 'Native Playwright visibility/enabled preconditions were not met.' };
    if (!await boundary.evaluate((region, selector) => region.contains(document.querySelector(selector)), rule.target)) return { status: 'inconclusive', reason: 'The declared region does not contain the target.' };
    const box = await target.boundingBox(), region = await boundary.boundingBox();
    if (!box || !region) return { status: 'inconclusive', reason: 'Native bounding boxes were unavailable.' };
    const overflowPx = Math.max(0, region.x - box.x, region.y - box.y, box.x + box.width - region.x - region.width, box.y + box.height - region.y - region.height);
    let containmentAssertion = true;
    try { expect(overflowPx, 'Action fits its declared region with 1px tolerance').toBeLessThanOrEqual(1); } catch { containmentAssertion = false; }
    let trialClick = true, trialError: string | null = null;
    try { await target.click({ trial: true, timeout: 600 }); } catch (error) { trialClick = false; trialError = String(error).slice(0, 4000); }
    // Native trial clicks may scroll. Retain that difference instead of pretending this is the same oracle.
    const after = await target.boundingBox(), viewport = page.viewportSize();
    const centerInViewport = !!after && !!viewport && after.x + after.width / 2 >= 0 && after.y + after.height / 2 >= 0 && after.x + after.width / 2 < viewport.width && after.y + after.height / 2 < viewport.height;
    const passed = containmentAssertion && trialClick && (!rule.requireViewportCenter || centerInViewport);
    return { status: passed ? 'passed' : 'failed', containmentAssertion, overflowPx, trialClick, trialError, centerInViewport, reason: passed ? 'Independent containment and native trial-click checks passed.' : 'An independent containment, viewport or native actionability assertion failed.' };
  } catch (error) { return { status: 'inconclusive', reason: String(error) }; }
}
