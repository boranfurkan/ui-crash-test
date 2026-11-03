import type { ActionFinding } from '../core/action-rule.ts';
import type { Json, ScenarioConfig } from './config.ts';

export const complexity = (input: Json) => Buffer.byteLength(JSON.stringify(input), 'utf8');
export type ScenarioReduction<T extends Json = Json> = { input: T; initialBytes: number; finalBytes: number; evaluations: number; budget: number; complete: boolean; steps: { label: string; accepted: boolean; status: ActionFinding['status']; reason: string; bytes: number }[] };

export async function reduceScenario<T extends Json>(config: ScenarioConfig<T>, original: T, signature: string, evaluate: (input: T) => Promise<ActionFinding>, budget = 30): Promise<ScenarioReduction<T>> {
  let current = structuredClone(original), evaluations = 0, complete = false;
  const steps: ScenarioReduction<T>['steps'] = [];
  const seen = new Set([JSON.stringify(current)]);
  while (evaluations < budget) {
    let accepted = false;
    for (const candidate of config.candidates(structuredClone(current))) {
      const serialized = JSON.stringify(candidate.input);
      if (seen.has(serialized) || complexity(candidate.input) >= complexity(current) || config.validate(candidate.input).length) continue;
      seen.add(serialized);
      if (evaluations >= budget) break;
      evaluations++;
      const result = await evaluate(candidate.input);
      const keep = result.status === 'failed' && result.signature === signature;
      steps.push({ label: candidate.label, accepted: keep, status: result.status, reason: result.reason, bytes: complexity(candidate.input) });
      if (keep) { current = structuredClone(candidate.input); accepted = true; break; }
    }
    if (!accepted && evaluations < budget) { complete = true; break; }
  }
  return { input: current, initialBytes: complexity(original), finalBytes: complexity(current), evaluations, budget, complete, steps };
}
