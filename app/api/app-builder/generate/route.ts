import {
  apiBadRequest,
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/api";
import { createBusinessBlueprint } from "@/lib/appBuilder/blueprint";
import { enhanceBusinessBlueprint } from "@/lib/appBuilder/enhanceBlueprint";
import { renderBusinessApp } from "@/lib/appBuilder/renderBusinessApp";
import { runEmbrOrchestration } from "@/lib/embrBrain/orchestrator";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function hasFile(files: { path: string }[], path: string) {
  return files.some((file) => file.path === path);
}

function validateRenderedApp(app: ReturnType<typeof renderBusinessApp>) {
  const errors: string[] = [];

  const requiredFiles = [
    "package.json",
    "next.config.mjs",
    "next-env.d.ts",
    "tsconfig.json",
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
    "README.md",
  ];

  for (const filePath of requiredFiles) {
    if (!hasFile(app.files, filePath)) {
      errors.push(`Missing required file: ${filePath}`);
    }
  }

  for (const file of app.files) {
    if (!file.path || file.path.includes("..") || file.path.startsWith("/")) {
      errors.push(`Unsafe file path: ${file.path}`);
    }

    if (!file.content.trim()) {
      errors.push(`Empty file: ${file.path}`);
    }

    if (file.content.includes("```")) {
      errors.push(`Markdown code fence found in file: ${file.path}`);
    }
  }

  const pageFile = app.files.find((file) => file.path === "app/page.tsx");

  if (!pageFile?.content.includes("export default function Page")) {
    errors.push("app/page.tsx missing export default function Page.");
  }

  const packageFile = app.files.find((file) => file.path === "package.json");

  if (packageFile) {
    try {
      const parsed = JSON.parse(packageFile.content);

      if (!parsed.scripts?.dev) errors.push("package.json missing dev script.");
      if (!parsed.scripts?.build) errors.push("package.json missing build script.");
      if (!parsed.dependencies?.next) errors.push("package.json missing next dependency.");
      if (!parsed.dependencies?.react) errors.push("package.json missing react dependency.");
      if (!parsed.dependencies?.["react-dom"]) {
        errors.push("package.json missing react-dom dependency.");
      }
    } catch {
      errors.push("package.json is invalid JSON.");
    }
  }

  return errors;
}

async function ensureProjectBelongsToUser(userId: string, projectId: string | null) {
  if (!projectId) return;

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Project not found for this user.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const prompt = cleanString(body.prompt || body.message);
    const projectId = cleanString(body.projectId) || null;

    if (!prompt) {
      return apiBadRequest("Build prompt is required.", {
        output: "Tell Embr what business app you want to build.",
      });
    }

    await ensureProjectBelongsToUser(user.id, projectId);

    const brain = await runEmbrOrchestration(prompt);
    const baseBlueprint = createBusinessBlueprint(prompt);

    const enhancement = await enhanceBusinessBlueprint({
      prompt,
      baseBlueprint,
      brain,
    });

    const renderedApp = renderBusinessApp(enhancement.blueprint);

    const validationErrors = validateRenderedApp(renderedApp);

    if (validationErrors.length > 0) {
      return apiServerError("Generated app failed validation.", {
        output:
          "Embr generated an app, but it failed validation before saving.",
        validationErrors,
        templateId: renderedApp.templateId,
        brain,
        enhancement,
      });
    }

    const { data: generatedApp, error: appInsertError } = await supabaseAdmin
      .from("generated_apps")
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: renderedApp.appName,
        platform: renderedApp.platform,
        framework: renderedApp.framework,
        summary: renderedApp.summary,
        build_prompt: prompt,
        status: "draft",
        preview_html: renderedApp.previewHtml,
        preview_type: renderedApp.previewType,
        preview_notes: `${renderedApp.previewNotes} Template: ${renderedApp.templateId}. Enhanced: ${String(
          enhancement.usedAi
        )}`,
      })
      .select(
        "id, name, platform, framework, status, summary, preview_type, preview_notes, created_at, updated_at"
      )
      .single();

    if (appInsertError) {
      throw appInsertError;
    }

    const fileRows = renderedApp.files.map((file) => ({
      user_id: user.id,
      generated_app_id: generatedApp.id,
      path: file.path,
      content: file.content,
      language: file.language,
      purpose: file.purpose,
    }));

    const { data: files, error: filesInsertError } = await supabaseAdmin
      .from("generated_app_files")
      .insert(fileRows)
      .select("id, path, language, purpose, created_at, updated_at");

    if (filesInsertError) {
      throw filesInsertError;
    }

    return apiOk({
      output: `I created ${renderedApp.appName}, generated a preview, and saved ${renderedApp.files.length} files.`,
      templateId: renderedApp.templateId,
      enhanced: enhancement.usedAi,
      generatedApp,
      files: files || [],
      assumptions: [
        `Business blueprint selected: ${renderedApp.templateId}`,
        `Blueprint enhancement used AI: ${String(enhancement.usedAi)}`,
        "Generated a runnable local-first Next.js business app.",
      ],
      nextSteps: renderedApp.nextSteps,
      rawPlan: {
        templateId: renderedApp.templateId,
        appName: renderedApp.appName,
        platform: renderedApp.platform,
        framework: renderedApp.framework,
        summary: renderedApp.summary,
        brainPlan: brain.plan,
        brainSteps: brain.steps,
        enhancementError: enhancement.error || null,
        files: renderedApp.files.map((file) => ({
          path: file.path,
          language: file.language,
          purpose: file.purpose,
        })),
      },
    });
  } catch (error) {
    console.error("GENERATED APP ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.", {
        output: "You need to log in first.",
      });
    }

    const message = error instanceof Error ? error.message : "";

    if (message.toLowerCase().includes("project not found")) {
      return apiBadRequest("Project not found.", {
        output: "That project could not be found. Reselect the project and try again.",
      });
    }

    return apiServerError("Could not generate app.", {
      output: "Embr could not generate the app. Check the terminal logs.",
    });
  }
}
