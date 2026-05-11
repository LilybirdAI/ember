export type PerplexityResult = {
  provider: "perplexity";
  model: string;
  text: string;
  citations: unknown[];
};

export async function runPerplexityResearch({
  prompt,
  purpose,
}: {
  prompt: string;
  purpose: string;
}): Promise<PerplexityResult | null> {
  if (process.env.ENABLE_PERPLEXITY !== "true") {
    return null;
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Missing PERPLEXITY_API_KEY.");
  }

  const model = process.env.PERPLEXITY_MODEL || "sonar";

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Embr's research engine. Be concise, practical, current, and business-focused. Focus on real workflows, fields, risks, and useful domain context. Do not be generic.",
        },
        {
          role: "user",
          content: `Research purpose:
${purpose}

User request:
${prompt}`,
        },
      ],
      max_tokens: 1400,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Perplexity request failed.");
  }

  return {
    provider: "perplexity",
    model,
    text: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}
