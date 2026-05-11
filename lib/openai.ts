import OpenAI from "openai";

let cachedOpenAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedOpenAIClient) {
    return cachedOpenAIClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  cachedOpenAIClient = new OpenAI({
    apiKey,
  });

  return cachedOpenAIClient;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient() as any;
    const value = client[prop as keyof OpenAI];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
