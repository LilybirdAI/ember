export type BusinessOperatorRead = {
  isBusinessQuestion: boolean;
  businessMode:
    | "pricing"
    | "partner"
    | "equity"
    | "trademark"
    | "server"
    | "product_direction"
    | "client_scope"
    | "unknown";
  realMove: string;
  tooEarly: string[];
  risks: string[];
  proofNeeded: string[];
  nextStep: string;
};

export function readBusinessOperator(message: string): BusinessOperatorRead {
  const text = message.toLowerCase();

  const pricing =
    text.includes("charge") ||
    text.includes("price") ||
    text.includes("pricing") ||
    text.includes("quote") ||
    text.includes("retainer") ||
    text.includes("monthly");

  const partner =
    text.includes("partner") ||
    text.includes("business person") ||
    text.includes("operator") ||
    text.includes("cofounder");

  const equity =
    text.includes("equity") ||
    text.includes("percentage") ||
    text.includes("ownership") ||
    text.includes("shares");

  const trademark =
    text.includes("trademark") ||
    text.includes("brand protection") ||
    text.includes("name protection");

  const server =
    text.includes("server") ||
    text.includes("cloud") ||
    text.includes("hosting") ||
    text.includes("space");

  const clientScope =
    text.includes("client") ||
    text.includes("scope") ||
    text.includes("milestone") ||
    text.includes("contract") ||
    text.includes("refund");

  const productDirection =
    text.includes("embr") ||
    text.includes("bigger than an app") ||
    text.includes("platform") ||
    text.includes("what am i missing") ||
    text.includes("next grounded") ||
    text.includes("business move");

  if (!pricing && !partner && !equity && !trademark && !server && !clientScope && !productDirection) {
    return {
      isBusinessQuestion: false,
      businessMode: "unknown",
      realMove: "No specific business operator issue detected.",
      tooEarly: [],
      risks: [],
      proofNeeded: [],
      nextStep: "Answer normally."
    };
  }

  if (server) {
    return {
      isBusinessQuestion: true,
      businessMode: "server",
      realMove:
        "Do not buy dedicated servers yet. Use Vercel, Supabase, and API engines until traffic, cost, or backend limits prove you need more.",
      tooEarly: [
        "Dedicated servers",
        "Large cloud commitments",
        "GPU infrastructure",
        "Complex DevOps"
      ],
      risks: [
        "Spending before proof",
        "Creating maintenance burden",
        "Confusing infrastructure with product progress"
      ],
      proofNeeded: [
        "Stable live demo",
        "Actual users",
        "Usage numbers",
        "Clear cost problem"
      ],
      nextStep:
        "Keep Embr on Vercel/Supabase for now and add usage tracking before buying infrastructure."
    };
  }

  if (equity || partner) {
    return {
      isBusinessQuestion: true,
      businessMode: equity ? "equity" : "partner",
      realMove:
        "Do not give equity yet. Test the person as an advisor, contractor, or operator first.",
      tooEarly: [
        "Equity promises",
        "Handshake partner deals",
        "Calling someone a cofounder before pressure-testing them"
      ],
      risks: [
        "Giving away control too early",
        "Confusing excitement with contribution",
        "Creating legal/business mess before proof"
      ],
      proofNeeded: [
        "They understand Embr",
        "They bring clients, structure, money, legal help, or operational strength",
        "They perform under pressure",
        "They improve the business without creating chaos"
      ],
      nextStep:
        "Have a conversation, learn their background, and offer only an advisor/trial role first."
    };
  }

  if (trademark) {
    return {
      isBusinessQuestion: true,
      businessMode: "trademark",
      realMove:
        "Trademark research matters, but do not panic-file tonight. First confirm name risk and basic availability.",
      tooEarly: [
        "Expensive legal spend while emotional",
        "Filing without a proper search",
        "Assuming the name is clear without checking"
      ],
      risks: [
        "Wasting money",
        "Choosing a name with conflict",
        "Over-focusing on legal before product proof"
      ],
      proofNeeded: [
        "Basic name search",
        "Domain/social consistency",
        "Product positioning",
        "Revenue or serious launch intent"
      ],
      nextStep:
        "Do a basic trademark/name search and save legal filing for a calm business block."
    };
  }

  if (pricing) {
    return {
      isBusinessQuestion: true,
      businessMode: "pricing",
      realMove:
        "Separate setup from monthly support. Do not price Embr like a single AI call; price it like product infrastructure.",
      tooEarly: [
        "Unlimited support",
        "Cheap custom integrations",
        "One flat price for everything"
      ],
      risks: [
        "Underpricing complex work",
        "Absorbing API/support costs",
        "Setting a low anchor for future clients"
      ],
      proofNeeded: [
        "One clear use case",
        "Setup scope",
        "Monthly support scope",
        "Usage/cost assumptions"
      ],
      nextStep:
        "Package one offer: setup fee, monthly support, what is included, and what is separate."
    };
  }

  if (clientScope) {
    return {
      isBusinessQuestion: true,
      businessMode: "client_scope",
      realMove:
        "Protect scope first. Help the client, but separate new work into a new milestone.",
      tooEarly: [
        "Doing extra platform work for free",
        "Taking account ownership",
        "Promising approval or unlimited fixes"
      ],
      risks: [
        "Reputation damage",
        "Unpaid work",
        "Scope creep",
        "Client dependency"
      ],
      proofNeeded: [
        "Written scope",
        "Current blocker",
        "Client responsibility",
        "Separate milestone if needed"
      ],
      nextStep:
        "State what is included, what is separate, and the clean next step."
    };
  }

  return {
    isBusinessQuestion: true,
    businessMode: "product_direction",
    realMove:
      "The next business move is a proof package, not hype: one demo, one use case, one price, one buyer/person to test it, and one simple explanation.",
    tooEarly: [
      "Public AGI claims",
      "Servers",
      "Equity",
      "Big legal spend",
      "Overbuilding before proof"
    ],
    risks: [
      "Staying inside the build instead of proving value",
      "Explaining the technology instead of the result",
      "Making Embr sound too abstract"
    ],
    proofNeeded: [
      "One live demo",
      "One real use case",
      "One clear before/after result",
      "One pricing package",
      "One person who understands the value"
    ],
    nextStep:
      "Create the first Embr proof package: what she does, who it helps, what result it creates, and what it costs."
  };
}
