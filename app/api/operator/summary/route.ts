import { NextResponse } from "next/server";

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl =
    process.env.EMBR_API_BASE_URL || "https://api.embrintelligence.ai";

  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function GET() {
  try {
    const [system, apps, usage, quality] = await Promise.all([
      fetchJson("/system/status"),
      fetchJson("/app-intelligence/apps"),
      fetchJson("/app-intelligence/usage/summary"),
      fetchJson("/app-intelligence/quality/summary"),
    ]);

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      system,
      apps,
      usage,
      quality,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Operator summary unavailable",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
