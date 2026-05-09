import type { EmbrSignal } from "./signalDetector";
import type { EmbrPostureProfile } from "./postureSelector";
import type { EmbrResponsePlan } from "./responsePlanner";
import type { EmbrValidationResult } from "./validationCheck";

export type EmbrRepairResult = {
  repaired: boolean;
  repairedPlan: EmbrResponsePlan;
  repairNotes: string[];
};

export function repairResponsePlan(
  signal: EmbrSignal,
  posture: EmbrPostureProfile,
  plan: EmbrResponsePlan,
  validation: EmbrValidationResult
): EmbrRepairResult {
  const repairedPlan: EmbrResponsePlan = { ...plan };
  const repairNotes: string[] = [];

  if (validation.passed) {
    return {
      repaired: false,
      repairedPlan,
      repairNotes: ["No repair needed. Plan passed validation."]
    };
  }

  for (const issue of validation.issues) {
    const lower = issue.toLowerCase();

    if (lower.includes("overwhelm")) {
      repairedPlan.firstMove =
        "Slow the user down and give only one immediate next step.";
      repairedPlan.structure = [
        "Reassure the user",
        "Name the situation simply",
        "Give one next action",
        "Stop"
      ];
      repairedPlan.shouldAskQuestion = false;
      repairedPlan.shouldUseOutsideModel = false;
      repairedPlan.shouldCreateArtifact = false;
      repairedPlan.riskLevel = "high";

      repairNotes.push("Reduced plan complexity for overwhelmed user.");
    }

    if (lower.includes("protector")) {
      repairedPlan.shouldUseOutsideModel = false;
      repairedPlan.firstMove =
        "Ground the user directly before using any outside AI system.";

      repairNotes.push("Prevented outside-model routing during protector posture.");
    }

    if (lower.includes("client-message")) {
      repairedPlan.shouldCreateArtifact = true;
      repairedPlan.firstMove =
        "Write a copy-ready client message with clear scope and next step.";

      if (!repairedPlan.structure.includes("Provide copy-ready wording")) {
        repairedPlan.structure.unshift("Provide copy-ready wording");
      }

      repairNotes.push("Adjusted plan to produce a usable client-message artifact.");
    }

    if (lower.includes("scope")) {
      if (!repairedPlan.structure.includes("Protect scope and pricing boundaries")) {
        repairedPlan.structure.push("Protect scope and pricing boundaries");
      }

      repairNotes.push("Added scope protection to business response.");
    }

    if (lower.includes("coding")) {
      repairedPlan.structure = [
        "Identify the exact error or target file",
        "Use one command or one file at a time",
        "Ask for terminal output if needed",
        "Avoid unrelated changes"
      ];

      repairNotes.push("Made coding plan more concrete and step-by-step.");
    }

    if (lower.includes("weak first move")) {
      repairedPlan.firstMove =
        "Start with a specific grounding or action step before giving any explanation.";

      repairNotes.push("Strengthened weak first move.");
    }
  }

  return {
    repaired: true,
    repairedPlan,
    repairNotes
  };
}
