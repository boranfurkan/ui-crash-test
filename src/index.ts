export { defineScenario, asScenario, inputAt, validateRecipe } from './scenario/config.ts';
export type { Json, BrowserRecipe, SetupStep, RenderProof, ScenarioConfig, ScenarioCase } from './scenario/config.ts';
export { runScenario } from './scenario/run.ts';
export type { RunOptions } from './scenario/run.ts';
export { measureAction } from './core/action-rule.ts';
export type { ActionRule, ActionFinding, Rect } from './core/action-rule.ts';
export type { ScenarioReport } from './scenario/report.ts';
export { checkScenario } from './scenario/doctor.ts';
export type { DoctorReport, DoctorCheck, DoctorOptions } from './scenario/doctor.ts';
