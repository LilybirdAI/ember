import type { EmbrSignal } from "./signalDetector";
import type { EmbrPostureProfile } from "./postureSelector";

export type EmbrResponsePlan = {
  firstMove: string;
  structure: string[];
  shouldAskQuestion: boolean;
  shouldUseOutsideModel: boolean;
  shouldCreateArtifact: boolean;
  riskLevel: "low" | "medium" | "high";
};

export function createResponsePlan(
  signal: EmbrSignal,
  posture: EmbrPostureProfile
): EmbrResponsePlan {
  if (signal.nextMove === "slow_user_down") {
    return {
      firstMove: "Ground and reassure the user before doing anything else.",
      structure: [
        "Acknowledge the emotional state",
        "Reduce urgency",
        "Give one immediate next step",
        "Avoid long explanations"
      ],
      shouldAskQuestion: false,
      shouldUseOutsideModel: false,
      shouldCreateArtifact: false,
      riskLevel: "high"
    };
  }

  if (signal.nextMove === "write_message") {
    return {
      firstMove: "Write a copy-ready message for the user.",
      structure: [
        "Keep the message short",
        "Use the selected posture tone",
        "Protect scope if business-related",
        "Make the next step clear"
      ],
      shouldAskQuestion: false,
      shouldUseOutsideModel: false,
      shouldCreateArtifact: true,
      riskLevel: "medium"
    };
  }

  if (signal.nextMove === "create_plan") {
    return {
      firstMove: "Create a practical step-by-step plan.",
      structure: [
        "Identify the goal",
        "Separate known facts from assumptions",
        "List the next 1-3 actions",
        "Flag risks or scope issues"
      ],
      shouldAskQuestion: false,
      shouldUseOutsideModel: signal.needsOutsideModel,
      shouldCreateArtifact: false,
      riskLevel: signal.urgency === "high" ? "high" : "medium"
    };
  }

   if (signal.nextMove === "ask_clarifying_question") {
  return {
    firstMove: "Give a helpful first answer before asking for refinement.",
    structure: [
      "Answer directly first",
      "Keep the response calm and useful",
      "Ask one natural follow-up question only if needed"
    ],
    shouldAskQuestion: false,
    shouldUseOutsideModel: false,
    shouldCreateArtifact: false,
    riskLevel: "low"
  };
}

  if (signal.nextMove === "route_to_model") {
    return {
      firstMove: "Route to the best outside model/tool after Embr defines the task.",
      structure: [
        "Summarize the user goal",
        "Choose the needed model/tool",
        "Send only the needed context",
        "Validate the returned answer before responding"
      ],
      shouldAskQuestion: false,
      shouldUseOutsideModel: true,
      shouldCreateArtifact: false,
      riskLevel: "medium"
    };
  }

  return {
    firstMove: "Answer naturally using Embr's selected posture.",
    structure: [
      "Respond directly",
      "Match the user's emotional state",
      "Keep the answer useful",
      "Offer one next step only if helpful"
    ],
    shouldAskQuestion: false,
    shouldUseOutsideModel: signal.needsOutsideModel,
    shouldCreateArtifact: false,
    riskLevel: "low"
  };
}
