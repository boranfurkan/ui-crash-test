import type { Page } from '@playwright/test';

/** Explicit horizontal fit of required text. Does not test vertical clipping or occlusion. */
export type TextRule = { kind: 'text-fit'; id: string; target: string; boundary: string };
export type TextFinding = {
  status: 'passed' | 'failed' | 'inconclusive'; signature: string; reason: string;
  overflowPx: number; contained: boolean;
  text?: string; fragments?: { left: number; right: number; top: number; bottom: number }[];
  effectiveRegion?: { left: number; right: number };
  clippingRegions?: { tag: string; left: number; right: number }[];
};

export async function measureText(page: Page, rule: TextRule): Promise<TextFinding> {
  return page.evaluate(({ id, target, boundary }) => {
    const identity = `${id}|${target}|${boundary}`;
    const unresolved = (reason: string) => ({ status: 'inconclusive' as const, signature: `${identity}|inconclusive`, reason, overflowPx: 0, contained: false });
    let targets: NodeListOf<HTMLElement>, regions: NodeListOf<HTMLElement>;
    try { targets = document.querySelectorAll<HTMLElement>(target); regions = document.querySelectorAll<HTMLElement>(boundary); }
    catch { return unresolved('A declared text target or boundary selector is invalid.'); }
    if (targets.length !== 1 || regions.length !== 1) return unresolved(`Expected one text target and one boundary; found ${targets.length} and ${regions.length}.`);
    const element = targets[0], region = regions[0];
    if (!(element instanceof HTMLElement) || !(region instanceof HTMLElement)) return unresolved('Text fit supports HTML elements; SVG text is not supported.');
    if (!region.contains(element)) return unresolved('The declared boundary does not contain the text target.');
    const box = element.getBoundingClientRect(), boundaryBox = region.getBoundingClientRect();
    if (!box.width || !box.height || !boundaryBox.width || !boundaryBox.height) return unresolved('The text target or boundary has no rendered area.');
    if (document.fonts.status !== 'loaded') return unresolved('Fonts are still loading. Wait for them before measuring text fit.');
    let left = boundaryBox.left, right = boundaryBox.right;
    const clippingRegions: { tag: string; left: number; right: number }[] = [];
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0 || style.contentVisibility === 'hidden') return unresolved('The required text is hidden or transparent.');
      if (style.clipPath !== 'none' || style.maskImage !== 'none' || style.clip !== 'auto') return unresolved('Clip paths, legacy clip rectangles and masks are outside the horizontal text-fit rule.');
      if (style.writingMode !== 'horizontal-tb') return unresolved('Vertical writing modes are outside the horizontal text-fit rule.');
      if (style.perspective !== 'none' || style.transformStyle === 'preserve-3d') return unresolved('Perspective and preserved 3D contexts are outside the horizontal text-fit rule.');
      if (style.rotate !== 'none' && style.rotate !== '0deg') return unresolved('Individual CSS rotation is outside the horizontal text-fit rule.');
      if (style.scale !== 'none' && style.scale.split(/\s+/).some(value => Number(value) <= 0)) return unresolved('Mirrored or collapsed individual CSS scaling is outside the horizontal text-fit rule.');
      if (style.transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(style.transform);
        if (!matrix.is2D || Math.abs(matrix.b) > 0.0001 || Math.abs(matrix.c) > 0.0001 || matrix.a <= 0 || matrix.d <= 0) return unresolved('Rotated, skewed, mirrored or 3D text is outside the horizontal text-fit rule.');
      }
      if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) || /(?:paint|strict|content)/.test(style.contain)) {
        const rect = ancestor.getBoundingClientRect();
        const scale = ancestor.offsetWidth ? rect.width / ancestor.offsetWidth : 1;
        const clipLeft = rect.left + ancestor.clientLeft * scale, clipRight = clipLeft + ancestor.clientWidth * scale;
        left = Math.max(left, clipLeft); right = Math.min(right, clipRight);
        clippingRegions.push({ tag: ancestor.tagName.toLowerCase(), left: clipLeft, right: clipRight });
      }
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const fragments: { left: number; right: number; top: number; bottom: number }[] = [];
    let node: Node | null, nodes = 0;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      if (++nodes > 256) return unresolved('The text target exceeds the 256 text-node measurement budget. Narrow the selector.');
      for (let parent = node.parentElement; parent && parent !== element; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return unresolved('The selected text includes a hidden descendant. Narrow the selector to required visible text.');
        if (style.transform !== 'none' || style.rotate !== 'none' || style.scale !== 'none' || style.clipPath !== 'none' || style.maskImage !== 'none' || style.clip !== 'auto' || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) return unresolved('A text descendant has its own transform or clip. Select that text element directly.');
      }
      const range = document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width && rect.height) fragments.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
        if (fragments.length > 2048) return unresolved('The text target exceeds the fragment measurement budget. Narrow the selector.');
      }
    }
    if (!fragments.length) return unresolved('The target contains no measurable nonempty text.');
    const overflowPx = Math.max(0, ...fragments.map(rect => left - rect.left), ...fragments.map(rect => rect.right - right));
    const contained = overflowPx <= 1;
    return {
      status: contained ? 'passed' as const : 'failed' as const,
      signature: `${identity}|${contained ? 'passed' : 'horizontal-text-overflow'}`,
      reason: contained ? 'Required text fragments fit horizontally inside the declared region and supported overflow clips.' : `Required text extends ${Math.round(overflowPx * 100) / 100}px beyond its horizontal region or overflow clip.`,
      overflowPx, contained, text: element.textContent ?? '', fragments, effectiveRegion: { left, right }, clippingRegions,
    };
  }, rule);
}
