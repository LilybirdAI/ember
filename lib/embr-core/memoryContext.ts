export type EmbrMemoryTag =
  | "gina"
  | "george"
  | "mindshot_golf"
  | "bashen_bastion"
  | "paul"
  | "upwork"
  | "app_store"
  | "google_play"
  | "embr"
  | "pricing"
  | "client_boundary"
  | "unknown";

export type EmbrMemoryContext = {
  tags: EmbrMemoryTag[];
  summary: string;
  knownContext: string[];
  cautions: string[];
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function getMemoryContext(message: string): EmbrMemoryContext {
  const text = message.toLowerCase();

  const tags: EmbrMemoryTag[] = [];
  const knownContext: string[] = [];
  const cautions: string[] = [];

  if (includesAny(text, ["gina"])) {
    tags.push("gina");
    knownContext.push(
      "Gina is a client whose app phase is largely complete, but Google Play/account ownership steps remain."
    );
    cautions.push(
      "Do not offer to log into or recover Gina's personal Google/Apple accounts. Guide her, but she must handle ownership and verification."
    );
  }

  if (includesAny(text, ["george"])) {
    tags.push("george");
    knownContext.push(
      "George is a supportive client/contact who may be a good person to discuss Embr or MindShot Golf with."
    );
    cautions.push(
      "Do not offer partnership or equity too early. Gather background and test fit first."
    );
  }

  if (includesAny(text, ["mindshot", "mindshot golf"])) {
    tags.push("mindshot_golf");
    knownContext.push(
      "MindShot Golf is a strong candidate for an Embr beta integration: journal entry → mindset analysis → coaching feedback → next-round focus."
    );
    cautions.push(
      "For George/MindShot, consider beta pricing first, not a full platform price."
    );
  }

  if (includesAny(text, ["bashen", "bastion", "buchon"])) {
    tags.push("bashen_bastion");
    knownContext.push(
      "Bashen/Bastion is the iOS app update/submission scope. Google Play removal is a separate Android/Google Play recovery scope."
    );
    cautions.push(
      "Keep the $300 scope iOS-only unless a separate Android/Google Play milestone is created."
    );
  }

  if (includesAny(text, ["paul", "beeclean"])) {
    tags.push("paul");
    knownContext.push(
      "Paul/BeeClean was a scope mismatch: too much messy SwiftUI/Figma/onboarding work for a tiny milestone."
    );
    cautions.push(
      "Do not reopen Paul emotionally. Use it as a client-selection lesson."
    );
  }

  if (includesAny(text, ["upwork", "jss", "job success", "review", "milestone", "contract"])) {
    tags.push("upwork");
    knownContext.push(
      "Upwork reputation matters. Prioritize clean completions, clear scope, and avoiding messy underpriced jobs."
    );
    cautions.push(
      "Do not panic-close contracts or pressure clients for feedback."
    );
  }

  if (includesAny(text, ["app store", "apple", "testflight", "app review"])) {
    tags.push("app_store");
    knownContext.push(
      "App Store work is a core service lane: submissions, rejections, TestFlight, review issues, metadata, and IAP."
    );
    cautions.push(
      "Avoid promising approval. Offer audit, fixes, submission support, and clear next steps."
    );
  }

  if (includesAny(text, ["google play", "android", "play console"])) {
    tags.push("google_play");
    knownContext.push(
      "Google Play work is separate from iOS/App Store scope unless explicitly included."
    );
    cautions.push(
      "Do not mix Android/Google Play recovery into an iOS-only milestone."
    );
  }

  if (includesAny(text, ["embr", "amber", "agi", "operator layer", "service layer"])) {
    tags.push("embr");
    knownContext.push(
      "Embr is being built as an AI operator/service layer for apps and businesses, not just a standalone app."
    );
    cautions.push(
      "Use grounded language publicly: AI operator layer, workflow intelligence, service layer. Avoid public AGI claims."
    );
  }

  if (includesAny(text, ["charge", "pricing", "quote", "proposal", "retainer", "setup fee"])) {
    tags.push("pricing");
    knownContext.push(
      "Pricing should protect scope and value: beta pricing for trusted early clients, real setup/monthly pricing for normal clients."
    );
    cautions.push(
      "Do not underprice complex integrations or absorb unlimited support."
    );
  }

  if (includesAny(text, ["scope", "boundary", "refund", "too much", "not included"])) {
    tags.push("client_boundary");
    knownContext.push(
      "Scope boundaries protect money, reputation, and sanity."
    );
    cautions.push(
      "State what is included, what is separate, and what requires a new milestone."
    );
  }

  if (tags.length === 0) {
    tags.push("unknown");
  }

  return {
    tags,
    summary:
      tags[0] === "unknown"
        ? "No specific stored project context detected."
        : `Detected context for: ${tags.join(", ")}`,
    knownContext,
    cautions
  };
}
