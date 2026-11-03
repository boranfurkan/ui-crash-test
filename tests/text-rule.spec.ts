import { test, expect } from '@playwright/test';
import { measureText, type TextRule } from '../src/core/text-rule.ts';
import { measureRule } from '../src/core/rules.ts';
import { measureAction } from '../src/core/action-rule.ts';

const rule: TextRule = { kind: 'text-fit', id: 'full-name-fits', target: '#text', boundary: '#region' };
const cases = [
  { name: 'ordinary required text', expected: 'passed', html: '<div id="region" style="width:260px"><span id="text">Alex Morgan</span></div>' },
  { name: 'healthy multiline wrapping', expected: 'passed', html: '<div id="region" style="width:130px"><p id="text">Alexandria Morgan and a collection of vintage cards</p></div>' },
  { name: 'text overflows while its element fits', expected: 'failed', html: '<div id="region" style="width:90px;overflow:hidden"><p id="text">AlexandriaKonstantinou123456789</p></div>' },
  { name: 'strict full-text policy detects ellipsis', expected: 'failed', html: '<div id="region" style="width:120px"><p id="text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Alexandria Konstantinou and a much longer name</p></div>' },
  { name: 'outer ancestor clips required text', expected: 'failed', html: '<div style="width:70px;overflow:hidden"><div id="region" style="width:300px"><span id="text">Alexandria Morgan</span></div></div>' },
  { name: 'nested untransformed visible spans', expected: 'passed', html: '<div id="region" style="width:260px"><p id="text"><span>Alex</span> <b>Morgan</b></p></div>' },
  { name: 'axis-aligned translated component', expected: 'passed', html: '<div id="region" style="width:260px;transform:translateX(20px)"><span id="text">Alex Morgan</span></div>' },
  { name: 'axis-aligned scaled overflow clip', expected: 'failed', html: '<div id="region" style="width:90px;overflow:hidden;transform:scale(.8);transform-origin:left top"><span id="text">AlexandriaKonstantinou123456789</span></div>' },
  { name: 'hidden text is inconclusive', expected: 'inconclusive', html: '<div id="region"><span id="text" style="visibility:hidden">Alex Morgan</span></div>' },
  { name: 'empty text is inconclusive', expected: 'inconclusive', html: '<div id="region"><div id="text"> </div></div>' },
  { name: 'missing target is inconclusive', expected: 'inconclusive', html: '<div id="region">Alex Morgan</div>' },
  { name: 'duplicate text target is inconclusive', expected: 'inconclusive', html: '<div id="region"><span id="text">Alex</span><span id="text">Morgan</span></div>' },
  { name: 'unsupported clip-path is inconclusive', expected: 'inconclusive', html: '<div id="region"><span id="text" style="clip-path:inset(0 50% 0 0)">Alex Morgan</span></div>' },
  { name: 'rotated text is inconclusive', expected: 'inconclusive', html: '<div id="region"><div id="text" style="transform:rotate(12deg)">Alex Morgan</div></div>' },
  { name: 'individual CSS rotation is inconclusive', expected: 'inconclusive', html: '<div id="region"><div id="text" style="rotate:12deg">Alex Morgan</div></div>' },
  { name: 'legacy clip rectangle is inconclusive', expected: 'inconclusive', html: '<div id="region"><span id="text" style="position:absolute;clip:rect(0,0,0,0)">Alex Morgan</span></div>' },
  { name: 'vertical writing is inconclusive', expected: 'inconclusive', html: '<div id="region"><div id="text" style="writing-mode:vertical-rl">Alex Morgan</div></div>' },
  { name: 'perspective context is inconclusive', expected: 'inconclusive', html: '<div id="region" style="perspective:800px"><div id="text" style="translate:0 0 10px">Alex Morgan</div></div>' },
  { name: 'hidden descendant is inconclusive', expected: 'inconclusive', html: '<div id="region"><p id="text">Alex <span style="display:none"><b>Morgan</b></span></p></div>' },
  { name: 'descendant-specific clipping needs a narrower target', expected: 'inconclusive', html: '<div id="region"><p id="text"><span style="display:inline-block;width:20px;overflow:hidden">AlexandriaMorgan</span></p></div>' },
];

for (const item of cases) test(`text-fit · ${item.name}`, async ({ page }) => {
  await page.setContent(`<style>body{font:16px/1.4 Arial;margin:20px}p{margin:0}</style>${item.html}`);
  await page.evaluate(() => document.fonts.ready);
  const finding = await measureRule(page, rule);
  expect(finding.status).toBe(item.expected);
  if (item.expected === 'failed') {
    expect(finding.signature).toContain('|horizontal-text-overflow');
    expect(finding.overflowPx).toBeGreaterThan(1);
  }
});

test('action reachability can pass while an explicit full-text policy fails', async ({ page }) => {
  await page.setContent('<div id="region" style="width:140px"><button id="text" style="width:140px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">A deliberately much longer action label that is ellipsized</button></div>');
  expect((await measureAction(page, { id: 'action', target: '#text', boundary: '#region' })).status).toBe('passed');
  expect((await measureText(page, rule)).status).toBe('failed');
});

test('wrapping candidate removes the same horizontal clipping without changing the data', async ({ page }) => {
  await page.setContent('<div id="region" style="width:100px;overflow:hidden"><p id="text" style="margin:0">AlexandriaKonstantinou123456789</p></div>');
  const before = await measureText(page, rule);
  expect(before.status).toBe('failed');
  await page.addStyleTag({ content: '#text { overflow-wrap:anywhere }' });
  const after = await measureText(page, rule);
  expect(after.status).toBe('passed');
  expect(after.text).toBe(before.text);
});
