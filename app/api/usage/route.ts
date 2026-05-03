import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import {
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/api";
import {
  getMonthlyTokenLimit,
  getMonthlyTokenUsage,
} from "@/lib/usage";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);

    const used = await getMonthlyTokenUsage(user.id);
    const limit = getMonthlyTokenLimit();

    const { data: recentEvents, error } = await supabaseAdmin
      .from("usage_events")
      .select("id, model, input_tokens, output_tokens, total_tokens, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return apiOk({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      recentEvents: recentEvents || [],
    });
  } catch (error) {
    console.error("GET USAGE ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.");
    }

    return apiServerError("Could not load usage.");
  }
}
