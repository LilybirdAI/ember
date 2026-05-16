import { getActiveBehaviorRules, type EmbrBehaviorRule } from "./behaviorRules";

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

  if (instructions.length === 0) {
    return "";
  }

  return [
    "Embr final response rules:",
    ...instructions.map((instruction) => `- ${instruction}`)
  ].join("\\n");
}
