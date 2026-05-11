import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return fetchEmbrLearning("/learn/profile", undefined, req);
}

export async function DELETE(req: Request) {
  return fetchEmbrLearning("/learn/profile", {
    method: "DELETE",
  }, req);
}
