"use client";

import { useEffect, useMemo, useState } from "react";
import AppIntelligenceNav from "../AppIntelligenceNav";

type UsageSummary = {
  ok?: boolean;
  source?: string;
  fallbackFrom?: string;
  fallbackReason?: string;
  totalRequests?: number;
  productionRequests?: number;
  stagingRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  placeholderGuardrailCount?: number;
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
  if (!value) return "No activity yet";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value || 0);
}

function dataSourceLabel(source?: string) {
  if (source === "supabase") return "Live database";
  if (source === "jsonl") return "Fallback log storage";
  return "Checking source";
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

  const activeApps = useMemo(
    () => apps.filter((app) => app.requests > 0).length,
    [apps]
  );

  const internalTestingTotal =
    (summary?.testRequests || 0) + (summary?.stagingRequests || 0);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <AppIntelligenceNav />

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                SaaS Dashboard
              </p>

              <h1 className="mt-3 text-3xl font-bold">
                Connected Apps
              </h1>

              <p className="mt-3 max-w-3xl text-slate-400">
                Monitor every app using Embr Intelligence, including live AI requests,
                production usage, internal testing, and app-level activity.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                  Storage: {dataSourceLabel(summary?.source)}
                </span>

                {summary?.fallbackFrom ? (
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 font-semibold text-yellow-300">
                    Fallback active
                  </span>
                ) : null}

                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  JSONL fallback retained
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/app-intelligence-console"
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Developer Console
              </a>

              <button
                type="button"
                onClick={loadApps}
                disabled={loading}
                className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
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
              Connected Apps
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(summary?.appCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeApps} with recorded activity
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              AI Requests
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(summary?.totalRequests)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total platform activity
            </p>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-green-300">
              Production Usage
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-200">
              {formatNumber(summary?.productionRequests)}
            </p>
            <p className="mt-1 text-xs text-green-200/70">
              Real app traffic
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-300">
              Internal Testing
            </p>
            <p className="mt-1 text-2xl font-semibold text-blue-200">
              {formatNumber(internalTestingTotal)}
            </p>
            <p className="mt-1 text-xs text-blue-200/70">
              Smoke tests, demos, staging
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              AI Usage
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(summary?.totalTokens)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Token-based usage signal
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Platform Overview
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                App Intelligence at a glance
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                Each connected app gets its own profile, behavior rules, usage tracking,
                quality monitoring, and integration path. Production usage reflects real
                customer activity. Internal testing includes console runs, smoke tests,
                staging traffic, and development checks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400 lg:max-w-xs">
              <p className="font-semibold text-slate-100">SaaS direction</p>
              <p className="mt-2">
                This dashboard is the foundation for app owner accounts, API keys,
                billing limits, SDK onboarding, and client-facing reporting.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-slate-100">
                App Profile
              </p>
              <p className="mt-2 text-sm text-slate-400">
                The behavior layer Embr uses to adapt to each app&apos;s purpose and tone.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-green-300">
                Production Usage
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Real app traffic that will eventually drive billing, reporting, and client value.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-blue-300">
                Internal Testing
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Development, console, smoke-test, and staging activity separated from real usage.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-yellow-300">
                App Details
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Open the app dashboard to review health, quality, usage, and integration status.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Connected Apps</h2>
              <p className="mt-1 text-sm text-slate-400">
                App-level usage and health summaries powered by Embr Intelligence.
              </p>
            </div>
          </div>

          {apps.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">AI Requests</th>
                    <th className="px-4 py-3">Production</th>
                    <th className="px-4 py-3">Internal Testing</th>
                    <th className="px-4 py-3">AI Usage</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {apps.map((app) => {
                    const internalTesting =
                      (app.testRequests || 0) + (app.stagingRequests || 0);

                    return (
                      <tr key={app.appId} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-100">
                            {app.appName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {app.appId}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(app.requests)}
                        </td>

                        <td className="px-4 py-3 text-green-300">
                          {formatNumber(app.productionRequests)}
                        </td>

                        <td className="px-4 py-3 text-blue-300">
                          {formatNumber(internalTesting)}
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(app.totalTokens)}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(app.lastUsedAt)}
                        </td>

                        <td className="px-4 py-3">
                          <a
                            href={`/app-intelligence/apps/${app.appId}`}
                            className="rounded-lg border border-yellow-500/40 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-500/10"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
              No App Intelligence usage has been recorded yet. Once an app calls
              Embr, it will appear here automatically.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
