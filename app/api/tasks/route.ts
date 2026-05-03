import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeStatus(value: unknown) {
  const allowedStatuses = ["open", "in_progress", "blocked", "done"];

  if (typeof value === "string" && allowedStatuses.includes(value)) {
    return value;
  }

  return "open";
}

function normalizePriority(value: unknown, fallback = 3) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return Math.min(5, Math.max(1, Math.round(numberValue)));
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId")?.trim();

    let query = supabaseAdmin
      .from("tasks")
      .select("id, project_id, title, description, status, priority, due_date, created_at, updated_at")
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: "Could not load tasks." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const projectId = cleanString(body.projectId) || null;
    const title = cleanString(body.title);
    const description = cleanString(body.description) || null;
    const status = normalizeStatus(body.status);
    const priority = normalizePriority(body.priority, 3);
    const dueDate = cleanString(body.dueDate) || null;

    if (!title) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    if (projectId) {
      const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: "Project not found for this user." },
          { status: 404 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        user_id: user.id,
        project_id: projectId,
        title,
        description,
        status,
        priority,
        due_date: dueDate,
      })
      .select("id, project_id, title, description, status, priority, due_date, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: "Could not create task." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    }

    const updates: {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: number;
      due_date?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          { error: "Task title cannot be empty." },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    if (typeof body.description === "string") {
      updates.description = body.description.trim() || null;
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.priority !== undefined) {
      updates.priority = normalizePriority(body.priority, 3);
    }

    if (body.dueDate !== undefined) {
      updates.due_date = cleanString(body.dueDate) || null;
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, project_id, title, description, status, priority, due_date, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: "Could not update task." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: "Could not delete task." }, { status: 500 });
  }
}
