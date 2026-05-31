import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL || "https://api.embrintelligence.ai";

async function getOptionalUserId(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    return user?.id || null;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }

    console.warn("Could not resolve Embr user id:", error);
    return null;
  }
}

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function makeConversationTitle(message: string) {
  const cleaned = message.trim().replace(/\s+/g, " ");
  if (!cleaned) return "New Embr conversation";
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
}

async function saveChatTurn(input: {
  userId: string;
  conversationId?: string | null;
  userMessage: string;
  assistantMessage: string;
  projectType?: string | null;
  projectId?: string | null;
}) {
  const now = new Date().toISOString();
  let conversationId = cleanString(input.conversationId);

  if (!conversationId) {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        user_id: input.userId,
        title: makeConversationTitle(input.userMessage),
        project_type: input.projectType || "general",
        project_id: input.projectId || null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error) throw error;
    conversationId = data.id;
  } else {
    const { error } = await supabaseAdmin
      .from("conversations")
      .update({ updated_at: now })
      .eq("id", conversationId)
      .eq("user_id", input.userId);

    if (error) throw error;
  }

  const { error: messageError } = await supabaseAdmin.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: input.userId,
      role: "user",
      content: input.userMessage,
      created_at: now,
    },
    {
      conversation_id: conversationId,
      user_id: input.userId,
      role: "assistant",
      content: input.assistantMessage,
      created_at: new Date().toISOString(),
    },
  ]);

  if (messageError) throw messageError;

  return conversationId;
}

export async function GET() {
  try {
    const upstream = await fetch(`${EMBR_SERVER_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          ok: false,
          error: "Embr server returned a non-JSON response.",
          status: upstream.status,
          bodyPreview: text.slice(0, 500),
        },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    try {
      JSON.parse(text || "{}");
    } catch {
      return Response.json(
        {
          ok: false,
          error: "Embr server returned invalid JSON.",
          status: upstream.status,
          bodyPreview: text.slice(0, 500),
        },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Embr server health proxy error:", error);

    return Response.json(
      {
        ok: false,
        error: "Unable to reach Embr server",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = await getOptionalUserId(request);

    const forwardedBody = userId
      ? {
          ...body,
          userId,
          profileUserId: userId,
        }
      : body;

    const upstream = await fetch(`${EMBR_SERVER_URL}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "x-embr-user-id": userId } : {}),
      },
      body: JSON.stringify(forwardedBody),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          ok: false,
          error: "Embr server returned a non-JSON response.",
          status: upstream.status,
          bodyPreview: text.slice(0, 500),
        },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    let data: any;

    try {
      data = JSON.parse(text || "{}");
    } catch {
      return Response.json(
        {
          ok: false,
          error: "Embr server returned invalid JSON.",
          status: upstream.status,
          bodyPreview: text.slice(0, 500),
        },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    let conversationId = cleanString(body.conversationId);


    if (upstream.ok && userId) {
      const userMessage = cleanString(body.message);
      const assistantMessage = cleanString(
        data.response || data.content || data.text || data.output
      );

      if (userMessage && assistantMessage) {
        try {
          conversationId = await saveChatTurn({
            userId,
            conversationId,
            userMessage,
            assistantMessage,
            projectType: cleanString(body.projectType, "general"),
            projectId: cleanString(body.projectId) || null,
          });
        } catch (saveError) {
          console.error("Could not save Embr conversation:", saveError);
        }
      }
    }

    return Response.json(
      {
        ...(data && typeof data === "object" && !Array.isArray(data)
          ? data
          : { response: text }),
        conversationId: conversationId || data.conversationId || null,
      },
      { status: upstream.status }
    );
  } catch (error) {
    console.error("Embr chat proxy error:", error);

    return Response.json(
      {
        error: "Unable to reach Embr server",
        source: "vercel_proxy",
      },
      { status: 502 }
    );
  }
}
