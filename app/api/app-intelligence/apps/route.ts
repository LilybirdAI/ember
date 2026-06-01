export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMBR_SERVER_URL =
  process.env.EMBR_SERVER_URL ||
  process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
  "https://api.embrintelligence.ai";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") || "500";

  try {
    const upstream = await fetch(
      `${EMBR_SERVER_URL}/app-intelligence/apps?limit=${encodeURIComponent(limit)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

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
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown App Intelligence apps proxy error",
      },
      { status: 200 }
    );
  }
}
