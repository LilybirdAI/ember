import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return fetchEmbrLearning("/learn/reflect", {
    method: "POST",
    body: JSON.stringify({}),
  }, req);
}
