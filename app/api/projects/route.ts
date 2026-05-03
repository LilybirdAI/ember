import { NextRequest } from "next/server";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import {
  apiBadRequest,
  apiNotFound,
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeProjectType(value: unknown) {
  const allowedTypes = [
    "general",
    "website",
    "ios_app",
    "android_app",
    "full_stack_app",
    "content",
  ];

  if (typeof value === "string" && allowedTypes.includes(value)) {
    return value;
  }

  return "general";
}

function normalizeStatus(value: unknown) {
  const allowedStatuses = ["active", "paused", "completed", "archived"];

  if (typeof value === "string" && allowedStatuses.includes(value)) {
    return value;
  }

  return "active";
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (id) {
      const { data: project, error } = await supabaseAdmin
        .from("projects")
        .select("id, name, type, summary, status, created_at, updated_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!project) {
        return apiNotFound("Project not found.");
      }

      return apiOk({
        project,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id, name, type, summary, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return apiOk({
      projects: data || [],
    });
  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not load projects.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const name = cleanString(body.name);
    const type = normalizeProjectType(body.type);
    const summary = cleanString(body.summary);
    const status = normalizeStatus(body.status);

    if (!name) {
      return apiBadRequest("Project name is required.");
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        type,
        summary: summary || null,
        status,
      })
      .select("id, name, type, summary, status, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return apiOk({
      project,
    }, 201);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not create project.");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return apiBadRequest("Project id is required.");
    }

    const updates: {
      name?: string;
      type?: string;
      summary?: string | null;
      status?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return apiBadRequest("Project name cannot be empty.");
      }

      updates.name = name;
    }

    if (body.type !== undefined) {
      updates.type = normalizeProjectType(body.type);
    }

    if (typeof body.summary === "string") {
      updates.summary = body.summary.trim() || null;
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, name, type, summary, status, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!project) {
      return apiNotFound("Project not found.");
    }

    return apiOk({
      project,
    });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not update project.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return apiBadRequest("Project id is required.");
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!project) {
      return apiNotFound("Project not found.");
    }

    return apiOk();
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not delete project.");
  }
}
