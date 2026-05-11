import { NextRequest } from "next/server";
import {
  apiBadRequest,
  apiNotFound,
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRouteDeps(req: NextRequest) {
  const { getUserFromRequest } = await import("@/lib/authServer");
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");

  const user = await getUserFromRequest(req);

  return { user, supabaseAdmin };
}

function isAuthErrorLike(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "Missing auth token" ||
      error.message === "Invalid auth token")
  );
}

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

export async function GET(req: NextRequest) {
  try {
    const { user, supabaseAdmin } = await getRouteDeps(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (id) {
      const { data: app, error: appError } = await supabaseAdmin
        .from("generated_apps")
        .select(
          "id, name, platform, framework, status, summary, build_prompt, preview_html, preview_type, preview_notes, created_at, updated_at"
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (appError) {
        throw appError;
      }

      if (!app) {
        return apiNotFound("Generated app not found.");
      }

      const { data: files, error: filesError } = await supabaseAdmin
        .from("generated_app_files")
        .select("id, path, content, language, purpose, created_at, updated_at")
        .eq("generated_app_id", id)
        .eq("user_id", user.id)
        .order("path", { ascending: true });

      if (filesError) {
        throw filesError;
      }

      return apiOk({
        app,
        files: files || [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("generated_apps")
      .select(
        "id, name, platform, framework, status, summary, preview_type, preview_notes, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return apiOk({
      apps: data || [],
    });
  } catch (error) {
    console.error("GET GENERATED APPS ERROR:", error);

    if (isAuthErrorLike(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not load generated apps.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, supabaseAdmin } = await getRouteDeps(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return apiBadRequest("Generated app id is required.");
    }

    const { data, error } = await supabaseAdmin
      .from("generated_apps")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return apiNotFound("Generated app not found.");
    }

    return apiOk();
  } catch (error) {
    console.error("DELETE GENERATED APP ERROR:", error);

    if (isAuthErrorLike(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not delete generated app.");
  }
}
