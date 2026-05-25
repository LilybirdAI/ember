"use client";

import { useEffect, useState } from "react";


type UsageSummary = {
  ok?: boolean;
  totalRequests?: number;
  totalTokens?: number;
  placeholderGuardrailCount?: number;
  appCount?: number;
  apps?: Array<{
    appId: string;
    appName: string;
    requests: number;
    totalTokens: number;
    placeholderGuardrailCount: number;
    lastUsedAt: string | null;
  }>;
  error?: string;
};

type AppIntelResponse = {
  ok?: boolean;
  type?: string;
  appId?: string;
  userId?: string | null;
  mode?: string;
  memoryScope?: string;
  engine?: string;
  model?: string;
  content?: string;
  response?: string;
  text?: string;
  placeholderGuardrailApplied?: boolean;
  appIntelligence?: {
    appProfileUsed?: string;
    appName?: string;
    appTone?: string;
    contextReceived?: boolean;
  };
  error?: string;
};

const DEFAULT_CONTEXT = JSON.stringify(
  {
    screen: "round_summary",
    score: 87,
    missPattern: "short right",
    mood: "frustrated",
    notes: "Started strong but lost focus on the back nine."
  },
  null,
  2
);

export default function AppIntelligenceConsolePage() {
  const [appId, setAppId] = useState("mindshot-golf");
  const [userId, setUserId] = useState("test-user-1");
  const [mode, setMode] = useState("");
  const [memoryScope, setMemoryScope] = useState("app_user");
  const [message, setMessage] = useState("What should I focus on after this round?");
  const [appContext, setAppContext] = useState(DEFAULT_CONTEXT);
  const [result, setResult] = useState<AppIntelResponse | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);


  async function loadUsageSummary() {
    try {
      setUsageLoading(true);
      const res = await fetch("/api/app-intelligence/usage/summary", {
        cache: "no-store",
      });
      const data = (await res.json()) as UsageSummary;
      setUsageSummary(data);
    } catch (error) {
      setUsageSummary({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown usage summary error",
      });
    } finally {
      setUsageLoading(false);
    }
  }

  useEffect(() => {
    loadUsageSummary();
  }, []);

  async function runTest() {
    let parsedContext: unknown = {};

    try {
      parsedContext = appContext.trim() ? JSON.parse(appContext) : {};
    } catch {
      setResult({
        ok: false,
        error: "App Context must be valid JSON.",
      });
      setRaw("");
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        appId,
        userId,
        memoryScope,
        message,
        appContext: parsedContext,
      };

      if (mode.trim()) {
        payload.mode = mode.trim();
      }

      const res = await fetch("/api/app-intelligence/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setRaw(text);

      try {
        setResult(JSON.parse(text) as AppIntelResponse);
        await loadUsageSummary();
      } catch {
        setResult({
          ok: false,
          error: "Response was not valid JSON.",
          text,
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setRaw("");
    } finally {
      setLoading(false);
    }
  }

  const output = result?.content || result?.response || result?.text || "";
  const profile = result?.appIntelligence?.appProfileUsed || "Unknown";
  const appName = result?.appIntelligence?.appName || "Unknown";
  const selectedMode = result?.mode || "Unknown";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Embr App Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            App Intelligence Console
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Test Embr as an embeddable intelligence layer for any app using appId,
            userId, mode, memoryScope, message, and appContext.
          </p>
        </section>


        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Usage
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                App Intelligence Usage
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Server-side usage tracking for app intelligence requests.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsageSummary}
              disabled={usageLoading}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {usageLoading ? "Refreshing..." : "Refresh Usage"}
            </button>
          </div>

          {usageSummary?.error ? (
            <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
              {usageSummary.error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Requests
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.totalRequests ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Apps
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.appCount ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Tokens
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.totalTokens ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Placeholder Guards
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.placeholderGuardrailCount ?? 0}
              </p>
            </div>
          </div>

          {usageSummary?.apps?.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">Requests</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {usageSummary.apps.slice(0, 8).map((app) => (
                    <tr key={app.appId}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-100">
                          {app.appName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.appId}
                        </div>
                      </td>
                      <td className="px-4 py-3">{app.requests}</td>
                      <td className="px-4 py-3">{app.totalTokens}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {app.lastUsedAt
                          ? new Date(app.lastUsedAt).toLocaleString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                App ID
              </span>
              <input
                value={appId}
                onChange={(event) => setAppId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                User ID
              </span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Mode Override
              </span>
              <input
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                placeholder="blank = registry default"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Memory Scope
              </span>
              <input
                value={memoryScope}
                onChange={(event) => setMemoryScope(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Message
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-36 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                App Context JSON
              </span>
              <textarea
                value={appContext}
                onChange={(event) => setAppContext(event.target.value)}
                className="min-h-36 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs outline-none focus:border-yellow-500"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={runTest}
              disabled={loading}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading ? "Testing..." : "Run Test"}
            </button>
          </div>
        </section>

        {result ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className={result.ok ? "text-green-400" : "text-red-400"}>
                  {result.ok ? "OK" : "Needs attention"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Profile
                </p>
                <p>{profile}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  App
                </p>
                <p>{appName}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Mode
                </p>
                <p>{selectedMode}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Engine
                </p>
                <p>
                  {result.engine || "Unknown"} / {result.model || "Unknown"}
                </p>
              </div>
            </div>

            {result.placeholderGuardrailApplied ? (
              <div className="mt-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-200">
                Placeholder guardrail was applied.
              </div>
            ) : null}

            {result.error ? (
              <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
                {result.error}
              </div>
            ) : null}

            {output ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Response
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">
                  {output}
                </p>
              </div>
            ) : null}

            <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <summary className="cursor-pointer text-sm text-slate-300">
                Raw JSON
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                {raw || JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        ) : null}
      </div>
    </main>
  );
}
