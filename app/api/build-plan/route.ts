import OpenAI from "openai";
import {
  apiBadRequest,
  apiOk,
  apiServerError,
  apiTooManyRequests,
  apiUnauthorized,
} from "@/lib/api";
import { getHeavyModel } from "@/lib/aiConfig";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { getEmbrProductState } from "@/lib/embrProductState";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkMonthlyUsageLimit, logUsageEvent } from "@/lib/usage";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function parseJsonOutput(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Build plan was not valid JSON.");
  }
}

async function loadProjectContext(userId: string, projectId: string | null) {
  if (!projectId) {
    return "No active project selected.";
  }

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, type, summary, status, updated_at")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!project) {
    return "Selected project was not found for this user.";
  }

  return `
Active Project:
- ID: ${project.id}
- Name: ${project.name}
- Type: ${project.type}
- Status: ${project.status}
- Summary: ${project.summary || "No summary yet."}
- Last Updated: ${project.updated_at || "Unknown"}
`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiServerError("Missing OpenAI API key.", {
        output: "Embr is missing an OPENAI_API_KEY.",
      });
    }

    const user = await getUserFromRequest(req);

    const usageStatus = await checkMonthlyUsageLimit(user.id);

    if (!usageStatus.allowed) {
      return apiTooManyRequests("Monthly usage limit reached.", {
        output:
          "You’ve reached your monthly Embr usage limit. Upgrade or wait until your usage resets.",
        used: usageStatus.used,
        limit: usageStatus.limit,
        remaining: usageStatus.remaining,
      });
    }

    const body = await req.json();

    const prompt = cleanString(body.prompt || body.message);
    const projectId = cleanString(body.projectId) || null;
    const preferredPlatform = cleanString(body.platform, "unknown") || "unknown";

    if (!prompt) {
      return apiBadRequest("Build prompt is required.", {
        output: "Tell Embr what app you want to build.",
      });
    }

    const projectContext = await loadProjectContext(user.id, projectId);
    const model = getHeavyModel();

    const instructions = `
You are Embr's App Builder Core.

Your job is to turn a raw app idea into a structured build plan.

Do not write a vague brainstorming answer.
Do not ask unnecessary questions if you can make reasonable assumptions.
If important details are missing, include assumptions and make the plan usable anyway.

Return valid JSON only. No markdown. No code fences.

The JSON must match this shape:

{
  "appName": "string",
  "platform": "web | ios | android | cross_platform | full_stack | unknown",
  "summary": "string",
  "assumptions": ["string"],
  "coreFeatures": ["string"],
  "screens": [
    {
      "name": "string",
      "purpose": "string",
      "keyElements": ["string"]
    }
  ],
  "dataModels": [
    {
      "name": "string",
      "fields": [
        {
          "name": "string",
          "type": "string",
          "notes": "string"
        }
      ]
    }
  ],
  "apiRoutes": [
    {
      "method": "GET | POST | PATCH | DELETE | NONE",
      "path": "string",
      "purpose": "string"
    }
  ],
  "filePlan": [
    {
      "path": "string",
      "purpose": "string"
    }
  ],
  "buildPhases": [
    {
      "phase": 1,
      "name": "string",
      "tasks": ["string"]
    }
  ],
  "firstFilesToBuild": ["string"],
  "risks": ["string"],
  "nextAction": "string"
}

Rules:
- Prefer practical buildable plans.
- For web apps, assume Next.js + TypeScript unless told otherwise.
- For iOS apps, assume SwiftUI unless told otherwise.
- For Android/cross-platform, assume Flutter unless told otherwise.
- For full-stack apps, include frontend, backend, database, auth, and deployment.
- Keep scope realistic.
- Make the first build step obvious.
- Protect against scope creep.
- Think like a builder, not a generic assistant.

${getEmbrProductState()}
`;

    const responseOptions: any = {
      model,
      instructions,
      input: `
Preferred platform: ${preferredPlatform}

${projectContext}

User build prompt:
${prompt}
`,
      max_output_tokens: 5000,
    };

    if (model.startsWith("gpt-5")) {
      responseOptions.reasoning = {
        effort: "high",
      };
    }

    const response = await client.responses.create(responseOptions);

    const raw = response.output_text || "";

    let plan: unknown = null;
    let parsed = true;

    try {
      plan = parseJsonOutput(raw);
    } catch {
      parsed = false;
    }

    try {
      await logUsageEvent({
        userId: user.id,
        conversationId: null,
        model,
        usage: response.usage,
      });
    } catch (usageError) {
      console.error("BUILD PLAN USAGE LOGGING ERROR:", usageError);
    }

    return apiOk({
      parsed,
      plan,
      raw,
      model,
    });
  } catch (error) {
    console.error("BUILD PLAN ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not generate build plan.", {
      output: "Embr could not generate a build plan. Check the terminal logs.",
    });
  }
}
