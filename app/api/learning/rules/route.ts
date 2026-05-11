import { fetchEmbrLearning } from "@/lib/embrLearningProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return fetchEmbrLearning("/learn/rules");
}

export async function POST(req: Request) {
  const body = await req.json();

  return fetchEmbrLearning("/learn/rules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
