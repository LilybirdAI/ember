export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    app: "ember",
    time: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelUrl: process.env.VERCEL_URL || null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
    gitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
    gitRepoOwner: process.env.VERCEL_GIT_REPO_OWNER || null,
  });
}
