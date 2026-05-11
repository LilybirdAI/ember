import {
  apiError,
  apiBadRequest,
  apiNotFound,
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/api";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

export async function POST(req: Request) {
  try {
    if (process.env.ENABLE_BUILD_CHECK !== "true") {
      return apiError("Build check is disabled in this environment.", 403, {
        output:
          "Build Check is disabled for this beta environment. Export ZIP still works.",
      });
    }

    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const { runGeneratedAppBuildCheck } = await import("@/lib/appBuilder/buildRunner");

    const user = await getUserFromRequest(req);
    const body = await req.json();

    const generatedAppId = cleanString(body.generatedAppId || body.id);

    if (!generatedAppId) {
      return apiBadRequest("Generated app id is required.");
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from("generated_apps")
      .select("id, name")
      .eq("id", generatedAppId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (appError) throw appError;

    if (!app) {
      return apiNotFound("Generated app not found.");
    }

    const { data: files, error: filesError } = await supabaseAdmin
      .from("generated_app_files")
      .select("path, content")
      .eq("generated_app_id", generatedAppId)
      .eq("user_id", user.id)
      .order("path", { ascending: true });

    if (filesError) throw filesError;

    if (!files || files.length === 0) {
      return apiBadRequest("Generated app has no files.");
    }

    const result = await runGeneratedAppBuildCheck(files);

    return apiOk({
      generatedAppId,
      appName: app.name,
      build: result,
    });
  } catch (error) {
    console.error("BUILD CHECK ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not run build check.");
  }
}
