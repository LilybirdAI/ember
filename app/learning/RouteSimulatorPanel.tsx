"use client";

import { useState } from "react";

type RouteCheckResult = Record<string, unknown>;

function readValue(result: RouteCheckResult | null, keys: string[]) {
  if (!result) return "Unknown";

  for (const key of keys) {
    const value = result[key];

    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
  }

  return "Unknown";
}

export default function RouteSimulatorPanel() {
  const [message, setMessage] = useState("restaurants in Rome");
  const [result, setResult] = useState<RouteCheckResult | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  async function runRouteCheck() {
    const trimmed = message.trim();

    if (!trimmed) {
      setResult({ ok: false, error: "Enter a message to simulate." });
      setRaw("");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/system/route-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const text = await res.text();
      setRaw(text);

      try {
        setResult(JSON.parse(text) as RouteCheckResult);
      } catch {
        setResult({
          ok: false,
          error: "Route check did not return JSON.",
          preview: text.slice(0, 500),
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown route-check error",
      });
      setRaw("");
    } finally {
      setLoading(false);
    }
  }

  const ok = result?.ok !== false;
  const domain = readValue(result, ["domain", "routeDomain", "classification"]);
  const engine = readValue(result, ["engine", "selectedEngine", "provider", "model"]);
  const tool = readValue(result, ["tool", "selectedTool", "toolName"]);
  const reason = readValue(result, ["reason", "routingReason", "why"]);

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Route Simulator
        </h2>
        <p className="text-sm text-slate-400">
          Test Embr&apos;s routing brain before spending model calls.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-24 flex-1 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 outline-none focus:border-slate-500"
          placeholder="Type a message to simulate..."
        />

        <button
          type="button"
          onClick={runRouteCheck}
          disabled={loading}
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-60 lg:w-40"
        >
          {loading ? "Checking..." : "Check Route"}
        </button>
      </div>

      {result ? (
        <div className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className={ok ? "text-green-400" : "text-red-400"}>
                {ok ? "OK" : "Needs attention"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Domain</p>
              <p className="text-slate-100">{domain}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Engine</p>
              <p className="text-slate-100">{engine}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tool</p>
              <p className="text-slate-100">{tool}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reason</p>
            <p className="mt-1 text-sm text-slate-200">{reason}</p>
          </div>

          <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <summary className="cursor-pointer text-sm text-slate-300">
              Raw route-check response
            </summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
              {raw || JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}
