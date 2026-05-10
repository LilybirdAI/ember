export const runtime = "nodejs";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL || "http://142.93.204.154:3001";

export async function GET() {
  try {
    const upstream = await fetch(`${EMBR_SERVER_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
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

    const upstream = await fetch(`${EMBR_SERVER_URL}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
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
