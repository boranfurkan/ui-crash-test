import { cloneInput, inputComplexity, primaryMember, TARGET_ID, validateInput, type CaseInput } from '../shared/model.ts';
import type { ActionFinding } from './action-rule.ts';

export type ReductionStep = { label: string; accepted: boolean; status: ActionFinding['status']; complexity: number; reason: string };
export type Reduction = { input: CaseInput; steps: ReductionStep[]; evaluations: number; budget: number; complete: boolean; initialComplexity: number; finalComplexity: number };

/** Domain-preserving greedy reduction. Best found under a budget, not a global minimum. */
export async function reduceCase(
  original: CaseInput,
  signature: string,
  evaluate: (input: CaseInput) => Promise<ActionFinding>,
  options: { budget?: number; onStep?: (step: ReductionStep) => void } = {},
): Promise<Reduction> {
  let current = cloneInput(original), evaluations = 0, exhausted = false;
  const budget = options.budget ?? 30;
  const steps: ReductionStep[] = [];
  const attempt = async (label: string, candidate: CaseInput) => {
    if (inputComplexity(candidate) >= inputComplexity(current) || validateInput(candidate).length) return;
    if (evaluations >= budget) { exhausted = true; return; }
    evaluations++;
    const result = await evaluate(candidate);
    const accepted = result.status === 'failed' && result.signature === signature;
    if (accepted) current = cloneInput(candidate);
    const step = { label, accepted, status: result.status, complexity: inputComplexity(candidate), reason: result.reason };
    steps.push(step);
    options.onStep?.(step);
  };
  for (const member of original.members.filter(member => member.id !== TARGET_ID)) {
    const candidate = cloneInput(current);
    candidate.members = candidate.members.filter(item => item.id !== member.id);
    await attempt('Remove unrelated member', candidate);
  }
  for (const [field, value, label] of [
    ['avatar', null, 'Remove optional avatar'],
    ['role', null, 'Remove optional role'],
    ['status', 'active', 'Use the simpler active state'],
    ['email', 'a@b.co', 'Use a short valid email'],
  ] as const) {
    const candidate = cloneInput(current);
    Object.assign(primaryMember(candidate), { [field]: value });
    await attempt(label, candidate);
  }
  const originalName = primaryMember(current).name;
  const names = [...new Set(['Jo', 'Maya Chen', 'Alexandria', 'Konstantin Oberhauser', 'Aleksandra Wiśniewska', ...originalName.split(/\s+/), originalName.split(/\s+/).slice(0, 2).join(' ')])].sort((a, b) => Array.from(a).length - Array.from(b).length);
  for (const name of names) {
    const candidate = cloneInput(current);
    primaryMember(candidate).name = name;
    await attempt(`Try shorter name: ${name}`, candidate);
  }
  return { input: current, steps, evaluations, budget, complete: !exhausted, initialComplexity: inputComplexity(original), finalComplexity: inputComplexity(current) };
}
