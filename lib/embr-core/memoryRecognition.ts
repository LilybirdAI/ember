import type { EmbrMemoryContext, EmbrMemoryTag } from "./memoryContext";

export type EmbrRecognizedMemory = {
  recognized: boolean;
  primaryMemory: EmbrMemoryTag;
  recognition: string;
  rememberedFacts: string[];
  boundaries: string[];
  recommendedFirstMove: string;
};

export function recognizeMemory(memory: EmbrMemoryContext): EmbrRecognizedMemory {
  const has = (tag: EmbrMemoryTag) => memory.tags.includes(tag);

  if (has("gina")) {
    return {
      recognized: true,
      primaryMemory: "gina",
      recognition: "This involves Gina and the remaining publishing/account ownership work.",
      rememberedFacts: [
        "Gina's app/build phase has been moved forward substantially.",
        "Remaining blockers are mostly Google Play/account setup/publishing logistics.",
        "Gina may need gentle, calm communication.",
        "Account ownership and verification must be handled by Gina directly."
      ],
      boundaries: [
        "Do not log in as Gina.",
        "Do not manage or recover her personal passwords.",
        "Do not promise to complete account verification for her.",
        "Guide her step by step, but keep ownership with her."
      ],
      recommendedFirstMove:
        "Respond gently and clearly: close the completed app phase, then guide remaining Google Play steps without taking over her account."
    };
  }

  if (has("george") || has("mindshot_golf")) {
    return {
      recognized: true,
      primaryMemory: has("mindshot_golf") ? "mindshot_golf" : "george",
      recognition: "This involves George/MindShot Golf and may connect to an Embr beta integration.",
      rememberedFacts: [
        "George has been supportive and does not flinch at realistic pricing.",
        "MindShot Golf is a strong Embr use case.",
        "The simple demo is: golf journal entry → mindset analysis → coaching feedback → next-round focus.",
        "George may be business-savvy, but his background still needs to be understood."
      ],
      boundaries: [
        "Do not offer equity too early.",
        "Do not call him a partner before testing fit.",
        "Keep the Embr pitch simple and useful.",
        "Start with beta framing, not a huge platform promise."
      ],
      recommendedFirstMove:
        "Ask for George's perspective and present Embr as a simple MindShot beta workflow, not a giant platform."
    };
  }

  if (has("bashen_bastion")) {
    return {
      recognized: true,
      primaryMemory: "bashen_bastion",
      recognition: "This involves Bashen/Bastion and the iOS-only update/submission scope.",
      rememberedFacts: [
        "The current $300 scope is iOS-only.",
        "Google Play has already removed the app, which is separate from the iOS scope.",
        "Android/Google Play recovery should be a separate milestone.",
        "The goal is to update the iOS app so Apple does not remove it."
      ],
      boundaries: [
        "Do not include Android inside the $300 iOS milestone.",
        "Do not absorb Google Play recovery for free unless intentionally chosen.",
        "Keep the scope written and clear."
      ],
      recommendedFirstMove:
        "Restate that the current milestone is iOS-only and Google Play/Android recovery is a separate scope."
    };
  }

  if (has("paul")) {
    return {
      recognized: true,
      primaryMemory: "paul",
      recognition: "This involves Paul/BeeClean and a prior scope mismatch.",
      rememberedFacts: [
        "Paul/BeeClean was messy and had too many people touching the project.",
        "The requested work was far larger than the tiny milestone.",
        "The contract was refunded and ended.",
        "This should be treated as a client-selection lesson, not a technical failure."
      ],
      boundaries: [
        "Do not reopen the emotional loop.",
        "Do not chase Paul.",
        "Do not accept Paul-type scopes again.",
        "Avoid tiny budgets with messy repos and unclear ownership."
      ],
      recommendedFirstMove:
        "Let Paul go and use the lesson to protect future scope and pricing."
    };
  }

  if (has("embr")) {
    return {
      recognized: true,
      primaryMemory: "embr",
      recognition: "This involves Embr herself: the AI operator/service layer being built.",
      rememberedFacts: [
        "Embr is intended to be her own entity layer, not just a wrapper.",
        "Outside models are engines; Embr owns identity, signal, posture, planning, validation, repair, routing, and memory recognition.",
        "Public language should stay grounded: AI operator layer, workflow intelligence, service layer.",
        "Private build goal is AGI-like operator behavior, but public claims should avoid AGI hype."
      ],
      boundaries: [
        "Do not panic-spend on servers or trademarks tonight.",
        "Do not give away equity early.",
        "Do not overclaim publicly.",
        "Build proof one layer at a time."
      ],
      recommendedFirstMove:
        "Keep building Embr Core carefully, then prove one use case through MindShot Golf or another clear app workflow."
    };
  }

  if (has("upwork")) {
    return {
      recognized: true,
      primaryMemory: "upwork",
      recognition: "This involves Upwork reputation, contracts, milestones, or client communication.",
      rememberedFacts: [
        "Upwork JSS matters.",
        "Clean completions and clear scope protect reputation.",
        "Tiny messy jobs can cost more in reputation than they pay.",
        "Client messages should be direct, scoped, and professional."
      ],
      boundaries: [
        "Do not panic-close contracts.",
        "Do not pressure clients for reviews.",
        "Do not take low-budget vague jobs that risk reputation.",
        "Keep milestone scope explicit."
      ],
      recommendedFirstMove:
        "Protect reputation by completing clear phases, writing scoped messages, and avoiding messy underpriced jobs."
    };
  }

  return {
    recognized: false,
    primaryMemory: "unknown",
    recognition: "No specific known memory was recognized.",
    rememberedFacts: [],
    boundaries: [],
    recommendedFirstMove:
      "Use normal signal, posture, planning, validation, and routing."
  };
}
