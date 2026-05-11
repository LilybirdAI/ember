"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

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

export default function BrainLabPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "Build me a real estate lead tracker for brokers with buyer leads, seller leads, investor leads, property interest, price range, follow-up status, deal value, and pipeline dashboard."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function runBrain() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/embr-brain/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.output || data.error || "Brain run failed.");
      }

      setResult(data.result);
    } catch (error) {
      console.error("BRAIN LAB ERROR:", error);
      setError(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <a href="/" className="text-sm text-yellow-400 hover:text-yellow-300">
            ← Back to Embr
          </a>

          <h1 className="mt-4 text-4xl font-bold text-yellow-400">
            Embr Brain Lab
          </h1>

          <p className="mt-2 text-slate-400">
            Tests how Embr classifies, researches, and critiques a request before generating anything.
          </p>
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-36 w-full rounded-xl border border-slate-700 bg-slate-900 p-4 outline-none"
        />

        <button
          type="button"
          onClick={runBrain}
          disabled={loading}
          className="rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Brain"}
        </button>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {result !== null && (
          <pre className="max-h-[720px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-200">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
