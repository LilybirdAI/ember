type ProjectType =
  | "website"
  | "ios_app"
  | "android_app"
  | "full_stack_app"
  | "content"
  | "general";

type AiMode = "auto" | "light" | "heavy";
type ReasoningEffort = "low" | "medium" | "high";

export function normalizeAiMode(value: unknown): AiMode {
  if (value === "light" || value === "heavy" || value === "auto") {
    return value;
  }

  return "auto";
}

export function getHeavyModel() {
  return process.env.OPENAI_HEAVY_MODEL || process.env.OPENAI_MODEL || "gpt-5.5";
}

export function getLightModel() {
  return process.env.OPENAI_LIGHT_MODEL || "gpt-5.4-mini";
}

export function getModel() {
  return getHeavyModel();
}

function isDeepWork({
  projectType,
  message,
  hasActiveProject,
}: {
  projectType: ProjectType;
  message: string;
  hasActiveProject: boolean;
}) {
  const lower = message.toLowerCase();

  const deepSignals = [
    "architecture",
    "debug",
    "fix this",
    "rewrite",
    "full build",
    "build plan",
    "backend",
    "database",
    "supabase",
    "auth",
    "api",
    "app store",
    "xcode",
    "android studio",
    "flutter",
    "swiftui",
    "pricing",
    "what should i charge",
    "production",
    "deploy",
    "vercel",
    "error",
    "failed",
    "bug",
  ];

  if (projectType === "full_stack_app") return true;
  if (projectType === "ios_app" && hasActiveProject) return true;
  if (projectType === "android_app" && hasActiveProject) return true;

  return deepSignals.some((signal) => lower.includes(signal));
}

export function getTextModel({
  aiMode,
  projectType,
  message,
  hasActiveProject,
}: {
  aiMode: AiMode;
  projectType: ProjectType;
  message: string;
  hasActiveProject: boolean;
}) {
  if (aiMode === "light") return getLightModel();
  if (aiMode === "heavy") return getHeavyModel();

  const shouldUseHeavy = isDeepWork({
    projectType,
    message,
    hasActiveProject,
  });

  return shouldUseHeavy ? getHeavyModel() : getLightModel();
}

export function getReasoningEffort({
  aiMode,
  projectType,
  message,
  hasActiveProject,
}: {
  aiMode: AiMode;
  projectType: ProjectType;
  message: string;
  hasActiveProject: boolean;
}): ReasoningEffort {
  if (aiMode === "light") return "low";
  if (aiMode === "heavy") return "high";

  const shouldUseHeavy = isDeepWork({
    projectType,
    message,
    hasActiveProject,
  });

  return shouldUseHeavy ? "high" : "low";
}

export function getMaxOutputTokens({
  aiMode,
  hasImage,
}: {
  aiMode: AiMode;
  hasImage: boolean;
}) {
  if (hasImage) return 3500;
  if (aiMode === "light") return 1800;
  if (aiMode === "heavy") return 6000;

  return 3000;
}
