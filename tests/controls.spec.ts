import { test, expect } from '@playwright/test';
import { measureAction } from '../src/core/action-rule.ts';
import { CONTROL_RULE, RULE_CONTROLS, mountControl } from '../src/controls/cases.ts';

test.use({ viewport: { width: 600, height: 400 } });
for (const control of RULE_CONTROLS) {
  test(`rule control · ${control.id} · ${control.expected}`, async ({ page }) => {
    await mountControl(page, control);
    const finding = await measureAction(page, control.rule ?? CONTROL_RULE);
    expect(finding.status, control.explanation + '\n' + JSON.stringify(finding)).toBe(control.expected);
    if (control.suffix) expect(finding.signature).toMatch(new RegExp(`\\|${control.suffix}$`));
    if (control.category === 'healthy') await page.locator(CONTROL_RULE.target).click({ trial: true, timeout: 1500 });
    if (control.disabled) expect(await page.locator(CONTROL_RULE.target).isEnabled()).toBe(false);
  });
}
