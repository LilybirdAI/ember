import type { EmbrMemoryContext } from "./memoryContext";
import type { EmbrSignal } from "./signalDetector";

export type EmbrContextEnhancement = {
  enhancedSignal: EmbrSignal;
  contextNotes: string[];
};

export function enhanceSignalWithMemory(
  signal: EmbrSignal,
  memory: EmbrMemoryContext
): EmbrContextEnhancement {
  const enhancedSignal: EmbrSignal = { ...signal };
  const contextNotes: string[] = [];

  const has = (tag: string) => memory.tags.includes(tag as any);

  // Gina + Google Play/account issues should become client-boundary/business.
  if (has("gina") || has("google_play")) {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = enhancedSignal.urgency === "high" ? "high" : "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected Gina/Google Play context. Treating as business/account-boundary situation."
    );
  }

  // MindShot + Embr should be treated as product/business strategy.
  if (has("mindshot_golf") || has("george")) {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected George/MindShot context. Treating as Embr beta/product strategy."
    );
  }

  // Paul/BeeClean should trigger scope-protection, not emotional repair.
  if (has("paul")) {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected Paul/BeeClean context. Treating as scope mismatch/client-selection lesson."
    );
  }

  // Embr-specific questions should become product/business/planning unless already coding.
  if (has("embr") && signal.taskType !== "coding") {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = enhancedSignal.urgency === "high" ? "high" : "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected Embr context. Treating as product/operator-layer planning."
    );
  }

  // Pricing should always be business/operator.
  if (has("pricing")) {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected pricing context. Treating as business/pricing decision."
    );
  }

  // Client-boundary context should force scope protection.
  if (has("client_boundary")) {
    enhancedSignal.taskType = "business";
    enhancedSignal.posture = "operator";
    enhancedSignal.urgency = enhancedSignal.urgency === "high" ? "high" : "medium";
    enhancedSignal.nextMove = "create_plan";
    enhancedSignal.needsOutsideModel = true;

    contextNotes.push(
      "Detected client-boundary context. Prioritizing scope protection."
    );
  }

  return {
    enhancedSignal,
    contextNotes
  };
}
