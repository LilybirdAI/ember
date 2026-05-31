const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL || "https://api.embrintelligence.ai";

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

function requireDashboardKey(req?: Request) {
  const expected = process.env.EMBR_DASHBOARD_KEY;

  if (!expected) {
    throw new Error("Missing EMBR_DASHBOARD_KEY");
  }

  const provided = req?.headers.get("x-embr-dashboard-key");

  if (provided !== expected) {
    return false;
  }

  return true;
}

export async function fetchEmbrLearning(
  path: string,
  init?: RequestInit,
  req?: Request
) {
  try {
    if (!requireDashboardKey(req)) {
      return jsonError("Forbidden.", 403);
    }

    const token = getAdminToken();

    const upstream = await fetch(`${EMBR_SERVER_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-embr-admin-token": token,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    return new Response(
      text || JSON.stringify({ ok: false, error: "Empty response from Embr server" }),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") || "application/json",
        },
      }
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Learning proxy failed",
      500
    );
  }
}
