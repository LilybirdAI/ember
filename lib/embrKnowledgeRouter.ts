export type EmbrKnowledgeSource =
  | "embr_memory"
  | "openai_reasoning"
  | "claude_review"
  | "perplexity_current_research"
  | "grok_challenge"
  | "project_context"
  | "user_files_later"
  | "human_confirmation";

export type EmbrKnowledgeNeed =
  | "current_facts"
  | "technical_reasoning"
  | "business_judgment"
  | "legal_caution"
  | "financial_caution"
  | "emotional_grounding"
  | "creative_expansion"
  | "daily_life_help"
  | "client_context"
  | "project_memory"
  | "general_reasoning";

export type EmbrKnowledgeRoute = {
  primaryNeed: EmbrKnowledgeNeed;
  sources: EmbrKnowledgeSource[];
  why: string;
  mustVerify: string[];
  mustNotDo: string[];
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function routeEmbrKnowledge(message: string): EmbrKnowledgeRoute {
  const text = message.toLowerCase();

  const current =
    includesAny(text, [
      "today",
      "latest",
      "current",
      "news",
      "recent",
      "now",
      "market",
      "pricing",
      "compare",
      "what happened",
    ]);

  const legal =
    includesAny(text, [
      "legal",
      "law",
      "trademark",
      "contract",
      "terms",
      "policy",
      "compliance",
      "rights",
    ]);

  const finance =
    includesAny(text, [
      "stock",
      "invest",
      "investment",
      "market",
      "crypto",
      "price",
      "budget",
      "revenue",
      "profit",
      "cost",
    ]);

  const technical =
    includesAny(text, [
      "code",
      "bug",
      "error",
      "terminal",
      "xcode",
      "typescript",
      "api",
      "supabase",
      "vercel",
      "build failed",
      "route.ts",
    ]);

  const business =
    includesAny(text, [
      "business",
      "client",
      "charge",
      "pricing",
      "scope",
      "milestone",
      "proposal",
      "partner",
      "equity",
      "server",
      "cloud",
      "embr",
      "what am i missing",
    ]);

  const emotional =
    includesAny(text, [
      "overwhelmed",
      "angry",
      "scared",
      "no sleep",
      "slept one hour",
      "freaking out",
      "can't breathe",
      "cant breathe",
      "crashing",
    ]);

  const creative =
    includesAny(text, [
      "idea",
      "brand",
      "design",
      "logo",
      "voice",
      "story",
      "image",
      "sketch",
      "name",
    ]);

  const daily =
    includesAny(text, [
      "food",
      "eat",
      "sleep",
      "movie",
      "roommate",
      "sober house",
      "schedule",
      "groceries",
      "travel",
      "hotel",
    ]);

  if (emotional) {
    return {
      primaryNeed: "emotional_grounding",
      sources: ["embr_memory", "embr_memory"],
      why:
        "The user may be overloaded. Embr should stabilize first before pulling in outside engines.",
      mustVerify: ["Is the user asking for action, comfort, or both?"],
      mustNotDo: [
        "Do not over-research.",
        "Do not call every engine.",
        "Do not create a huge plan.",
      ],
    };
  }

  if (current || legal || finance) {
    return {
      primaryNeed: legal
        ? "legal_caution"
        : finance
          ? "financial_caution"
          : "current_facts",
      sources: [
        "perplexity_current_research",
        "openai_reasoning",
        "claude_review",
        "grok_challenge",
      ],
      why:
        "This may require current information or careful factual grounding before Embr answers.",
      mustVerify: [
        "Current facts",
        "Uncertainty",
        "Risk",
        "Practical meaning for the user",
      ],
      mustNotDo: [
        "Do not guess current facts.",
        "Do not make guarantees.",
        "Do not present legal/financial info as final professional advice.",
      ],
    };
  }

  if (technical) {
    return {
      primaryNeed: "technical_reasoning",
      sources: ["project_context", "openai_reasoning", "claude_review"],
      why:
        "The user needs technical execution. Embr should use project context and builder reasoning, then review for mistakes.",
      mustVerify: [
        "Exact file or command",
        "Build/test step",
        "Scope of the change",
      ],
      mustNotDo: [
        "Do not touch unrelated files.",
        "Do not rewrite everything.",
        "Do not skip verification.",
      ],
    };
  }

  if (business) {
    return {
      primaryNeed: "business_judgment",
      sources: [
        "embr_memory",
        "openai_reasoning",
        "claude_review",
        "grok_challenge",
      ],
      why:
        "This needs judgment, scope protection, positioning, pricing, or strategy.",
      mustVerify: [
        "What is the real move?",
        "What is too early?",
        "What proof is needed?",
        "What is the risk?",
      ],
      mustNotDo: [
        "Do not hype.",
        "Do not jump to servers/equity/legal spend too early.",
        "Do not answer only with build advice.",
      ],
    };
  }

  if (creative) {
    return {
      primaryNeed: "creative_expansion",
      sources: ["embr_memory", "openai_reasoning", "grok_challenge"],
      why:
        "This needs creative options, but Embr should still choose a grounded direction.",
      mustVerify: [
        "Does the idea fit Embr?",
        "Is it usable?",
        "Is it too broad?",
      ],
      mustNotDo: [
        "Do not create random ideas with no direction.",
        "Do not overcomplicate.",
      ],
    };
  }

  if (daily) {
    return {
      primaryNeed: "daily_life_help",
      sources: ["embr_memory", "openai_reasoning"],
      why:
        "This is ordinary life help. Embr should be practical and human, not overly business or therapy-focused.",
      mustVerify: ["What is the simplest useful answer?"],
      mustNotDo: [
        "Do not over-therapize.",
        "Do not force productivity.",
        "Do not turn everything into a business plan.",
      ],
    };
  }

  return {
    primaryNeed: "general_reasoning",
    sources: ["embr_memory", "openai_reasoning"],
    why:
      "No specialized knowledge need detected. Embr should answer directly and use outside reasoning only if useful.",
    mustVerify: ["What is the user actually asking?"],
    mustNotDo: ["Do not overcomplicate."],
  };
}
