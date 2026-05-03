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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (id) {
      const { data: conversation, error: conversationError } =
        await supabaseAdmin
          .from("conversations")
          .select("id, title, project_type, project_id, created_at, updated_at")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

      if (conversationError) {
        throw conversationError;
      }

      if (!conversation) {
        return apiNotFound("Conversation not found.");
      }

      const { data: messages, error: messagesError } = await supabaseAdmin
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      return apiOk({
        conversation,
        messages: messages || [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("id, title, project_type, project_id, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return apiOk({
      conversations: data || [],
    });
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not load conversations.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const id = cleanString(body.id);

    if (!id) {
      return apiBadRequest("Conversation id is required.");
    }

    const { error } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return apiOk({
      success: true,
    });
  } catch (error) {
    console.error("DELETE CONVERSATION ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not delete conversation.");
  }
}
