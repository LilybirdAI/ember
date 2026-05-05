import { apiOk, apiUnauthorized } from "@/lib/api";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";

export async function GET(req: Request) {
  try {
    await getUserFromRequest(req);

    return apiOk({
      providers: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        perplexity: {
          enabled: process.env.ENABLE_PERPLEXITY === "true",
          hasKey: Boolean(process.env.PERPLEXITY_API_KEY),
          model: process.env.PERPLEXITY_MODEL || "not set",
        },
        claude: {
          enabled: process.env.ENABLE_CLAUDE === "true",
          hasKey: Boolean(process.env.ANTHROPIC_API_KEY),
          model: process.env.CLAUDE_MODEL || "not set",
        },
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    throw error;
  }
}
