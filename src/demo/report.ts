import type { ActionFinding } from '../core/action-rule.ts';
import type { Reduction } from "./reduce.ts";
import type { CaseInput } from './model.ts';

export type ProgressEvent = { time: string; phase: string; message: string };
export type RunStatus = { state: 'idle' | 'running' | 'completed' | 'error'; phase: string; events: ProgressEvent[]; runId?: string; error?: string };
export type Discovery = { name: string; origin: 'curated' | 'generated'; status: ActionFinding['status']; reason: string; input: CaseInput };
export type CampaignReport = {
  schemaVersion: 1;
  outcome: 'failure' | 'no-failure' | 'inconclusive';
  id: string;
  createdAt: string;
  seed: number;
  durationMs: number;
  environment: { browser: string; node: string; sourceHash: string; viewport: { width: number; height: number } };
  summary: { checked: number; failed: number; passed: number; inconclusive: number; valid: number };
  baseline: { input: CaseInput; finding: ActionFinding };
  original: { input: CaseInput; finding: ActionFinding; name: string } | null;
  reduced: { input: CaseInput; finding: ActionFinding } | null;
  reduction: Reduction | null;
  confirmation: { attempts: number; failures: number; fixed: ActionFinding } | null;
  regression: { broken: { passed: number; failed: number }; fixed: { passed: number; failed: number }; verified: boolean } | null;
  discovery: Discovery[];
  events: ProgressEvent[];
};
