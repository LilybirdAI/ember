import { getUserFromRequest, isAuthError } from "@/lib/authServer";

export const runtime = "nodejs";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL || "http://142.93.204.154:3001";

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
