import { supabaseAdmin } from "@/lib/supabaseAdmin";

type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
} | null | undefined;

export function getMonthlyTokenLimit() {
  const value = Number(process.env.MONTHLY_TOKEN_LIMIT_PER_USER || "500000");

  if (!Number.isFinite(value) || value <= 0) {
    return 500000;
  }

  return Math.round(value);
}

export async function getMonthlyTokenUsage(userId: string) {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
  );

  const { data, error } = await supabaseAdmin
    .from("usage_events")
    .select("total_tokens")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  if (error) {
    throw error;
  }

  return (data || []).reduce((total, row) => {
    return total + Number(row.total_tokens || 0);
  }, 0);
}

export async function checkMonthlyUsageLimit(userId: string) {
  const used = await getMonthlyTokenUsage(userId);
  const limit = getMonthlyTokenLimit();

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function logUsageEvent({
  userId,
  conversationId,
  model,
  usage,
}: {
  userId: string;
  conversationId: string | null;
  model: string;
  usage: OpenAIUsage;
}) {
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);
  const totalTokens = Number(
    usage?.total_tokens || inputTokens + outputTokens || 0
  );

  const { error } = await supabaseAdmin.from("usage_events").insert({
    user_id: userId,
    conversation_id: conversationId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
  });

  if (error) {
    throw error;
  }
}
