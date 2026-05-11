const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL || "http://142.93.204.154:3001";

function getAdminToken() {
  const token = process.env.EMBR_ADMIN_TOKEN;

  if (!token) {
    throw new Error("Missing EMBR_ADMIN_TOKEN");
  }

  return token;
}

export async function fetchEmbrLearning(path: string, init?: RequestInit) {
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

  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
