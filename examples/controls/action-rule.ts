import type { Page } from '@playwright/test';

export type Rect = { x: number; y: number; width: number; height: number; right: number; bottom: number };
export type ActionFinding = {
  status: 'passed' | 'failed' | 'inconclusive';
  signature: string;
  reason: string;
  overflowPx: number;
  contained: boolean;
  receivesEvents: boolean;
  targetRect?: Rect;
  boundaryRect?: Rect;
};
export type ActionRule = { id: string; target: string; boundary: string; requireViewportCenter?: boolean };

/** Shared verbatim with the exported test. A measurement never clicks the action. */
export async function measureAction(page: Page, rule: ActionRule): Promise<ActionFinding> {
  return page.evaluate(({ id, target, boundary, requireViewportCenter }) => {
    const identity = `${id}|${target}|${boundary}`;
    let signature = `${identity}|inconclusive`;
    const unresolved = { status: 'inconclusive' as const, signature, overflowPx: 0, contained: false, receivesEvents: false };
    let targets: NodeListOf<HTMLElement>, boundaries: NodeListOf<HTMLElement>;
    try {
      targets = document.querySelectorAll<HTMLElement>(target);
      boundaries = document.querySelectorAll<HTMLElement>(boundary);
    } catch {
      return { ...unresolved, reason: 'A declared target or boundary selector is invalid.' };
    }
    if (targets.length !== 1 || boundaries.length !== 1) return { ...unresolved, reason: `Expected one target and one boundary; found ${targets.length} and ${boundaries.length}.` };
    const action = targets[0], region = boundaries[0];
    if (!region.contains(action)) return { ...unresolved, reason: 'The declared boundary does not contain the target.' };
    const bounds = action.getBoundingClientRect(), row = region.getBoundingClientRect();
    const style = getComputedStyle(action);
    if (!bounds.width || !bounds.height || style.visibility !== 'visible' || style.display === 'none' || Number(style.opacity) === 0) return { ...unresolved, reason: 'The declared action is not rendered visibly.' };
    if (action.matches(':disabled,[aria-disabled="true"]')) return { ...unresolved, reason: 'The declared action is disabled in this state.' };
    if (action.closest('[inert]') || action.closest('[aria-disabled]')?.getAttribute('aria-disabled') === 'true') return { ...unresolved, reason: 'The declared action is inside an inert or aria-disabled region.' };
    for (let ancestor = action.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (Number(getComputedStyle(ancestor).opacity) === 0) return { ...unresolved, reason: 'An ancestor makes the declared action fully transparent.' };
    }
    const overflowPx = Math.max(0, bounds.right - row.right, row.left - bounds.left, bounds.bottom - row.bottom, row.top - bounds.top);
    const contained = overflowPx <= 1;
    const x = bounds.left + bounds.width / 2, y = bounds.top + bounds.height / 2;
    const outsideViewport = x < 0 || y < 0 || x >= innerWidth || y >= innerHeight;
    if (contained && outsideViewport && !requireViewportCenter) return { ...unresolved, contained, reason: 'The action center is outside the viewport. Declare permitted scrolling before measuring.' };
    const hit = document.elementFromPoint(x, y);
    const receivesEvents = !!hit && (hit === action || action.contains(hit));
    const status = contained && receivesEvents ? 'passed' : 'failed';
    signature = `${identity}|${status === 'passed' ? 'passed' : !contained ? 'outside-boundary' : outsideViewport ? 'outside-viewport' : 'pointer-blocked'}`;
    return {
      status, signature, overflowPx: Math.round(overflowPx * 10) / 10, contained, receivesEvents,
      reason: status === 'passed' ? 'The action is inside its declared region and receives pointer events at its center.' : !contained ? `The action extends ${Math.round(overflowPx)}px outside its declared region.` : outsideViewport ? 'The action center is outside the viewport despite the declared viewport requirement.' : 'Another element or a clipping region blocks the action at its center.',
      targetRect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom },
      boundaryRect: { x: row.x, y: row.y, width: row.width, height: row.height, right: row.right, bottom: row.bottom },
    };
  }, rule);
}
