import { assertValidInput, type CaseInput, type Layout } from "./model.ts";
import type { ActionFinding } from "../core/action-rule.ts";
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
    const finding = await this.renderers[layout].evaluate(input, screenshot);
    if (!('receivesEvents' in finding)) throw new Error('The member reference requires an action finding.');
    return finding;
  }
  async close() { await Promise.all([this.renderers.broken.close(), this.renderers.fixed.close()]); }
}
