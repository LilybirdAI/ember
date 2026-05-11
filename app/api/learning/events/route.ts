import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return fetchEmbrLearning("/learn/events", undefined, req);
}
