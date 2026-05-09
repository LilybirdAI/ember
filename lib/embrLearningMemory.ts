export type EmbrLearningCategory =
  | "response_style"
  | "business_judgment"
  | "engine_performance"
  | "user_preference"
  | "project_pattern"
  | "safety_pacing"
  | "not_worth_remembering";

export type EmbrLearningMemory = {
  shouldRemember: boolean;
  category: EmbrLearningCategory;
  confidence: number;
  memoryText: string;
  reason: string;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function createLearningMemoryCandidate(input: {
  userMessage: string;
  finalAnswer: string;
  strongestEngine?: string;
  primarySkill?: string;
  primaryDomain?: string;
  primaryKnowledgeNeed?: string;
}): EmbrLearningMemory {
  const message = input.userMessage.toLowerCase();
  const answer = input.finalAnswer.toLowerCase();

  const business =
    includesAny(message, [
      "charge",
      "pricing",
      "business",
      "client",
      "scope",
      "partner",
      "equity",
      "server",
      "cloud",
      "trademark",
      "what am i missing",
      "bigger than an app",
    ]);

  const emotionalPacing =
    includesAny(message, [
      "no sleep",
      "slept one hour",
      "angry",
      "overwhelmed",
      "scared",
      "can't breathe",
      "cant breathe",
      "crashing",
    ]);

  const userPreference =
    includesAny(message, [
      "i like",
      "i don't like",
      "i dont like",
      "don't say",
      "dont say",
      "say it like",
      "too generic",
      "sounds better",
      "not there yet",
      "needs to be smarter",
    ]);

  const projectPattern =
    includesAny(message, [
      "gina",
      "george",
      "mindshot",
      "bashen",
      "bastion",
      "paul",
      "beeclean",
      "upwork",
      "app store",
      "google play",
      "embr",
    ]);

  const enginePerformance =
    includesAny(message, [
      "openai",
      "claude",
      "perplexity",
      "grok",
      "engine",
      "multi-engine",
      "strongest engine",
    ]);

  if (emotionalPacing) {
    return {
      shouldRemember: true,
      category: "safety_pacing",
      confidence: 92,
      memoryText:
        "When the user is sleep-deprived, angry, overwhelmed, or afraid of losing momentum, Embr should stabilize first, reduce pressure, and give one tiny next action instead of pushing harder.",
      reason:
        "This pattern affects user safety, quality of work, and Embr's response style.",
    };
  }

  if (business) {
    return {
      shouldRemember: true,
      category: "business_judgment",
      confidence: 88,
      memoryText:
        "For Embr business questions, avoid hype and translate the idea into proof, positioning, pricing, risk, and one concrete next step.",
      reason:
        "Business/operator judgment is core to Embr's value and should improve over time.",
    };
  }

  if (userPreference) {
    return {
      shouldRemember: true,
      category: "user_preference",
      confidence: 84,
      memoryText:
        "The user prefers Embr to sound direct, grounded, less generic, and more instinctive. Embr should avoid canned AI language and use practical, human, decisive wording.",
      reason:
        "The user is actively shaping Embr's voice and this should influence future answers.",
    };
  }

  if (projectPattern) {
    return {
      shouldRemember: true,
      category: "project_pattern",
      confidence: 82,
      memoryText:
        "When a known project/client is mentioned, Embr should use memory recognition first and protect context, scope, and next action.",
      reason:
        "Known project context should make Embr feel more continuous and less generic.",
    };
  }

  if (enginePerformance) {
    return {
      shouldRemember: true,
      category: "engine_performance",
      confidence: 78,
      memoryText:
        `For similar ${input.primaryDomain || "general"} / ${input.primarySkill || "unknown"} messages, strongest engine was ${input.strongestEngine || "unknown"}. Embr should compare engine output and keep final judgment herself.`,
      reason:
        "This helps Embr learn which engine is useful for different situations.",
    };
  }

  if (answer.includes("you’re running hot") || answer.includes("protecting the engine")) {
    return {
      shouldRemember: true,
      category: "response_style",
      confidence: 76,
      memoryText:
        "The phrase style around 'running hot,' 'control not pressure,' and 'protecting the engine' fits Embr's steady protector voice.",
      reason:
        "This response style tested well and should be reused in similar grounding moments.",
    };
  }

  return {
    shouldRemember: false,
    category: "not_worth_remembering",
    confidence: 30,
    memoryText: "",
    reason:
      "No durable learning signal detected. Do not store random or one-off details.",
  };
}
