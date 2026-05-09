export type EmbrDomain =
  | "business"
  | "coding"
  | "app_store"
  | "news"
  | "current_events"
  | "finance"
  | "legal_policy"
  | "health_safety"
  | "daily_life"
  | "food"
  | "travel"
  | "learning"
  | "relationships"
  | "creative"
  | "emotional_support"
  | "general";

export type EmbrDomainRead = {
  primaryDomain: EmbrDomain;
  secondaryDomains: EmbrDomain[];
  needsCurrentInfo: boolean;
  preferredEngine: "embr" | "openai" | "claude" | "perplexity" | "grok";
  domainGoal: string;
  answerStyle: string;
  cautions: string[];
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function readEmbrDomain(message: string): EmbrDomainRead {
  const text = message.toLowerCase();

  const news = includesAny(text, [
    "news",
    "headline",
    "today",
    "latest",
    "current event",
    "what happened",
    "breaking",
    "world",
    "politics",
    "war",
    "election",
    "market today"
  ]);

  const finance = includesAny(text, [
    "stock",
    "market",
    "invest",
    "portfolio",
    "crypto",
    "price target",
    "earnings",
    "revenue",
    "profit",
    "interest rate",
    "inflation"
  ]);

  const legalPolicy = includesAny(text, [
    "law",
    "legal",
    "policy",
    "trademark",
    "contract",
    "rights",
    "terms",
    "regulation",
    "compliance"
  ]);

  const healthSafety = includesAny(text, [
    "doctor",
    "medical",
    "health",
    "pain",
    "infection",
    "sleep",
    "crash",
    "unsafe",
    "emergency"
  ]);

  const dailyLife = includesAny(text, [
    "roommate",
    "sober house",
    "laundry",
    "groceries",
    "schedule",
    "budget",
    "rent",
    "sleep",
    "movie",
    "food"
  ]);

  const food = includesAny(text, [
    "eat",
    "food",
    "meal",
    "dinner",
    "cook",
    "chef",
    "recipe",
    "vegetarian"
  ]);

  const travel = includesAny(text, [
    "travel",
    "flight",
    "hotel",
    "country",
    "visa",
    "passport",
    "move overseas",
    "serbia",
    "georgia",
    "tanzania"
  ]);

  const learning = includesAny(text, [
    "teach me",
    "explain",
    "learn",
    "study",
    "course",
    "training",
    "beginner",
    "i don't understand",
    "i dont understand"
  ]);

  const relationships = includesAny(text, [
    "friend",
    "partner",
    "relationship",
    "family",
    "client is upset",
    "apologize",
    "pushed too hard"
  ]);

  const creative = includesAny(text, [
    "idea",
    "design",
    "name",
    "brand",
    "story",
    "sketch",
    "image",
    "logo",
    "voice",
    "character"
  ]);

  const coding = includesAny(text, [
    "code",
    "xcode",
    "terminal",
    "typescript",
    "swift",
    "react",
    "next",
    "build failed",
    "api",
    "repo"
  ]);

  const appStore = includesAny(text, [
    "app store",
    "testflight",
    "apple review",
    "google play",
    "play console",
    "rejected",
    "guideline"
  ]);

  const business = includesAny(text, [
    "business",
    "client",
    "charge",
    "price",
    "proposal",
    "upwork",
    "scope",
    "milestone",
    "partner",
    "equity",
    "server",
    "cloud",
    "embr"
  ]);

  const emotional = includesAny(text, [
    "overwhelmed",
    "freaking out",
    "angry",
    "scared",
    "no sleep",
    "can't breathe",
    "cant breathe",
    "crashed"
  ]);

  if (news) {
    return {
      primaryDomain: "news",
      secondaryDomains: finance ? ["finance"] : legalPolicy ? ["legal_policy"] : [],
      needsCurrentInfo: true,
      preferredEngine: "perplexity",
      domainGoal:
        "Give current, grounded news context with clear separation between facts, uncertainty, and practical meaning.",
      answerStyle:
        "Current, sourced, concise, and not sensational.",
      cautions: [
        "Do not guess current facts.",
        "Do not turn news into panic.",
        "Use current research before answering."
      ]
    };
  }

  if (finance) {
    return {
      primaryDomain: "finance",
      secondaryDomains: news ? ["news"] : business ? ["business"] : [],
      needsCurrentInfo: true,
      preferredEngine: "perplexity",
      domainGoal:
        "Explain financial information clearly and separate facts from opinion.",
      answerStyle:
        "Grounded, numbers-aware, cautious, and practical.",
      cautions: [
        "Do not give guaranteed investment claims.",
        "Use current data when prices or markets matter.",
        "Clarify risk."
      ]
    };
  }

  if (legalPolicy) {
    return {
      primaryDomain: "legal_policy",
      secondaryDomains: business ? ["business"] : [],
      needsCurrentInfo: true,
      preferredEngine: "perplexity",
      domainGoal:
        "Give careful legal/policy direction without pretending to be the user's lawyer.",
      answerStyle:
        "Careful, specific, and process-focused.",
      cautions: [
        "Do not give final legal conclusions.",
        "Recommend professional help when stakes are high.",
        "Use current sources when laws/policies may have changed."
      ]
    };
  }

  if (appStore) {
    return {
      primaryDomain: "app_store",
      secondaryDomains: business ? ["business"] : coding ? ["coding"] : [],
      needsCurrentInfo: false,
      preferredEngine: "openai",
      domainGoal:
        "Diagnose App Store / Google Play / publishing issues and give the cleanest next step.",
      answerStyle:
        "Direct, procedural, and scope-safe.",
      cautions: [
        "Do not promise approval.",
        "Do not overstate certainty.",
        "Keep client/account ownership boundaries clear."
      ]
    };
  }

  if (coding) {
    return {
      primaryDomain: "coding",
      secondaryDomains: business ? ["business"] : [],
      needsCurrentInfo: false,
      preferredEngine: "openai",
      domainGoal:
        "Help build, debug, or ship software one controlled step at a time.",
      answerStyle:
        "Exact, technical, and step-by-step.",
      cautions: [
        "Do not touch unrelated systems.",
        "Do not skip build/test verification.",
        "Ask for output when needed."
      ]
    };
  }

  if (business) {
    return {
      primaryDomain: "business",
      secondaryDomains: creative ? ["creative"] : legalPolicy ? ["legal_policy"] : [],
      needsCurrentInfo: false,
      preferredEngine: "grok",
      domainGoal:
        "Make grounded business decisions: proof, positioning, pricing, scope, and risk.",
      answerStyle:
        "Operator-minded, direct, and protective of value.",
      cautions: [
        "Do not hype.",
        "Do not jump to servers/equity/legal spend too early.",
        "Translate ideas into proof and positioning."
      ]
    };
  }

  if (healthSafety || emotional) {
    return {
      primaryDomain: emotional ? "emotional_support" : "health_safety",
      secondaryDomains: dailyLife ? ["daily_life"] : [],
      needsCurrentInfo: false,
      preferredEngine: "embr",
      domainGoal:
        "Stabilize the person first, then give one useful next step.",
      answerStyle:
        "Steady, protective, short, and practical.",
      cautions: [
        "Do not overwhelm.",
        "Do not overdiagnose.",
        "If urgent safety/medical risk appears, recommend real help."
      ]
    };
  }

  if (dailyLife || food || travel || learning || relationships || creative) {
    const primary =
      food ? "food" :
      travel ? "travel" :
      learning ? "learning" :
      relationships ? "relationships" :
      creative ? "creative" :
      "daily_life";

    return {
      primaryDomain: primary,
      secondaryDomains: [],
      needsCurrentInfo: travel,
      preferredEngine: travel ? "perplexity" : "embr",
      domainGoal:
        "Help with ordinary life clearly and usefully, without making everything therapy or business.",
      answerStyle:
        "Natural, practical, human, and simple.",
      cautions: [
        "Do not force a business frame.",
        "Do not over-therapize.",
        "Give useful everyday help."
      ]
    };
  }

  return {
    primaryDomain: "general",
    secondaryDomains: [],
    needsCurrentInfo: false,
    preferredEngine: "embr",
    domainGoal:
      "Answer the actual question directly and use the right amount of help.",
    answerStyle:
      "Clear, grounded, useful.",
    cautions: [
      "Do not overcomplicate.",
      "Do not force the answer into business or mental health."
    ]
  };
}
