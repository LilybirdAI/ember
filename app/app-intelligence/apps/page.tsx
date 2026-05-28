"use client";

import { useEffect, useState } from "react";

type UsageSummary = {
  ok?: boolean;
  totalRequests?: number;
  productionRequests?: number;
  stagingRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  appCount?: number;
  apps?: Array<{
    appId: string;
    appName: string;
    requests: number;
    productionRequests?: number;
    stagingRequests?: number;
    testRequests?: number;
    totalTokens: number;
    placeholderGuardrailCount?: number;
    lastUsedAt: string | null;
  }>;
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AppIntelligenceAppsPage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadApps() {
    try {
      setLoading(true);

      const res = await fetch("/api/app-intelligence/usage/summary", {
        cache: "no-store",
      });

      const data = (await res.json()) as UsageSummary;
      setSummary(data);
    } catch (error) {
      setSummary({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown apps load error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  const apps = summary?.apps || [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Embr Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            App Intelligence Apps
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            View all apps currently using or testing Embr App Intelligence.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/app-intelligence-console"
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Open Console
            </a>

            <button
              type="button"
              onClick={loadApps}
              disabled={loading}
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh Apps"}
            </button>
          </div>
        </section>

        {summary?.error ? (
          <section className="mt-6 rounded-2xl border border-red-500/50 bg-red-500/10 p-6 text-red-200">
            {summary.error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Apps
            </p>
            <p className="text-2xl font-semibold">{summary?.appCount ?? 0}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Requests
            </p>
            <p className="text-2xl font-semibold">
              {summary?.totalRequests ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-green-300">
              Production
            </p>
            <p className="text-2xl font-semibold text-green-200">
              {summary?.productionRequests ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-300">
              Test / Demo
            </p>
            <p className="text-2xl font-semibold text-blue-200">
              {summary?.testRequests ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Tokens
            </p>
            <p className="text-2xl font-semibold">
              {summary?.totalTokens ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Apps</h2>

          {apps.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Production</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Dashboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {apps.map((app) => (
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

                      <td className="px-4 py-3 text-green-300">
                        {app.productionRequests ?? 0}
                      </td>

                      <td className="px-4 py-3 text-blue-300">
                        {app.testRequests ?? 0}
                      </td>

                      <td className="px-4 py-3">{app.totalTokens}</td>

                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(app.lastUsedAt)}
                      </td>

                      <td className="px-4 py-3">
                        <a
                          href={`/app-intelligence/apps/${app.appId}`}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-slate-800"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No App Intelligence usage has been recorded yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
