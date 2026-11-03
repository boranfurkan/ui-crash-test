import { chromium, type Browser } from '@playwright/test';
import { measureAction, type ActionFinding } from '../core/action-rule.ts';
import { validateRecipe, type BrowserRecipe, type Json } from './config.ts';
import { preparePage, viewportFor } from './replay.ts';

export class ScenarioRenderer {
  private browser?: Browser;
  constructor(private baseURL: string, private recipe: BrowserRecipe) { validateRecipe(recipe); }
  async start() { this.browser = await chromium.launch({ headless: true }); return this.browser.version(); }
  async evaluate(input: Json, screenshot?: string): Promise<ActionFinding> {
    if (!this.browser) throw new Error('Renderer has not started.');
    const context = await this.browser.newContext({ viewport: viewportFor(this.recipe, input), locale: 'en-GB', colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      await preparePage(page, this.baseURL, this.recipe, input);
      const finding = await measureAction(page, this.recipe.rule);
      // Full-page screenshots include off-screen content without scrolling before the measurement.
      if (screenshot) {
        if (this.recipe.screenshot === 'page' || this.recipe.screenshot === 'viewport') await page.screenshot({ path: screenshot, fullPage: this.recipe.screenshot === 'page', animations: 'disabled' });
        else await page.locator(this.recipe.screenshot).screenshot({ path: screenshot, animations: 'disabled', timeout: 5000 });
      }
      return finding;
    } catch (error) {
      const rule = this.recipe.rule;
      return { status: 'inconclusive', signature: `${rule.id}|${rule.target}|${rule.boundary}|inconclusive`, reason: String(error), overflowPx: 0, contained: false, receivesEvents: false };
    } finally { await context.close(); }
  }
  async close() { await this.browser?.close(); }
}
