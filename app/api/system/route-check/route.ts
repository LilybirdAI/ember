export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const baseUrl =
    process.env.EMBR_SERVER_URL ||
    process.env.NEXT_PUBLIC_EMBR_SERVER_URL ||
    "http://142.93.204.154:3001";

  try {
    const body = await req.json();

    const upstream = await fetch(`${baseUrl}/route-check`, {
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
        error: error instanceof Error ? error.message : "Unknown route-check error",
      },
      { status: 200 }
    );
  }
}
