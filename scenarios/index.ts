import { compatScenarios } from './compat.ts';
import cart from './cart-preview.ts';
import todomvc from './todomvc-vue.ts';
import { asScenario } from '../src/scenario/config.ts';

export const externalScenarios = [...compatScenarios.map(asScenario), asScenario(cart), asScenario(todomvc)];
