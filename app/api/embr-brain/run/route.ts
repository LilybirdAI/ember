import { apiBadRequest, apiOk, apiServerError, apiUnauthorized } from "@/lib/api";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { runEmbrOrchestration } from "@/lib/embrBrain/orchestrator";

export async function POST(req: Request) {
  try {
    await getUserFromRequest(req);

    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return apiBadRequest("Prompt is required.");
    }

    const result = await runEmbrOrchestration(prompt);

    return apiOk({
      result,
    });
  } catch (error) {
    console.error("EMBR ORCHESTRATION ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not run Embr orchestration.", {
      output: error instanceof Error ? error.message : "Unknown error.",
    });
  }
}
