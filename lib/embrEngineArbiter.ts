import type { EmbrEngineResults } from "@/lib/embrEngineRunner";

export type EmbrArbiterDecision = {
  acceptedSignals: string[];
  rejectedSignals: string[];
  strongestEngine: "openai" | "claude" | "perplexity" | "grok" | "embr";
  finalGuidance: string;
  shouldRemember: boolean;
  memoryCandidate: string;
};

function hasUsefulText(text?: string): boolean {
  if (!text) return false;
  const cleaned = text.trim().toLowerCase();
  return cleaned.length > 20 &&
    !cleaned.includes("not needed") &&
    !cleaned.includes("missing");
}

export function arbitrateEngineResults(input: {
  userMessage: string;
  embrNativeDraft: string;
  engineResults: EmbrEngineResults;
}): EmbrArbiterDecision {
  const acceptedSignals: string[] = [];
  const rejectedSignals: string[] = [];

  const openaiText = input.engineResults.openai?.text || "";
  const claudeText = input.engineResults.claude?.text || "";
  const perplexityText = input.engineResults.perplexity?.text || "";
  const grokText = input.engineResults.grok?.text || "";

  if (hasUsefulText(openaiText)) {
    acceptedSignals.push("OpenAI provided usable reasoning or draft structure.");
  }

  if (hasUsefulText(claudeText)) {
    acceptedSignals.push("Claude provided critique that may improve clarity, risk control, or tone.");
  }

  if (hasUsefulText(perplexityText)) {
    acceptedSignals.push("Perplexity provided current research or factual checking.");
  } else {
    rejectedSignals.push("Perplexity did not add needed value for this message.");
  }

  if (hasUsefulText(grokText)) {
    acceptedSignals.push("Grok provided challenger notes or an outside-angle risk check.");
  } else {
    rejectedSignals.push("Grok did not add needed value for this message.");
  }

  const message = input.userMessage.toLowerCase();

  const isEmotional =
    message.includes("tired") ||
    message.includes("angry") ||
    message.includes("overwhelmed") ||
    message.includes("can't breathe") ||
    message.includes("no sleep");

  const isBusiness =
    message.includes("charge") ||
    message.includes("pricing") ||
    message.includes("client") ||
    message.includes("scope") ||
    message.includes("business") ||
    message.includes("partner") ||
    message.includes("equity");

  const isResearch =
    message.includes("latest") ||
    message.includes("current") ||
    message.includes("research") ||
    message.includes("compare");

  let strongestEngine: EmbrArbiterDecision["strongestEngine"] = "embr";

  if (isEmotional) {
    strongestEngine = "embr";
  } else if (isResearch && hasUsefulText(perplexityText)) {
    strongestEngine = "perplexity";
  } else if (isBusiness && hasUsefulText(grokText)) {
    strongestEngine = "grok";
  } else if (hasUsefulText(claudeText)) {
    strongestEngine = "claude";
  } else if (hasUsefulText(openaiText)) {
    strongestEngine = "openai";
  }

  const finalGuidance =
    strongestEngine === "embr"
      ? "Use Embr's native read as the anchor. Keep the answer grounded, human, and direct."
      : strongestEngine === "perplexity"
        ? "Use Perplexity for current facts, but let Embr decide what matters."
        : strongestEngine === "grok"
          ? "Use Grok's challenge to catch missing risks or assumptions, but do not let it derail the answer."
          : strongestEngine === "claude"
            ? "Use Claude's critique to sharpen the answer and remove generic or risky wording."
            : "Use OpenAI's draft for structure, but rewrite through Embr's voice.";

  const shouldRemember =
    isBusiness ||
    message.includes("embr") ||
    message.includes("worked") ||
    message.includes("better") ||
    message.includes("not there yet");

  const memoryCandidate = shouldRemember
    ? `For similar future messages, strongest engine was ${strongestEngine}. Embr should ${finalGuidance}`
    : "";

  return {
    acceptedSignals,
    rejectedSignals,
    strongestEngine,
    finalGuidance,
    shouldRemember,
    memoryCandidate,
  };
}
