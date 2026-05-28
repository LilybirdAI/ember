export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const baseUrl =
    process.env.EMBR_SERVER_URL ||
    process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
    "http://142.93.204.154:3001";

  const url = new URL(req.url);
  const appId = url.searchParams.get("appId") || "";

  if (!appId) {
    return Response.json({ ok: false, error: "Missing appId" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${baseUrl}/app-intelligence/profile/${encodeURIComponent(appId)}`,
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
            : "Unknown App Intelligence profile proxy error",
      },
      { status: 200 }
    );
  }
}
