import type { EmbrSignal } from "./signalDetector";
import type { EmbrPostureProfile } from "./postureSelector";
import type { EmbrResponsePlan } from "./responsePlanner";

export type EmbrValidationResult = {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  repairSuggestions: string[];
};

export function validateResponsePlan(
  signal: EmbrSignal,
  posture: EmbrPostureProfile,
  plan: EmbrResponsePlan
): EmbrValidationResult {
  const issues: string[] = [];
  const repairSuggestions: string[] = [];

  // 1. Overwhelmed users should not get complex plans.
  if (
    signal.emotionalState === "overwhelmed" &&
    plan.structure.length > 4
  ) {
    issues.push("Plan may overwhelm an already overwhelmed user.");
    repairSuggestions.push("Reduce the response to one immediate next step.");
  }

  // 2. Protector posture should not route to outside models first.
  if (
    signal.posture === "protector" &&
    plan.shouldUseOutsideModel
  ) {
    issues.push("Protector posture should ground the user before routing externally.");
    repairSuggestions.push("Handle grounding directly before using any outside model.");
  }

  // 3. Client messages should usually create an artifact.
  if (
    signal.taskType === "client_message" &&
    !plan.shouldCreateArtifact
  ) {
    issues.push("Client-message task should produce a copy-ready message.");
    repairSuggestions.push("Set shouldCreateArtifact to true and produce usable wording.");
  }

  // 4. Business tasks should protect scope.
  if (
    signal.taskType === "business" &&
    !plan.structure.some((item) => item.toLowerCase().includes("scope")) &&
    !plan.structure.some((item) => item.toLowerCase().includes("pricing")) &&
    !plan.structure.some((item) => item.toLowerCase().includes("boundary"))
  ) {
    issues.push("Business response may not protect scope.");
    repairSuggestions.push("Add scope protection or pricing boundaries.");
  }

  // 5. Coding tasks should be step-by-step.
  if (
    signal.taskType === "coding" &&
    !posture.responseStyle.some((item) => item.toLowerCase().includes("one file")) &&
    !posture.responseStyle.some((item) => item.toLowerCase().includes("commands"))
  ) {
    issues.push("Coding response may be too vague.");
    repairSuggestions.push("Use exact commands or one-file-at-a-time guidance.");
  }

  // 6. High-risk responses should not be vague.
  if (
    plan.riskLevel === "high" &&
    plan.firstMove.trim().length < 20
  ) {
    issues.push("High-risk plan has a weak first move.");
    repairSuggestions.push("Make the first move grounding, specific, and immediate.");
  }

  const penalty = issues.length * 18;
  const score = Math.max(0, 100 - penalty);

  return {
    passed: issues.length === 0,
    score,
    issues,
    repairSuggestions
  };
}
