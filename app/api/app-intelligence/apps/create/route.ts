export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL ||
  process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
  "https://api.embrintelligence.ai";

function jsonError(message: string, status = 500) {
  return Response.json(
    {
      ok: false,
      error: message,
    },
    { status }
  );
}

function getAdminToken() {
  const token = process.env.EMBR_ADMIN_TOKEN;

  if (!token) {
    throw new Error("Missing EMBR_ADMIN_TOKEN");
  }

  return token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = getAdminToken();

    const upstream = await fetch(`${EMBR_SERVER_URL}/app-intelligence/apps/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-embr-admin-token": token,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();

    return new Response(
      text || JSON.stringify({ ok: false, error: "Empty response from Embr server" }),
      {
        status: upstream.status,
        headers: {
          "content-type":
            upstream.headers.get("content-type") || "application/json",
        },
      }
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unknown create app proxy error",
      500
    );
  }
}
