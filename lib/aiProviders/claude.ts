export type ClaudeCritiqueResult = {
  provider: "claude";
  model: string;
  text: string;
};

type ClaudeContentBlock = {
  type: string;
  text?: string;
};

export async function runClaudeCritique({
  prompt,
  context,
}: {
  prompt: string;
  context: string;
}): Promise<ClaudeCritiqueResult | null> {
  if (process.env.ENABLE_CLAUDE !== "true") {
    return null;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }

  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      system:
        "You are Embr's critic engine. Be direct and useful. Find weak routing, missing domain-specific logic, generic output, unclear assumptions, fragile implementation, and anything that would make the result feel like a toy demo. Do not flatter. Do not rewrite unless needed.",
      messages: [
        {
          role: "user",
          content: `Original user request:
${prompt}

Current Embr context / plan:
${context}

Critique this. What is weak? What is missing? What must Embr do to make the result professional and useful?`,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Claude request failed.");
  }

  const text =
    data.content
      ?.map((item: ClaudeContentBlock) =>
        item.type === "text" ? item.text || "" : ""
      )
      .join("")
      .trim() || "";

  return {
    provider: "claude",
    model,
    text,
  };
}
