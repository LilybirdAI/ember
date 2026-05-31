export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const baseUrl =
    process.env.EMBR_SERVER_URL ||
    process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
    "https://api.embrintelligence.ai";

  const url = new URL(req.url);
  const appId = url.searchParams.get("appId") || "";
  const limit = url.searchParams.get("limit") || "25";

  try {
    const upstream = await fetch(
      `${baseUrl}/app-intelligence/quality?appId=${encodeURIComponent(appId)}&limit=${encodeURIComponent(limit)}`,
      { method: "GET", cache: "no-store" }
    );

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown App Intelligence quality proxy error",
      },
      { status: 200 }
    );
  }
}
