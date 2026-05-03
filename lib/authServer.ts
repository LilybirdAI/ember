import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing auth token");
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Invalid auth token");
  }

  return data.user;
}

export function isAuthError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "Missing auth token" ||
      error.message === "Invalid auth token")
  );
}
