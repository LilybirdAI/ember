import { fetchEmbrLearning } from "@/lib/embrLearningProxy";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSignedInUserId(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    return user?.id || null;
  } catch (error) {
    if (isAuthError(error)) {
      return null;
    }

    console.warn("Could not resolve learning profile user:", error);
    return null;
  }
}

function signInRequired() {
  return Response.json(
    {
      ok: false,
      error: "Sign in required to view profile memory.",
    },
    { status: 401 }
  );
}

export async function GET(req: Request) {
  const userId = await getSignedInUserId(req);

  if (!userId) {
    return signInRequired();
  }

  return fetchEmbrLearning(
    `/learn/profile?userId=${encodeURIComponent(userId)}`,
    undefined,
    req
  );
}

export async function DELETE(req: Request) {
  const userId = await getSignedInUserId(req);

  if (!userId) {
    return signInRequired();
  }

  return fetchEmbrLearning(
    `/learn/profile?userId=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
    req
  );
}
