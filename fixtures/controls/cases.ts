import type { Page } from '@playwright/test';
import type { ActionFinding, ActionRule } from "../../src/core/action-rule.ts";

export const CONTROL_RULE = { id: 'control-action', target: '[data-action]', boundary: '[data-boundary]' };
export type RuleControl = { id: string; name: string; category: 'healthy' | 'defect' | 'uncertain' | 'limitation'; expected: ActionFinding['status']; suffix?: string; explanation: string; html: string; scroll?: boolean; screenshot?: boolean; disabled?: boolean; rule?: ActionRule };
const scene = (content: string, styles = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;padding:32px;background:#f2f3ec;color:#203e2d;font:14px system-ui}h1{font-size:18px;margin:0 0 24px}p{margin:0} [data-boundary]{position:relative;width:260px;height:100px;border:1px solid #bccbbb;background:white} [data-action]{position:absolute;left:140px;top:30px;width:100px;height:36px;border:0;border-radius:4px;background:#326248;color:white;font:14px system-ui;cursor:pointer}.overlay{position:absolute;left:140px;top:30px;width:100px;height:36px;background:#d7ddcf;z-index:2}${styles}
</style></head><body><h1>Action measurement control</h1>${content}</body></html>`;
const normal = '<div data-boundary><button data-action>Review</button></div>';
const define = (id: string, name: string, category: RuleControl['category'], expected: RuleControl['expected'], explanation: string, html: string, extra: Partial<RuleControl> = {}): RuleControl => ({ id, name, category, expected, explanation, html, ...extra });

export const RULE_CONTROLS: RuleControl[] = [
  define('normal', 'Ordinary contained action', 'healthy', 'passed', 'A visible, enabled button is contained and unobstructed.', scene(normal), { screenshot: true }),
  define('ellipsis', 'Intentional text ellipsis', 'healthy', 'passed', 'Truncating unrelated content does not obstruct the action.', scene('<div data-boundary><p style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">International customer collection with a deliberately long display name</p><button data-action>Review</button></div>')),
  define('decoration', 'Intentional decoration over button', 'healthy', 'passed', 'A pointer-events:none decoration does not intercept the center hit.', scene('<div data-boundary><button data-action>Review</button><i class="overlay" style="pointer-events:none;opacity:.3"></i></div>'), { screenshot: true }),
  define('child-hit', 'Icon child receives the hit', 'healthy', 'passed', 'A hit on a descendant belongs to the button.', scene('<div data-boundary><button data-action style="padding:0"><span style="display:block;width:100%;height:100%;padding:8px">↗ Review</span></button></div>')),
  define('transformed', 'Translated containing component', 'healthy', 'passed', 'Moving both region and target keeps containment.', scene(normal, '[data-boundary]{transform:translate(40px,20px)}')),
  define('tolerance', 'Subpixel edge tolerance', 'healthy', 'passed', 'A 0.5px protrusion is within the declared 1px tolerance.', scene(normal, '[data-action]{left:159.5px}')),
  define('horizontal-scroll', 'Allowed horizontal scrolling', 'healthy', 'passed', 'A wide row can be scrolled; the action is inside that declared wide row.', scene('<div style="width:280px;overflow:auto"><div data-boundary style="width:700px"><button data-action style="left:570px">Review</button></div></div>'), { scroll: true, screenshot: true }),
  define('vertical-scroll', 'Allowed nested vertical scrolling', 'healthy', 'passed', 'A tall declared region scrolls within its container before measurement.', scene('<div style="height:120px;width:280px;overflow:auto"><div data-boundary style="height:700px"><button data-action style="top:570px">Review</button></div></div>'), { scroll: true }),
  define('portal', 'Portal with the correct boundary', 'healthy', 'passed', 'The target is measured within its actual portal region, outside the app shell.', scene('<main id="app">Application shell</main><div id="portal" data-boundary><button data-action>Review</button></div>'), { screenshot: true }),
  define('aria-opt-in', 'Descendant opts out of inherited ARIA disabled state', 'healthy', 'passed', 'The nearest explicit aria-disabled=false state is honored.', scene('<div data-boundary aria-disabled="true"><div aria-disabled="false"><button data-action>Review</button></div></div>')),
  define('outside', 'Action outside its declared region', 'defect', 'failed', 'The action extends 61px beyond the component edge.', scene(normal, '[data-action]{left:220px}'), { suffix: 'outside-boundary', screenshot: true }),
  define('overlay', 'Pointer-blocking overlay', 'defect', 'failed', 'An opaque sibling covers the center of the button.', scene('<div data-boundary><button data-action>Review</button><div class="overlay"></div></div>'), { suffix: 'pointer-blocked', screenshot: true }),
  define('transparent-overlay', 'Transparent intercepting overlay', 'defect', 'failed', 'Opacity does not determine whether an overlay captures pointer events.', scene('<div data-boundary><button data-action>Review</button><div class="overlay" style="opacity:0"></div></div>'), { suffix: 'pointer-blocked' }),
  define('clip-center', 'Ancestor clips the action center', 'defect', 'failed', 'The region contains the button, but an ancestor clips its center.', scene(`<div style="width:180px;overflow:hidden">${normal}</div>`), { suffix: 'pointer-blocked', screenshot: true }),
  define('pointer-events', 'Pointer events disabled on the action', 'defect', 'failed', 'An otherwise enabled visible action rejects pointer input.', scene(normal, '[data-action]{pointer-events:none}'), { suffix: 'pointer-blocked' }),
  define('disabled', 'Native disabled action', 'uncertain', 'inconclusive', 'A disabled action is outside the enabled-action experiment.', scene('<div data-boundary><button data-action disabled>Review</button></div>'), { disabled: true }),
  define('disabled-fieldset', 'Disabled through a fieldset', 'uncertain', 'inconclusive', 'Native disabled inheritance is honored.', scene('<div data-boundary><fieldset disabled><button data-action>Review</button></fieldset></div>'), { disabled: true }),
  define('aria-disabled', 'ARIA-disabled action', 'uncertain', 'inconclusive', 'Explicit ARIA disabled state is not a geometry failure.', scene('<div data-boundary><button data-action aria-disabled="true">Review</button></div>'), { disabled: true }),
  define('aria-disabled-ancestor', 'ARIA-disabled ancestor', 'uncertain', 'inconclusive', 'Inherited disabled state does not masquerade as an enabled-action defect.', scene('<div data-boundary aria-disabled="true"><button data-action>Review</button></div>')),
  define('inert', 'Inert application region', 'uncertain', 'inconclusive', 'A target in an inert region is not interactive in this state.', scene('<div data-boundary inert><button data-action>Review</button></div>')),
  define('hidden', 'Hidden action', 'uncertain', 'inconclusive', 'A hidden action does not establish a layout defect.', scene(normal, '[data-action]{visibility:hidden}')),
  define('transparent-parent', 'Fully transparent ancestor', 'uncertain', 'inconclusive', 'The action has a box and hit target but is not visibly rendered.', scene(normal, '[data-boundary]{opacity:0}')),
  define('collapsed', 'Collapsed action', 'uncertain', 'inconclusive', 'A zero-size target cannot be meaningfully evaluated.', scene(normal, '[data-action]{width:0;height:0;padding:0}')),
  define('missing', 'Missing target', 'uncertain', 'inconclusive', 'A missing locator is adapter uncertainty.', scene('<div data-boundary></div>')),
  define('duplicate', 'Ambiguous target', 'uncertain', 'inconclusive', 'Two matching targets cannot identify one action.', scene('<div data-boundary><button data-action>One</button><button data-action>Two</button></div>')),
  define('duplicate-boundary', 'Ambiguous boundary', 'uncertain', 'inconclusive', 'Two matching regions do not establish one component boundary.', scene(normal + '<div data-boundary></div>')),
  define('portal-wrong-boundary', 'Portal with an app-shell boundary', 'uncertain', 'inconclusive', 'The locator points at a shell that does not contain the portalled action.', scene('<main data-boundary>Application shell</main><button data-action style="left:350px;top:80px">Review</button>')),
  define('offscreen', 'Unscrolled off-screen action', 'uncertain', 'inconclusive', 'A contained off-screen center requires an explicit scrolling policy.', scene(normal, '[data-boundary]{margin-top:800px}'), { screenshot: true }),
  define('required-viewport', 'Explicit viewport requirement violated', 'defect', 'failed', 'A fixed action must have its center in the viewport when that is an explicit component requirement.', scene(normal, '[data-boundary]{position:fixed;top:700px}'), { rule: { ...CONTROL_RULE, requireViewportCenter: true }, suffix: 'outside-viewport' }),
  define('invalid-selector', 'Invalid CSS selector', 'uncertain', 'inconclusive', 'A selector syntax error is adapter uncertainty.', scene(normal), { rule: { ...CONTROL_RULE, target: '[' } }),
  define('partial-clip', 'Partial clipping away from center', 'limitation', 'passed', 'Known scope limit: the center remains available although the right edge is clipped. This rule does not establish full hitbox visibility.', scene(`<div style="width:225px;overflow:hidden">${normal}</div>`), { screenshot: true }),
  define('corner-overlay', 'Overlay covers only a corner', 'limitation', 'passed', 'Known scope limit: an obstruction away from the center is not detected.', scene('<div data-boundary><button data-action>Review</button><div class="overlay" style="width:15px;height:15px"></div></div>')),
];

export async function mountControl(page: Page, control: RuleControl) {
  await page.setContent(control.html);
  if (control.scroll) await page.locator(CONTROL_RULE.target).scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
