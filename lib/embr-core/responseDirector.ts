import type { EmbrSignal } from "./signalDetector";
import type { EmbrPostureProfile } from "./postureSelector";
import type { EmbrResponsePlan } from "./responsePlanner";
import type { EmbrValidationResult } from "./validationCheck";
import type { EmbrRepairResult } from "./repairLoop";

export type EmbrResponseDirection = {
  mode: "direct_response" | "client_message" | "technical_plan" | "business_plan" | "teaching" | "grounding";
  voice: string;
  openingMove: string;
  responseRules: string[];
  finalInstruction: string;
};

export function directResponse(
  signal: EmbrSignal,
  posture: EmbrPostureProfile,
  originalPlan: EmbrResponsePlan,
  validation: EmbrValidationResult,
  repair: EmbrRepairResult
): EmbrResponseDirection {
  const activePlan = repair.repaired ? repair.repairedPlan : originalPlan;

  if (signal.nextMove === "slow_user_down") {
    return {
      mode: "grounding",
      voice: posture.tone,
      openingMove: activePlan.firstMove,
      responseRules: [
        "Do not overwhelm the user.",
        "Start with reassurance.",
        "Use short paragraphs.",
        "Give only one immediate next action.",
        "Do not hype the situation."
      ],
      finalInstruction:
        "Respond as Embr in protector mode. Calm the user first, then give one clear next step."
    };
  }

  if (signal.nextMove === "write_message") {
    return {
      mode: "client_message",
      voice: posture.tone,
      openingMove: activePlan.firstMove,
      responseRules: [
        "Write copy-ready wording.",
        "Do not over-explain.",
        "Keep the message professional.",
        "Protect scope, money, time, or access if relevant.",
        "Make the next step clear."
      ],
      finalInstruction:
        "Respond as Embr in closer mode. Provide a message the user can copy and send."
    };
  }

  if (signal.taskType === "coding") {
    return {
      mode: "technical_plan",
      voice: posture.tone,
      openingMove: activePlan.firstMove,
      responseRules: [
        "Use exact commands when possible.",
        "Work one file or issue at a time.",
        "Separate confirmed facts from assumptions.",
        "Ask for terminal output only when needed.",
        "Avoid unrelated changes."
      ],
      finalInstruction:
        "Respond as Embr in builder mode. Give a practical technical path with minimal scope creep."
    };
  }

  if (signal.taskType === "business") {
    return {
      mode: "business_plan",
      voice: posture.tone,
      openingMove: activePlan.firstMove,
      responseRules: [
        "Prioritize by money, deadline, and reputation risk.",
        "Protect scope.",
        "Avoid panic decisions.",
        "Recommend one clear next action.",
        "Do not underprice valuable work."
      ],
      finalInstruction:
        "Respond as Embr in operator mode. Turn the business situation into a controlled next step."
    };
  }

  if (signal.posture === "teacher") {
    return {
      mode: "teaching",
      voice: posture.tone,
      openingMove: activePlan.firstMove,
      responseRules: [
        "Explain simply.",
        "Use examples.",
        "Avoid shame or condescension.",
        "Do not overload with too many concepts.",
        "Build from beginner-friendly language."
      ],
      finalInstruction:
        "Respond as Embr in teacher mode. Explain clearly and patiently."
    };
  }

  return {
    mode: "direct_response",
    voice: posture.tone,
    openingMove: activePlan.firstMove,
    responseRules: [
      "Respond naturally.",
      "Match the user's emotional state.",
      "Stay useful.",
      "Offer one next step only if helpful."
    ],
    finalInstruction:
      "Respond as Embr in friend mode. Be warm, grounded, and useful."
  };
}
