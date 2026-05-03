import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeImportance(value: unknown, fallback = 3) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return Math.min(5, Math.max(1, Math.round(numberValue)));
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();

    let query = supabaseAdmin
      .from("memories")
      .select("id, category, content, importance, source, created_at, updated_at")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(250);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("content", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      memories: data || [],
    });
  } catch (error) {
    console.error("GET MEMORIES ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not load memories." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const content = cleanString(body.content);
    const category = cleanString(body.category, "general") || "general";
    const source = cleanString(body.source, "manual") || "manual";
    const importance = normalizeImportance(body.importance, 3);

    if (!content) {
      return NextResponse.json(
        { error: "Memory content is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("memories")
      .insert({
        user_id: user.id,
        category,
        content,
        importance,
        source,
      })
      .select("id, category, content, importance, source, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      memory: data,
    });
  } catch (error) {
    console.error("CREATE MEMORY ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not create memory." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Memory id is required." },
        { status: 400 }
      );
    }

    const content = cleanString(body.content);
    const category = cleanString(body.category, "general") || "general";
    const source = cleanString(body.source, "manual") || "manual";
    const importance = normalizeImportance(body.importance, 3);

    if (!content) {
      return NextResponse.json(
        { error: "Memory content cannot be empty." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("memories")
      .update({
        category,
        content,
        importance,
        source,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, category, content, importance, source, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      memory: data,
    });
  } catch (error) {
    console.error("UPDATE MEMORY ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not update memory." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Memory id is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("memories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE MEMORY ERROR:", error);

    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not delete memory." },
      { status: 500 }
    );
  }
}
