import { assertValidInput, type CaseInput, type Layout } from '../shared/model.ts';
import type { ActionFinding } from './action-rule.ts';
import { ScenarioRenderer } from '../scenario/renderer.ts';
import { memberRecipe } from '../../scenarios/member-list.ts';

export class FixtureRenderer {
  private renderers: Record<Layout, ScenarioRenderer>;
  constructor(baseURL: string) { this.renderers = { broken: new ScenarioRenderer(baseURL, memberRecipe('broken')), fixed: new ScenarioRenderer(baseURL, memberRecipe('fixed')) }; }
  async start() {
    const browser = await this.renderers.broken.start();
    await this.renderers.fixed.start();
    return browser;
  }
  async evaluate(input: CaseInput, layout: Layout = 'broken', screenshot?: string): Promise<ActionFinding> {
    assertValidInput(input);
    return this.renderers[layout].evaluate(input, screenshot);
  }
  async close() { await Promise.all([this.renderers.broken.close(), this.renderers.fixed.close()]); }
}
