import { getActiveBehaviorRules, type EmbrBehaviorRule } from "./behaviorRules";
import { getReflectionMemory } from "./reflectionMemory";

export type EmbrFinalResponseRules = {
  rules: EmbrBehaviorRule[];
  instructions: string[];
};

export function getFinalResponseRules(scope?: EmbrBehaviorRule["scope"]): EmbrFinalResponseRules {
  const rules = getActiveBehaviorRules(scope);

  return {
    rules,
    instructions: rules.map((rule) => rule.instruction)
  };
}

export function buildFinalResponseInstructionBlock(scope?: EmbrBehaviorRule["scope"]): string {
  const { instructions } = getFinalResponseRules(scope);
  const reflections = getReflectionMemory();

  const lines = [
    ...instructions.map((instruction) => `- ${instruction}`),
    ...reflections.map((reflection) => `- Learned: ${reflection.lesson}`)
  ];

  if (lines.length === 0) {
    return "";
  }

  return [
    "Embr final response rules:",
    ...lines
  ].join("\n");
}
