import { buildFinalResponseInstructionBlock } from "./embr-core/finalResponseRules";
type EngineName = "openai" | "claude" | "perplexity" | "grok";

type EngineResult = {
  engine: EngineName;
  ok: boolean;
  text: string;
  error?: string;
};

export type EmbrEngineResults = {
  openai?: EngineResult;
  claude?: EngineResult;
  perplexity?: EngineResult;
  grok?: EngineResult;
};

async function callClaudeReview(input: {
  userMessage: string;
  embrNativeDraft: string;
  openAiDraft: string;
}): Promise<EngineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Claude_API_KEY;

  if (!apiKey) {
    return { engine: "claude", ok: false, text: "", error: "Claude key missing." };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
        max_tokens: 900,
        system:
          "You are Claude acting only as a critic/reviewer for Embr. Do not write the final answer. Identify what is too generic, risky, unclear, overpromised, or not Embr-like. Keep it concise.",
        messages: [
          {
            role: "user",
            content: `User message:
${input.userMessage}

Embr native draft:
${input.embrNativeDraft}

OpenAI draft:
${input.openAiDraft}

Review this. What should Embr keep, remove, sharpen, or rewrite?`,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { engine: "claude", ok: false, text: "", error: JSON.stringify(data) };
    }

    const text =
      data.content?.map((part: any) => part.text || "").join("\n").trim() || "";

    return { engine: "claude", ok: true, text };
  } catch (error) {
    return {
      engine: "claude",
      ok: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown Claude error.",
    };
  }
}

async function callPerplexityResearch(input: {
  userMessage: string;
  embrSummary: string;
}): Promise<EngineResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return { engine: "perplexity", ok: false, text: "", error: "Perplexity key missing." };
  }

  const shouldResearch =
    /\b(current|latest|today|recent|research|compare|pricing|api cost|trademark|legal|market|competitor|news)\b/i.test(
      input.userMessage
    );

  if (!shouldResearch) {
    return {
      engine: "perplexity",
      ok: true,
      text: "Research not needed for this message.",
    };
  }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL || "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are Perplexity used only for current research/checking. Return concise facts and sources if relevant. Do not write the final Embr answer.",
          },
          {
            role: "user",
            content: `User message:
${input.userMessage}

Embr read:
${input.embrSummary}

Find any current facts needed to answer safely. If no research is needed, say so.`,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { engine: "perplexity", ok: false, text: "", error: JSON.stringify(data) };
    }

    const text = data.choices?.[0]?.message?.content || "";

    return { engine: "perplexity", ok: true, text };
  } catch (error) {
    return {
      engine: "perplexity",
      ok: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown Perplexity error.",
    };
  }
}

async function callGrokChallenge(input: {
  userMessage: string;
  embrNativeDraft: string;
  openAiDraft: string;
}): Promise<EngineResult> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return { engine: "grok", ok: false, text: "", error: "xAI/Grok key missing." };
  }

  const shouldChallenge =
    /\b(embr|business|pricing|charge|quote|partner|equity|server|cloud|strategy|big idea|what am i missing|challenge|risk|scope|client|agi|platform)\b/i.test(
      input.userMessage
    );

  if (!shouldChallenge) {
    return {
      engine: "grok",
      ok: true,
      text: "Grok challenge not needed for this message.",
    };
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4.3",
        messages: [
          {
            role: "system",
            content:
              "You are Grok used only as Embr's challenger engine. Do not write the final answer. Challenge assumptions, spot risks, give the outside angle, and say what might be missing. Be concise.",
          },
          {
            role: "user",
            content: `User message:
${input.userMessage}

Embr native draft:
${input.embrNativeDraft}

OpenAI draft:
${input.openAiDraft}

Challenge this. What is missing, risky, overhyped, underpriced, or worth reconsidering?`,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { engine: "grok", ok: false, text: "", error: JSON.stringify(data) };
    }

    const text = data.choices?.[0]?.message?.content || "";

    return { engine: "grok", ok: true, text };
  } catch (error) {
    return {
      engine: "grok",
      ok: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown Grok error.",
    };
  }
}

export async function runEmbrEngines(input: {
  userMessage: string;
  embrSummary: string;
  embrNativeDraft: string;
  openAiDraft: string;
}): Promise<EmbrEngineResults> {
  const [claude, perplexity, grok] = await Promise.all([
    callClaudeReview({
      userMessage: input.userMessage,
      embrNativeDraft: input.embrNativeDraft,
      openAiDraft: input.openAiDraft,
    }),
    callPerplexityResearch({
      userMessage: input.userMessage,
      embrSummary: input.embrSummary,
    }),
    callGrokChallenge({
      userMessage: input.userMessage,
      embrNativeDraft: input.embrNativeDraft,
      openAiDraft: input.openAiDraft,
    }),
  ]);

  return {
    openai: {
      engine: "openai",
      ok: true,
      text: input.openAiDraft,
    },
    claude,
    perplexity,
    grok,
  };
}

export function buildFinalEmbrInstruction(input: {
  userMessage: string;
  embrNativeDraft: string;
  openAiDraft: string;
  claudeReview?: string;
  perplexityResearch?: string;
  grokChallenge?: string;
}) {
  const learnedResponseRules = buildFinalResponseInstructionBlock();

  return `You are Embr. Write the final answer.

User message:
${input.userMessage}

Embr native draft:
${input.embrNativeDraft}

OpenAI draft:
${input.openAiDraft}

Claude review/critique:
${input.claudeReview || "No Claude review available."}

Perplexity research/current check:
${input.perplexityResearch || "No Perplexity research needed or available."}

Grok challenger notes:
${input.grokChallenge || "No Grok challenge needed or available."}

${learnedResponseRules || "No learned response rules available."}

Final answer rules:
- The final answer must sound like Embr, not generic AI.
- Use Embr's native draft as the emotional/voice anchor.
- Use OpenAI for useful reasoning/details.
- Use Claude's critique to remove generic, risky, weak, or overdone language.
- Use Perplexity only for current factual support when relevant.
- Use Grok as the challenger: consider what might be missing, risky, overhyped, underpriced, or weak.
- Do not mention internal engines, routing, OpenAI, Claude, Grok, or Perplexity unless the user explicitly asks.
- Be direct, practical, grounded, and useful.
- If the user is tired, overwhelmed, or angry, calm and focus them before giving tasks.
- If this is business/client work, protect scope, money, time, and reputation.
- If a Business operator read is present, use it directly.
- If an Embr skill is selected, obey that skill's output goal, must-include list, and must-avoid list.
- For business questions, answer these clearly: the real move, what is too early, the risk, proof needed, and the next concrete step.
- Do not answer business questions only with "keep building." Translate the build into proof, positioning, pricing, client value, or scope.
- If this is coding, give exact next steps.`;
}
