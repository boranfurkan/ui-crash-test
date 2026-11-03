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
export type ActionRule = { id: string; target: string; boundary: string };

/** Shared verbatim with the exported test. A measurement never clicks the action. */
export async function measureAction(page: Page, rule: ActionRule): Promise<ActionFinding> {
  return page.evaluate(({ id, target, boundary }) => {
    const identity = `${id}|${target}|${boundary}`;
    let signature = `${identity}|inconclusive`;
    const targets = document.querySelectorAll<HTMLElement>(target);
    const boundaries = document.querySelectorAll<HTMLElement>(boundary);
    const unresolved = { status: 'inconclusive' as const, signature, overflowPx: 0, contained: false, receivesEvents: false };
    if (targets.length !== 1 || boundaries.length !== 1) return { ...unresolved, reason: `Expected one target and one boundary; found ${targets.length} and ${boundaries.length}.` };
    const action = targets[0], region = boundaries[0];
    if (!region.contains(action)) return { ...unresolved, reason: 'The declared boundary does not contain the target.' };
    const bounds = action.getBoundingClientRect(), row = region.getBoundingClientRect();
    const style = getComputedStyle(action);
    if (!bounds.width || !bounds.height || style.visibility !== 'visible' || style.display === 'none' || Number(style.opacity) === 0) return { ...unresolved, reason: 'The declared action is not rendered visibly.' };
    if (action.matches(':disabled,[aria-disabled="true"]')) return { ...unresolved, reason: 'The declared action is disabled in this state.' };
    const overflowPx = Math.max(0, bounds.right - row.right, row.left - bounds.left, bounds.bottom - row.bottom, row.top - bounds.top);
    const contained = overflowPx <= 1;
    const x = bounds.left + bounds.width / 2, y = bounds.top + bounds.height / 2;
    const hit = document.elementFromPoint(x, y);
    const receivesEvents = !!hit && (hit === action || action.contains(hit));
    const status = contained && receivesEvents ? 'passed' : 'failed';
    signature = `${identity}|${status === 'passed' ? 'passed' : !contained ? 'outside-boundary' : 'pointer-blocked'}`;
    return {
      status, signature, overflowPx: Math.round(overflowPx * 10) / 10, contained, receivesEvents,
      reason: status === 'passed' ? 'The action is inside its row and receives pointer events at its center.' : !contained ? `The action extends ${Math.round(overflowPx)}px outside its row.` : 'Another element or a clipping region blocks the action at its center.',
      targetRect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom },
      boundaryRect: { x: row.x, y: row.y, width: row.width, height: row.height, right: row.right, bottom: row.bottom },
    };
  }, rule);
}
