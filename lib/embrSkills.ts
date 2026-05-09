export type EmbrSkill =
  | "emotional_grounding"
  | "client_message"
  | "scope_protection"
  | "pricing_advice"
  | "business_strategy"
  | "app_store_review"
  | "technical_debugging"
  | "code_builder"
  | "research_summary"
  | "proposal_writer"
  | "memory_recognition"
  | "product_positioning"
  | "general_support";

export type EmbrSkillDecision = {
  primarySkill: EmbrSkill;
  secondarySkills: EmbrSkill[];
  whyThisSkill: string;
  outputGoal: string;
  mustInclude: string[];
  mustAvoid: string[];
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function chooseEmbrSkill(message: string): EmbrSkillDecision {
  const text = message.toLowerCase();

  const emotional =
    includesAny(text, [
      "i can't breathe",
      "cant breathe",
      "freaking out",
      "overwhelmed",
      "no sleep",
      "slept one hour",
      "angry",
      "scared",
      "panic",
      "crashing",
    ]);

  const clientMessage =
    includesAny(text, [
      "write a message",
      "send him",
      "send her",
      "reply to",
      "text him",
      "text her",
      "email them",
    ]);

  const scope =
    includesAny(text, [
      "scope",
      "milestone",
      "not included",
      "refund",
      "contract",
      "upwork",
      "client wants",
      "separate scope",
    ]);

  const pricing =
    includesAny(text, [
      "charge",
      "price",
      "pricing",
      "quote",
      "retainer",
      "monthly",
      "setup fee",
      "how much",
    ]);

  const business =
    includesAny(text, [
      "business",
      "partner",
      "equity",
      "trademark",
      "server",
      "cloud",
      "strategy",
      "what am i missing",
      "next grounded",
      "bigger than an app",
      "platform",
      "embr",
    ]);

  const appStore =
    includesAny(text, [
      "app store",
      "apple review",
      "testflight",
      "app review",
      "rejected",
      "guideline",
      "google play",
      "play console",
    ]);

  const technical =
    includesAny(text, [
      "error",
      "xcode",
      "terminal",
      "build failed",
      "npm",
      "next build",
      "typescript",
      "api",
      "route.ts",
      "supabase",
      "vercel",
    ]);

  const codeBuild =
    includesAny(text, [
      "build this",
      "create file",
      "write code",
      "replace file",
      "add function",
      "make component",
      "swiftui",
      "react",
      "next.js",
    ]);

  const research =
    includesAny(text, [
      "research",
      "current",
      "latest",
      "compare",
      "look up",
      "find out",
      "market",
      "competitor",
    ]);

  const proposal =
    includesAny(text, [
      "proposal",
      "cover letter",
      "upwork proposal",
      "bid",
      "client offer",
    ]);

  const positioning =
    includesAny(text, [
      "positioning",
      "what does embr do",
      "how do i explain",
      "pitch",
      "tagline",
      "value proposition",
      "one sentence",
    ]);

  if (emotional) {
    return {
      primarySkill: "emotional_grounding",
      secondarySkills: technical ? ["technical_debugging"] : business ? ["business_strategy"] : [],
      whyThisSkill:
        "The user is emotionally or physically overloaded. Stabilize before solving.",
      outputGoal:
        "Calm the user, reduce pressure, and give one tiny next action.",
      mustInclude: [
        "Name the state clearly",
        "Tell them to pause briefly",
        "Give one small next step",
        "Protect sleep/body if relevant",
      ],
      mustAvoid: [
        "Do not hype",
        "Do not give a long plan",
        "Do not push more work immediately",
      ],
    };
  }

  if (clientMessage) {
    return {
      primarySkill: "client_message",
      secondarySkills: scope ? ["scope_protection"] : business ? ["business_strategy"] : [],
      whyThisSkill:
        "The user needs copy-ready words to send, not abstract advice.",
      outputGoal:
        "Write a clear, sendable message that protects tone and scope.",
      mustInclude: [
        "Copy-ready message",
        "Professional but human tone",
        "Clear next step",
      ],
      mustAvoid: [
        "Do not over-explain",
        "Do not sound desperate",
        "Do not weaken the boundary",
      ],
    };
  }

  if (scope) {
    return {
      primarySkill: "scope_protection",
      secondarySkills: pricing ? ["pricing_advice"] : ["business_strategy"],
      whyThisSkill:
        "There is client, milestone, contract, or boundary risk.",
      outputGoal:
        "Protect scope, money, time, and reputation while keeping the relationship professional.",
      mustInclude: [
        "What is included",
        "What is separate",
        "What requires a new milestone",
      ],
      mustAvoid: [
        "Do not absorb extra work by default",
        "Do not promise unlimited support",
        "Do not blame the client emotionally",
      ],
    };
  }

  if (pricing) {
    return {
      primarySkill: "pricing_advice",
      secondarySkills: ["business_strategy", "scope_protection"],
      whyThisSkill:
        "The user is making a value/money decision.",
      outputGoal:
        "Define the offer, price logic, scope, and next step.",
      mustInclude: [
        "Setup vs monthly support",
        "What is included",
        "What is separate",
        "Recommended price or range if enough context exists",
      ],
      mustAvoid: [
        "Do not underprice complex work",
        "Do not offer unlimited support",
        "Do not price infrastructure like a simple prompt",
      ],
    };
  }

  if (appStore) {
    return {
      primarySkill: "app_store_review",
      secondarySkills: scope ? ["scope_protection"] : ["client_message"],
      whyThisSkill:
        "The message involves App Store, Google Play, review, or publishing risk.",
      outputGoal:
        "Diagnose the review/status issue and give the safest next move.",
      mustInclude: [
        "What the platform issue likely is",
        "What to check next",
        "What to say or submit if needed",
      ],
      mustAvoid: [
        "Do not promise approval",
        "Do not guess guideline details if unknown",
        "Do not take over client account ownership",
      ],
    };
  }

  if (technical || codeBuild) {
    return {
      primarySkill: codeBuild ? "code_builder" : "technical_debugging",
      secondarySkills: ["scope_protection"],
      whyThisSkill:
        "The user needs technical execution, not broad theory.",
      outputGoal:
        "Give exact next steps, file paths, commands, or code.",
      mustInclude: [
        "One issue at a time",
        "Exact file/command when possible",
        "Ask for output only if needed",
      ],
      mustAvoid: [
        "Do not touch unrelated systems",
        "Do not rewrite everything unless needed",
        "Do not skip verification",
      ],
    };
  }

  if (research) {
    return {
      primarySkill: "research_summary",
      secondarySkills: business ? ["business_strategy"] : [],
      whyThisSkill:
        "The user needs current or comparative information.",
      outputGoal:
        "Use research engines when needed and summarize the useful answer.",
      mustInclude: [
        "Current facts",
        "Clear comparison if relevant",
        "Practical recommendation",
      ],
      mustAvoid: [
        "Do not invent current facts",
        "Do not bury the answer in links",
      ],
    };
  }

  if (proposal) {
    return {
      primarySkill: "proposal_writer",
      secondarySkills: pricing ? ["pricing_advice"] : ["scope_protection"],
      whyThisSkill:
        "The user needs a client-facing proposal or bid.",
      outputGoal:
        "Write a clear proposal that answers the client and protects scope.",
      mustInclude: [
        "Direct answer",
        "Relevant experience",
        "Scope-safe next step",
        "Professional signoff when useful",
      ],
      mustAvoid: [
        "Do not sound too salesy",
        "Do not overpromise",
        "Do not race to the bottom on price",
      ],
    };
  }

  if (positioning || business) {
    return {
      primarySkill: positioning ? "product_positioning" : "business_strategy",
      secondarySkills: ["pricing_advice", "scope_protection"],
      whyThisSkill:
        "The user is making a business, product, positioning, or strategy decision.",
      outputGoal:
        "Turn the idea into proof, positioning, pricing, or a controlled next move.",
      mustInclude: [
        "The real business move",
        "What is too early",
        "What proof is needed",
        "One concrete next step",
      ],
      mustAvoid: [
        "Do not hype",
        "Do not jump to servers/equity/legal spend too soon",
        "Do not answer only with build advice",
      ],
    };
  }

  return {
    primarySkill: "general_support",
    secondarySkills: [],
    whyThisSkill:
      "No specialized skill was clearly required.",
    outputGoal:
      "Answer directly and helpfully with one useful next step if needed.",
    mustInclude: [
      "Direct answer",
      "Grounded tone",
    ],
    mustAvoid: [
      "Do not overcomplicate",
      "Do not force productivity",
    ],
  };
}
