import type { EmbrMemoryContext } from "./memoryContext";
import type { EmbrSignal } from "./signalDetector";
import type { EmbrResponseDirection } from "./responseDirector";
import type { EmbrRoutingDecision } from "./modelRouter";

export type EmbrInstinct = {
  read: string;
  primaryNeed:
    | "grounding"
    | "clarity"
    | "execution"
    | "protection"
    | "learning"
    | "strategy"
    | "connection";
  instinctiveMove:
    | "slow_down"
    | "write_it_for_them"
    | "give_commands"
    | "protect_scope"
    | "teach_simply"
    | "make_plan"
    | "reflect_and_support";
  confidence: number; // 0-100
  warningFlags: string[];
};

export function readInstinct(
  message: string,
  memory: EmbrMemoryContext,
  signal: EmbrSignal,
  direction: EmbrResponseDirection,
  route: EmbrRoutingDecision
): EmbrInstinct {
  const text = message.toLowerCase();
  const warningFlags: string[] = [];

  const hasMemory = memory.tags.length > 0 && !memory.tags.includes("unknown");
  const hasClientRisk =
    memory.tags.includes("gina") ||
    memory.tags.includes("paul") ||
    memory.tags.includes("bashen_bastion") ||
    memory.tags.includes("client_boundary") ||
    text.includes("scope") ||
    text.includes("refund") ||
    text.includes("contract");

  const hasBuildRisk =
    text.includes("terminal") ||
    text.includes("xcode") ||
    text.includes("build failed") ||
    text.includes("repo") ||
    text.includes("api");

  const hasEmotionalRisk =
    signal.emotionalState === "overwhelmed" ||
    signal.emotionalState === "tired" ||
    signal.emotionalState === "angry" ||
    signal.urgency === "high";

  if (hasEmotionalRisk) {
    warningFlags.push("User may be emotionally overloaded or physically tired.");
  }

  if (hasClientRisk) {
    warningFlags.push("Client/scope/reputation risk detected.");
  }

  if (hasBuildRisk) {
    warningFlags.push("Technical execution risk detected. Work one step at a time.");
  }

  if (memory.cautions.length > 0) {
    warningFlags.push("Stored caution exists for this context.");
  }

  if (signal.nextMove === "slow_user_down") {
    return {
      read: "The user needs stabilization before strategy or execution.",
      primaryNeed: "grounding",
      instinctiveMove: "slow_down",
      confidence: 95,
      warningFlags
    };
  }

  if (direction.mode === "client_message") {
    return {
      read: "The user needs words they can send, not a long explanation.",
      primaryNeed: "execution",
      instinctiveMove: "write_it_for_them",
      confidence: 92,
      warningFlags
    };
  }

  if (direction.mode === "technical_plan") {
    return {
      read: "The user needs a controlled technical path with exact next steps.",
      primaryNeed: "execution",
      instinctiveMove: "give_commands",
      confidence: 90,
      warningFlags
    };
  }

  if (hasClientRisk || direction.mode === "business_plan") {
    return {
      read: hasMemory
        ? "This is connected to known business/client context and needs careful scope protection."
        : "This is a business decision and needs a grounded next step.",
      primaryNeed: "protection",
      instinctiveMove: "protect_scope",
      confidence: 88,
      warningFlags
    };
  }

  if (direction.mode === "teaching") {
    return {
      read: "The user is trying to understand something and needs a simple explanation.",
      primaryNeed: "learning",
      instinctiveMove: "teach_simply",
      confidence: 86,
      warningFlags
    };
  }

  if (memory.tags.includes("embr")) {
    return {
      read: "This is about Embr's product direction and should be handled as strategy, not hype.",
      primaryNeed: "strategy",
      instinctiveMove: "make_plan",
      confidence: 84,
      warningFlags
    };
  }

  return {
    read: "The user likely needs a grounded, useful response with one next step.",
    primaryNeed: "connection",
    instinctiveMove: "reflect_and_support",
    confidence: route.shouldUseOutsideModel ? 72 : 80,
    warningFlags
  };
}
