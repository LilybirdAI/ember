import { apiBadRequest, apiOk, apiServerError, apiUnauthorized } from "@/lib/api";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";

async function askPerplexity(message: string) {
  if (process.env.ENABLE_PERPLEXITY !== "true") {
    return null;
  }

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are Embr's research engine. Give concise current research with practical business relevance.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Perplexity request failed.");
  }

  return {
    provider: "perplexity",
    text: data.choices?.[0]?.message?.content || "",
  };
}

async function askClaude(message: string) {
  if (process.env.ENABLE_CLAUDE !== "true") {
    return null;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
      max_tokens: 1000,
      system:
        "You are Embr's critic engine. Be direct. Identify weaknesses, missing assumptions, and how to improve the answer or product.",
      messages: [
        {
          role: "user",
          content: message,
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
      ?.map((item: { type: string; text?: string }) =>
        item.type === "text" ? item.text || "" : ""
      )
      .join("")
      .trim() || "";

  return {
    provider: "claude",
    text,
  };
}

export async function POST(req: Request) {
  try {
    await getUserFromRequest(req);

    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return apiBadRequest("Message is required.");
    }

    const [research, critic] = await Promise.all([
      askPerplexity(message),
      askClaude(message),
    ]);

    return apiOk({
      message,
      research,
      critic,
    });
  } catch (error) {
    console.error("EMBR BRAIN TEST ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not run Embr brain test.", {
      output: error instanceof Error ? error.message : "Unknown error.",
    });
  }
}
