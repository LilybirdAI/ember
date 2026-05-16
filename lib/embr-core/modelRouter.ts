import type { EmbrSignal } from "./signalDetector";
import type { EmbrResponseDirection } from "./responseDirector";

export type EmbrModelRoute =
  | "embr_direct"
  | "openai_reasoning"
  | "claude_review"
  | "perplexity_research"
  | "multi_model"
  | "tool_action"
  | "human_needed";

export type EmbrEngineStep = {
  engine:
    | "embr_core"
    | "openai"
    | "claude"
    | "perplexity"
    | "grok"
    | "tool"
    | "human";
  role: string;
};

export type EmbrRoutingDecision = {
  route: EmbrModelRoute;
  reason: string;
  enginePlan: EmbrEngineStep[];
  shouldUseOutsideModel: boolean;
  requiresHumanApproval: boolean;
};
function shouldEscalateToReview(signal: EmbrSignal): boolean {
  return (
    signal.urgency === "high" ||
    signal.taskType === "coding" ||
    signal.taskType === "business" ||
    signal.emotionalState === "stressed" ||
    signal.emotionalState === "overwhelmed"
  );
}
export function chooseModelRoute(
  signal: EmbrSignal,
  direction: EmbrResponseDirection
): EmbrRoutingDecision {
  // Protector / grounding mode should stay Embr-native first.
  if (direction.mode === "grounding") {
    return {
      route: "embr_direct",
      reason: "User needs grounding and emotional stabilization before any outside model.",
      enginePlan: [
        {
          engine: "embr_core",
          role: "Ground the user and provide one immediate next step."
        }
      ],
      shouldUseOutsideModel: false,
      requiresHumanApproval: false
    };
  }

  // Client messages can often be handled directly by Embr.
  if (direction.mode === "client_message") {
    return {
      route: "embr_direct",
      reason: "Client communication can be generated from Embr's tone, scope, and boundary rules.",
      enginePlan: [
        {
          engine: "embr_core",
          role: "Write copy-ready client message using Embr's closer posture."
        }
      ],
      shouldUseOutsideModel: false,
      requiresHumanApproval: false
    };
  }

  // Technical build/debugging: OpenAI builds the plan, Claude can review if needed.
  if (direction.mode === "technical_plan") {
    return {
      route: "multi_model",
      reason: "Technical work benefits from builder reasoning plus optional critique/review.",
      enginePlan: [
        {
          engine: "embr_core",
          role: "Define task, scope, posture, and constraints before routing."
        },
        {
          engine: "openai",
          role: "Generate technical plan, code reasoning, commands, or implementation path."
        },
        {
          engine: "claude",
          role: "Review the plan for missed risks, unclear assumptions, or safer implementation."
        },
        {
          engine: "embr_core",
          role: "Validate, simplify, and return one clear Embr answer."
        }
      ],
      shouldUseOutsideModel: true,
      requiresHumanApproval: false
    };
  }

  // Business planning: OpenAI reasons, Claude critiques, Embr decides.
 if (direction.mode === "business_plan") {
  const enginePlan: EmbrEngineStep[] = [
    {
      engine: "embr_core",
      role: "Protect scope, pricing, reputation, user stability, and business goal."
    },
    {
      engine: "openai",
      role: "Generate strategic options, pricing logic, or next-step plan."
    }
  ];

  if (shouldEscalateToReview(signal)) {
    enginePlan.push({
      engine: "claude",
      role: "Critique for overpromising, weak positioning, scope risk, or bad incentives."
    });
  }

  if (signal.urgency === "high") {
    enginePlan.push({
      engine: "grok",
      role: "Challenge the plan with a blunt alternate take and identify what may be missing."
    });
  }

  enginePlan.push({
    engine: "embr_core",
    role: "Choose the best grounded answer and respond as Embr."
  });

  return {
    route: shouldEscalateToReview(signal) ? "multi_model" : "openai_reasoning",
    reason: shouldEscalateToReview(signal)
      ? "Business decision has enough risk to benefit from review."
      : "Business request can be handled with reasoning and Embr final voice.",
    enginePlan,
    shouldUseOutsideModel: true,
    requiresHumanApproval: false
  };
}

  // Teaching: OpenAI explains, Claude can simplify/review if needed.
  if (direction.mode === "teaching") {
    return {
      route: "multi_model",
      reason: "Teaching benefits from clear explanation and review for simplicity.",
      enginePlan: [
        {
          engine: "embr_core",
          role: "Determine user level and choose teacher posture."
        },
        {
          engine: "openai",
          role: "Explain the concept clearly with examples."
        },
        {
          engine: "claude",
          role: "Review for clarity, tone, and beginner-friendliness."
        },
        {
          engine: "embr_core",
          role: "Return the final explanation in Embr's voice."
        }
      ],
      shouldUseOutsideModel: true,
      requiresHumanApproval: false
    };
  }

  // Research/current information: Perplexity first, then reasoning/review if needed.
  if (signal.taskType === "research") {
    return {
      route: "perplexity_research",
      reason: "Research tasks need current external information and source grounding.",
      enginePlan: [
        {
          engine: "embr_core",
          role: "Define the research question and what evidence is needed."
        },
        {
          engine: "perplexity",
          role: "Gather current information and sources."
        },
        {
          engine: "openai",
          role: "Synthesize findings into a practical answer if needed."
        },
        {
          engine: "embr_core",
          role: "Validate relevance and respond as Embr."
        }
      ],
      shouldUseOutsideModel: true,
      requiresHumanApproval: false
    };
  }

  // Default fallback.
  return {
    route: signal.needsOutsideModel ? "multi_model" : "embr_direct",
    reason: signal.needsOutsideModel
      ? "Signal indicates outside reasoning may improve the answer."
      : "Embr can handle this directly from her native rules.",
    enginePlan: signal.needsOutsideModel
      ? [
          {
            engine: "embr_core",
            role: "Define the moment, posture, and response goal."
          },
          {
            engine: "openai",
            role: "Generate reasoning or draft response."
          },
          {
            engine: "embr_core",
            role: "Validate and respond as Embr."
          }
        ]
      : [
          {
            engine: "embr_core",
            role: "Respond directly using Embr's native rules."
          }
        ],
    shouldUseOutsideModel: signal.needsOutsideModel,
    requiresHumanApproval: false
  };
}
