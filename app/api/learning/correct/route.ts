import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return fetchEmbrLearning("/learn/correct", {
    method: "POST",
    body: JSON.stringify(body),
  }, req);
}
