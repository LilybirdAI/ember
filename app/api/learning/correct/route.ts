import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return fetchEmbrLearning("/learn/correct", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
