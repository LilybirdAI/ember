export type EmbrSourceName =
  | "embr_memory"
  | "project_context"
  | "openai"
  | "claude"
  | "perplexity"
  | "grok"
  | "human_confirmation";

export type EmbrSourceRole = {
  source: EmbrSourceName;
  strongSuit: string;
  weakSuit: string;
  useWhen: string[];
  avoidWhen: string[];
};

export type EmbrSourcePlan = {
  selectedSources: EmbrSourceName[];
  sourceRoles: EmbrSourceRole[];
  sourceStrategy: string;
  finalJudgmentRule: string;
};

export const EMBR_SOURCE_REGISTRY: EmbrSourceRole[] = [
  {
    source: "embr_memory",
    strongSuit:
      "User history, project context, preferences, tone, recurring client patterns, and continuity.",
    weakSuit:
      "Current facts, live prices, laws, news, and external events.",
    useWhen: [
      "Known client/project is mentioned",
      "User preference matters",
      "Emotional state or pacing matters",
      "Prior context changes the answer"
    ],
    avoidWhen: [
      "The question needs current facts and memory is not enough"
    ]
  },
  {
    source: "project_context",
    strongSuit:
      "Truth about the current app, repo, files, routes, local code, build errors, and deployment state.",
    weakSuit:
      "Broad strategy without code context, current news, market facts.",
    useWhen: [
      "Coding",
      "Debugging",
      "Vercel/Supabase/App Store project work",
      "File path or build issue matters"
    ],
    avoidWhen: [
      "The user is asking a broad life or news question"
    ]
  },
  {
    source: "openai",
    strongSuit:
      "Builder reasoning, code generation, planning, structured answers, app architecture, technical explanation.",
    weakSuit:
      "Can sound generic if not guided by Embr voice and memory.",
    useWhen: [
      "Build plan needed",
      "Code needed",
      "Complex reasoning needed",
      "Structured answer needed"
    ],
    avoidWhen: [
      "User only needs grounding",
      "Current facts are required before reasoning"
    ]
  },
  {
    source: "claude",
    strongSuit:
      "Critique, clarity, tone review, risk review, detecting weak wording, overpromising, and missing nuance.",
    weakSuit:
      "Should not be the final voice. Can over-polish or soften too much.",
    useWhen: [
      "Final answer needs review",
      "Business/client language has risk",
      "Tone needs refinement",
      "Long answer needs clarity check"
    ],
    avoidWhen: [
      "Tiny direct answer",
      "Emergency/simple grounding moment"
    ]
  },
  {
    source: "perplexity",
    strongSuit:
      "Current facts, news, pricing, market information, recent docs, public sources, comparisons.",
    weakSuit:
      "Should not define Embr's voice or final judgment.",
    useWhen: [
      "Latest/current/recent info",
      "News",
      "API pricing",
      "Legal/policy facts that may change",
      "Market comparison"
    ],
    avoidWhen: [
      "Purely personal guidance",
      "Known local project context"
    ]
  },
  {
    source: "grok",
    strongSuit:
      "Challenger perspective, outside angle, assumption testing, risk spotting, cultural/social pulse.",
    weakSuit:
      "Should not derail the answer or become the final authority.",
    useWhen: [
      "What am I missing?",
      "Business strategy",
      "Big idea reality check",
      "Risk/challenge mode",
      "Alternative angle needed"
    ],
    avoidWhen: [
      "User is overwhelmed and needs calm",
      "Simple factual question already answered"
    ]
  },
  {
    source: "human_confirmation",
    strongSuit:
      "Final approval for money, legal, account ownership, equity, deployment, and high-stakes decisions.",
    weakSuit:
      "Not an AI source. It slows things down but prevents bad moves.",
    useWhen: [
      "Equity",
      "Legal filing",
      "Server spending",
      "Client refunds",
      "Account access",
      "Production deployment"
    ],
    avoidWhen: [
      "Low-risk drafting or simple explanation"
    ]
  }
];

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function planEmbrSources(input: {
  message: string;
  primaryDomain?: string;
  primarySkill?: string;
  knowledgeNeed?: string;
}): EmbrSourcePlan {
  const text = input.message.toLowerCase();

  const needsCurrent = includesAny(text, [
    "news",
    "today",
    "latest",
    "current",
    "recent",
    "pricing",
    "compare",
    "market",
    "law",
    "legal",
    "trademark"
  ]);

  const needsChallenge = includesAny(text, [
    "what am i missing",
    "bigger",
    "big idea",
    "strategy",
    "partner",
    "equity",
    "server",
    "cloud",
    "risk",
    "challenge"
  ]);

  const needsProject = includesAny(text, [
    "code",
    "file",
    "terminal",
    "build",
    "vercel",
    "supabase",
    "xcode",
    "route.ts",
    "repo",
    "deploy"
  ]);

  const needsHuman = includesAny(text, [
    "equity",
    "legal",
    "trademark",
    "server",
    "refund",
    "account access",
    "password",
    "production",
    "deploy"
  ]);

  const emotional = includesAny(text, [
    "no sleep",
    "angry",
    "overwhelmed",
    "can't breathe",
    "cant breathe",
    "freaking out",
    "scared"
  ]);

  const selected = new Set<EmbrSourceName>();

  selected.add("embr_memory");

  if (emotional) {
    return buildPlan(
      ["embr_memory", "human_confirmation"],
      "The user may be overloaded. Use Embr memory and pacing first. Do not widen the pond until the user is stable.",
      "Embr's protective judgment wins. Outside engines should not push the user harder."
    );
  }

  if (needsProject) {
    selected.add("project_context");
    selected.add("openai");
    selected.add("claude");
  }

  if (needsCurrent) {
    selected.add("perplexity");
    selected.add("openai");
    selected.add("claude");
  }

  if (needsChallenge) {
    selected.add("grok");
    selected.add("claude");
    selected.add("openai");
  }

  if (needsHuman) {
    selected.add("human_confirmation");
  }

  if (selected.size === 1) {
    selected.add("openai");
  }

  return buildPlan(
    Array.from(selected),
    "Use the smallest useful pond: memory first, then only the sources that match the question.",
    "Embr decides what survives. No engine becomes the identity or final authority."
  );
}

function buildPlan(
  selectedSources: EmbrSourceName[],
  sourceStrategy: string,
  finalJudgmentRule: string
): EmbrSourcePlan {
  return {
    selectedSources,
    sourceRoles: EMBR_SOURCE_REGISTRY.filter((role) =>
      selectedSources.includes(role.source)
    ),
    sourceStrategy,
    finalJudgmentRule
  };
}
