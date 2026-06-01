export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL ||
  process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
  "https://api.embrintelligence.ai";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") || "500";

  const upstreamUrl = `${EMBR_SERVER_URL}/app-intelligence/apps?limit=${encodeURIComponent(limit)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();

    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          ok: false,
          error: "Embr upstream returned non-JSON response.",
          upstreamStatus: upstream.status,
          upstreamUrl,
          preview: text.slice(0, 300),
        },
        { status: 200 }
      );
    }

    return new Response(
      text || JSON.stringify({ ok: false, error: "Empty response from Embr server" }),
      {
        status: upstream.status,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown App Intelligence apps proxy error",
        upstreamUrl,
      },
      { status: 200 }
    );
  }
}
