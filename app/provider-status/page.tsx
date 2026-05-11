"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type ProviderStatus = {
  openai: boolean;
  perplexity: {
    enabled: boolean;
    hasKey: boolean;
    model: string;
  };
  claude: {
    enabled: boolean;
    hasKey: boolean;
    model: string;
  };
};

async function parseJsonResponse(res: Response) {
  const rawText = await res.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `API returned non-JSON response. Status: ${res.status}. Body: ${rawText.slice(
        0,
        500
      )}`
    );
  }
}

export default function ProviderStatusPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderStatus | null>(null);
  const [error, setError] = useState("");

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/embr-brain/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Could not load provider status.");
      }

      setProviders(data.providers || null);
    } catch (error) {
      console.error("PROVIDER STATUS ERROR:", error);
      setError(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function statusBadge(active: boolean) {
    return active ? (
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
        Ready
      </span>
    ) : (
      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
        Missing
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <a href="/" className="text-sm text-yellow-400 hover:text-yellow-300">
            ← Back to Embr
          </a>

          <h1 className="mt-4 text-4xl font-bold text-yellow-400">
            Provider Status
          </h1>

          <p className="mt-2 text-slate-400">
            Checks whether Embr can see the AI provider keys without exposing the keys.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh Status"}
        </button>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {providers && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">OpenAI</h2>
                {statusBadge(providers.openai)}
              </div>

              <p className="text-sm text-slate-400">
                Main builder and final Embr voice.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Perplexity</h2>
                {statusBadge(providers.perplexity.enabled && providers.perplexity.hasKey)}
              </div>

              <div className="space-y-1 text-sm text-slate-400">
                <p>Research/current facts engine.</p>
                <p>Enabled: {String(providers.perplexity.enabled)}</p>
                <p>Key present: {String(providers.perplexity.hasKey)}</p>
                <p>Model: {providers.perplexity.model}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Claude</h2>
                {statusBadge(providers.claude.enabled && providers.claude.hasKey)}
              </div>

              <div className="space-y-1 text-sm text-slate-400">
                <p>Critic/reviewer engine.</p>
                <p>Enabled: {String(providers.claude.enabled)}</p>
                <p>Key present: {String(providers.claude.hasKey)}</p>
                <p>Model: {providers.claude.model}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
