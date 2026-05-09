export type EmbrActionType =
  | "direct_answer"
  | "copy_ready_message"
  | "technical_steps"
  | "pricing_plan"
  | "business_proof_package"
  | "research_summary"
  | "app_review_plan"
  | "grounding_reset"
  | "learning_explanation"
  | "creative_options";

export type EmbrActionPlan = {
  actionType: EmbrActionType;
  outputFormat: string;
  firstMove: string;
  successCriteria: string[];
  mustProduce: string[];
};

export function planEmbrAction(input: {
  message: string;
  primarySkill?: string;
  primaryDomain?: string;
  primaryKnowledgeNeed?: string;
}) {
  const skill = input.primarySkill || "general_support";
  const domain = input.primaryDomain || "general";
  const knowledge = input.primaryKnowledgeNeed || "general_reasoning";

  if (skill === "emotional_grounding") {
    return {
      actionType: "grounding_reset",
      outputFormat: "short direct grounding response",
      firstMove: "Calm the user and reduce pressure before giving any task.",
      successCriteria: [
        "User feels steadier",
        "Only one next action is given",
        "No hype or long plan"
      ],
      mustProduce: [
        "state of the moment",
        "brief reset",
        "one tiny next step"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "client_message") {
    return {
      actionType: "copy_ready_message",
      outputFormat: "copy-paste-ready client message",
      firstMove: "Write the message directly.",
      successCriteria: [
        "User can send it immediately",
        "Tone is professional and human",
        "Scope or next step is clear"
      ],
      mustProduce: [
        "sendable message",
        "clear boundary if needed",
        "next action"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "technical_debugging" || skill === "code_builder") {
    return {
      actionType: "technical_steps",
      outputFormat: "exact technical steps",
      firstMove: "Identify the next command, file, or error to inspect.",
      successCriteria: [
        "One issue at a time",
        "Exact next step is clear",
        "User knows what to run or edit"
      ],
      mustProduce: [
        "file path or command when possible",
        "what to check",
        "how to verify"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "pricing_advice") {
    return {
      actionType: "pricing_plan",
      outputFormat: "price recommendation with scope",
      firstMove: "Separate setup, support, and usage costs.",
      successCriteria: [
        "User has a price/range",
        "Scope is protected",
        "Ongoing support is separated"
      ],
      mustProduce: [
        "recommended price or range",
        "what is included",
        "what is separate"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "business_strategy" || skill === "product_positioning") {
    return {
      actionType: "business_proof_package",
      outputFormat: "business operator answer",
      firstMove: "Translate the idea into proof, positioning, and one next move.",
      successCriteria: [
        "No hype",
        "Clear business move",
        "Proof needed is named",
        "Too-early moves are called out"
      ],
      mustProduce: [
        "real move",
        "what is too early",
        "proof needed",
        "one next step"
      ]
    } satisfies EmbrActionPlan;
  }

  if (domain === "news" || domain === "finance" || knowledge === "current_facts") {
    return {
      actionType: "research_summary",
      outputFormat: "current grounded summary",
      firstMove: "Use current research before answering.",
      successCriteria: [
        "Facts are separated from interpretation",
        "No guessing",
        "Practical meaning is clear"
      ],
      mustProduce: [
        "what happened",
        "why it matters",
        "what it means for the user"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "app_store_review") {
    return {
      actionType: "app_review_plan",
      outputFormat: "platform review next-step plan",
      firstMove: "Identify the platform issue and safest next action.",
      successCriteria: [
        "No promise of approval",
        "Next platform step is clear",
        "Account/scope boundary is protected"
      ],
      mustProduce: [
        "likely issue",
        "what to check",
        "what to send or fix"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "research_summary") {
    return {
      actionType: "research_summary",
      outputFormat: "short research summary",
      firstMove: "Gather the current answer and summarize what matters.",
      successCriteria: [
        "Current facts are used",
        "Answer is not buried in details",
        "Recommendation is practical"
      ],
      mustProduce: [
        "key facts",
        "what matters",
        "recommended move"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "proposal_writer") {
    return {
      actionType: "copy_ready_message",
      outputFormat: "proposal or cover letter",
      firstMove: "Write the client-facing proposal directly.",
      successCriteria: [
        "Answers the client",
        "Sounds confident",
        "Protects scope"
      ],
      mustProduce: [
        "proposal text",
        "scope-safe language",
        "next step"
      ]
    } satisfies EmbrActionPlan;
  }

  if (skill === "general_support" && domain === "learning") {
    return {
      actionType: "learning_explanation",
      outputFormat: "simple teaching answer",
      firstMove: "Explain the concept simply.",
      successCriteria: [
        "No jargon overload",
        "User understands the basic idea",
        "One useful example is included"
      ],
      mustProduce: [
        "simple definition",
        "example",
        "why it matters"
      ]
    } satisfies EmbrActionPlan;
  }

  return {
    actionType: "direct_answer",
    outputFormat: "clear direct answer",
    firstMove: "Answer the actual question without overcomplicating.",
    successCriteria: [
      "Answer is direct",
      "Tone fits the moment",
      "One useful next step if needed"
    ],
    mustProduce: [
      "direct answer",
      "practical next step if useful"
    ]
  } satisfies EmbrActionPlan;
}
