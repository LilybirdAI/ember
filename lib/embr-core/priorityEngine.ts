import type { EmbrMemoryContext } from "./memoryContext";
import type { EmbrRecognizedMemory } from "./memoryRecognition";
import type { EmbrSignal } from "./signalDetector";
import type { EmbrInstinct } from "./instinctEngine";

export type EmbrPriority =
  | "stabilize_user"
  | "protect_scope"
  | "finish_paid_work"
  | "solve_technical_issue"
  | "explain_clearly"
  | "protect_business"
  | "build_embr"
  | "respond_normally";

export type EmbrPriorityDecision = {
  primaryPriority: EmbrPriority;
  secondaryPriorities: EmbrPriority[];
  reason: string;
  doFirst: string;
  doNotDo: string[];
};

export function decidePriority(
  memory: EmbrMemoryContext,
  recognizedMemory: EmbrRecognizedMemory,
  signal: EmbrSignal,
  instinct: EmbrInstinct
): EmbrPriorityDecision {
  const tags = memory.tags;

  const emotionalRisk =
    signal.emotionalState === "overwhelmed" ||
    signal.emotionalState === "tired" ||
    signal.emotionalState === "angry" ||
    signal.urgency === "high";

  const clientRisk =
    tags.includes("gina") ||
    tags.includes("paul") ||
    tags.includes("bashen_bastion") ||
    tags.includes("client_boundary") ||
    tags.includes("upwork");

  const appStoreRisk =
    tags.includes("app_store") ||
    tags.includes("google_play");

  const embrBuild =
    tags.includes("embr");

  const pricingRisk =
    tags.includes("pricing");

  if (emotionalRisk && instinct.primaryNeed === "grounding") {
    return {
      primaryPriority: "stabilize_user",
      secondaryPriorities: clientRisk ? ["protect_scope"] : ["respond_normally"],
      reason:
        "The user is emotionally or physically overloaded. Stabilization must come before strategy, code, or business decisions.",
      doFirst:
        "Slow the user down, reassure them, and give one immediate next action.",
      doNotDo: [
        "Do not give a long plan.",
        "Do not hype the situation.",
        "Do not push more work immediately.",
        "Do not route to outside models first."
      ]
    };
  }

  if (clientRisk) {
    return {
      primaryPriority: "protect_scope",
      secondaryPriorities: appStoreRisk
        ? ["protect_business", "finish_paid_work"]
        : ["protect_business"],
      reason:
        recognizedMemory.recognized
          ? `Recognized memory: ${recognizedMemory.recognition}`
          : "Client, contract, Upwork, or scope risk detected.",
      doFirst:
        "Protect the user's scope, reputation, money, and boundaries before solving the client's problem.",
      doNotDo: [
        "Do not absorb extra work for free unless intentionally chosen.",
        "Do not panic-message the client.",
        "Do not promise account ownership, approval, or unlimited support.",
        "Do not blur separate milestones."
      ]
    };
  }

  if (signal.taskType === "coding") {
    return {
      primaryPriority: "solve_technical_issue",
      secondaryPriorities: ["protect_scope"],
      reason:
        "A technical/build issue is present. The best move is controlled execution.",
      doFirst:
        "Work one file, command, or error at a time and ask for output when needed.",
      doNotDo: [
        "Do not touch unrelated systems.",
        "Do not jump ahead.",
        "Do not rewrite everything unless the scope requires it."
      ]
    };
  }

  if (embrBuild) {
    return {
      primaryPriority: "build_embr",
      secondaryPriorities: pricingRisk
        ? ["protect_business"]
        : ["protect_business", "respond_normally"],
      reason:
        "This involves Embr's product direction. Keep the vision grounded in one build step or one proof step.",
      doFirst:
        "Turn the Embr idea into the next concrete architecture, demo, or validation step.",
      doNotDo: [
        "Do not overclaim publicly.",
        "Do not give away equity early.",
        "Do not panic-spend.",
        "Do not build ten layers at once."
      ]
    };
  }

  if (pricingRisk || signal.taskType === "business") {
    return {
      primaryPriority: "protect_business",
      secondaryPriorities: ["protect_scope"],
      reason:
        "Business/pricing decision detected. The answer should protect value and avoid underpricing.",
      doFirst:
        "Define the offer, scope, price, and next step clearly.",
      doNotDo: [
        "Do not underprice complex work.",
        "Do not promise unlimited support.",
        "Do not decide equity or legal commitments impulsively."
      ]
    };
  }

  if (signal.posture === "teacher") {
    return {
      primaryPriority: "explain_clearly",
      secondaryPriorities: ["respond_normally"],
      reason:
        "The user is trying to understand something. The priority is clarity without overwhelm.",
      doFirst:
        "Explain simply with one example and avoid jargon.",
      doNotDo: [
        "Do not use dense technical language.",
        "Do not assume expert knowledge.",
        "Do not over-explain."
      ]
    };
  }

  return {
    primaryPriority: "respond_normally",
    secondaryPriorities: [],
    reason:
      "No urgent memory, client, technical, business, or emotional priority detected.",
    doFirst:
      "Respond naturally and provide one useful next step if helpful.",
    doNotDo: [
      "Do not force productivity.",
      "Do not overcomplicate the answer."
    ]
  };
}
