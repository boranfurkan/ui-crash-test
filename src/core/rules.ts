import type { Page } from '@playwright/test';
import { measureAction, type ActionRule, type ActionFinding } from './action-rule.ts';
import { measureText, type TextRule, type TextFinding } from './text-rule.ts';

export type Rule = ActionRule | TextRule;
export type RuleFinding = ActionFinding | TextFinding;
export function measureRule(page: Page, rule: Rule): Promise<RuleFinding> {
  return rule.kind === 'text-fit' ? measureText(page, rule) : measureAction(page, rule);
}
