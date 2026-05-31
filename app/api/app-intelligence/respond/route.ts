export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const baseUrl =
    process.env.EMBR_SERVER_URL ||
    process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
    "https://api.embrintelligence.ai";

  try {
    const body = await req.json();

    const upstream = await fetch(`${baseUrl}/app-intelligence/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

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
        type: "app-intelligence",
        error: error instanceof Error ? error.message : "Unknown App Intelligence proxy error",
      },
      { status: 200 }
    );
  }
}
