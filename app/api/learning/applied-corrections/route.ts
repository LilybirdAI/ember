import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return fetchEmbrLearning("/learn/applied-corrections");
}
