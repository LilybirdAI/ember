"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppIntelligenceNav from "../../AppIntelligenceNav";

type ProfileResponse = {
  ok?: boolean;
  appId?: string;
  known?: boolean;
  profile?: {
    id: string;
    name: string;
    defaultMode: string;
    tone: string;
    purpose: string;
  };
  error?: string;
};

type UsageResponse = {
  ok?: boolean;
  source?: string;
  fallbackFrom?: string;
  events?: Array<{
    id: string;
    time: string;
    appId: string;
    appName: string;
    mode: string;
    environment?: string;
    totalTokens?: number | null;
    engine: string;
    model: string;
  }>;
  error?: string;
};

type QualityResponse = {
  ok?: boolean;
  source?: string;
  fallbackFrom?: string;
  events?: Array<{
    id: string;
    time: string;
    appId?: string;
    appName?: string;
    mode?: string;
    engine?: string;
    model?: string;
    qualityScore: number;
    contextUsed?: boolean;
    profileFollowed?: boolean;
    actionable?: boolean;
    displayReady?: boolean;
    inventedDataRisk: boolean;
    boundaryRisk: boolean;
    placeholderRisk: boolean;
    notes?: string[];
  }>;
  error?: string;
};

type RegisteredAppsResponse = {
  ok?: boolean;
  source?: string;
  apps?: Array<{
    appId: string;
    appName: string;
    defaultMode?: string;
    status?: string;
    ownerLabel?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    requests?: number;
    productionRequests?: number;
    stagingRequests?: number;
    testRequests?: number;
    totalTokens?: number;
    lastUsedAt?: string | null;
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

function environmentLabel(value?: string) {
  if (value === "production") return "Production";
  if (value === "staging") return "Staging";
  return "Internal Testing";
}

export default function AppDashboardPage() {
  const params = useParams<{ appId: string }>();
  const appId = params?.appId || "";

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [quality, setQuality] = useState<QualityResponse | null>(null);
  const [registeredApps, setRegisteredApps] = useState<RegisteredAppsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [profileRes, usageRes, qualityRes, appsRes] = await Promise.all([
        fetch(`/api/app-intelligence/profile?appId=${encodeURIComponent(appId)}`, {
          cache: "no-store",
        }),
        fetch(`/api/app-intelligence/usage?appId=${encodeURIComponent(appId)}&limit=25`, {
          cache: "no-store",
        }),
        fetch(`/api/app-intelligence/quality?appId=${encodeURIComponent(appId)}&limit=25`, {
          cache: "no-store",
        }),
        fetch("/api/app-intelligence/apps?limit=500", {
          cache: "no-store",
        }),
      ]);

      setProfile((await profileRes.json()) as ProfileResponse);
      setUsage((await usageRes.json()) as UsageResponse);
      setQuality((await qualityRes.json()) as QualityResponse);
      setRegisteredApps((await appsRes.json()) as RegisteredAppsResponse);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown dashboard load error";

      setProfile({ ok: false, error: message });
      setUsage({ ok: false, error: message });
      setQuality({ ok: false, error: message });
      setRegisteredApps({ ok: false, error: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (appId) {
      loadDashboard();
    }
  }, [appId]);

  const usageEvents = usage?.events || [];
  const qualityEvents = quality?.events || [];
  const registeredApp = registeredApps?.apps?.find((app) => app.appId === appId);

  const productionRequests = usageEvents.filter(
    (event) => event.environment === "production"
  ).length;

  const internalTestingRequests = usageEvents.filter(
    (event) => event.environment !== "production"
  ).length;

  const totalTokens = usageEvents.reduce(
    (sum, event) => sum + (event.totalTokens || 0),
    0
  );

  const averageQuality = qualityEvents.length
    ? Math.round(
        qualityEvents.reduce((sum, event) => sum + event.qualityScore, 0) /
          qualityEvents.length
      )
    : 0;

  const needsReviewCount = qualityEvents.reduce((sum, event) => {
    return (
      sum +
      Number(event.inventedDataRisk) +
      Number(event.boundaryRisk) +
      Number(event.placeholderRisk)
    );
  }, 0);

  const appHealth = useMemo(() => {
    if (!usageEvents.length) {
      return {
        label: "Waiting for data",
        detail: "No recent app requests have been recorded yet.",
        className: "border-slate-700 bg-slate-800/50 text-slate-300",
      };
    }

    if (needsReviewCount > 0) {
      return {
        label: "Needs review",
        detail: "Embr detected one or more quality or safety review signals.",
        className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
      };
    }

    if (averageQuality >= 90) {
      return {
        label: "Healthy",
        detail: "Recent responses are passing quality checks.",
        className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      };
    }

    return {
      label: "Watch",
      detail: "Quality is acceptable, but this app may need profile tuning.",
      className: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    };
  }, [averageQuality, needsReviewCount, usageEvents.length]);

  const latestUsage = usageEvents[0];
  const latestQuality = qualityEvents[0];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <AppIntelligenceNav />

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                App Dashboard
              </p>

              <h1 className="mt-3 text-3xl font-bold">
                {registeredApp?.appName || profile?.profile?.name || appId}
              </h1>

              <p className="mt-3 max-w-3xl text-slate-400">
                {profile?.profile?.purpose ||
                  "Monitor usage, response quality, integration status, and app-specific behavior for this Embr-powered app."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full border px-3 py-1 font-semibold ${appHealth.className}`}>
                  {appHealth.label}
                </span>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  App ID: {appId}
                </span>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  Profile: {profile?.known ? "Configured" : "Generic fallback"}
                </span>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  Mode: {registeredApp?.defaultMode || profile?.profile?.defaultMode || "unknown"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400 lg:w-80">
              <p className="font-semibold text-slate-100">Integration Status</p>
              <p className="mt-2">{appHealth.detail}</p>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <p>Status: <span className="text-slate-300">{registeredApp?.status || "test"}</span></p>
                <p>Owner: <span className="text-slate-300">{registeredApp?.ownerLabel || "Unassigned"}</span></p>
                <p>Created: <span className="text-slate-300">{formatDate(registeredApp?.createdAt)}</span></p>
                <p>Last activity: <span className="text-slate-300">{formatDate(latestUsage?.time || registeredApp?.lastUsedAt)}</span></p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
            Loading app dashboard...
          </section>
        ) : null}

        {profile?.error || usage?.error || quality?.error ? (
          <section className="mt-6 rounded-2xl border border-red-500/50 bg-red-500/10 p-6 text-red-200">
            {profile?.error || usage?.error || quality?.error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              AI Requests
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(usageEvents.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recent app calls
            </p>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-green-300">
              Production Usage
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-200">
              {formatNumber(productionRequests)}
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
              {formatNumber(internalTestingRequests)}
            </p>
            <p className="mt-1 text-xs text-blue-200/70">
              Test, demo, staging
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              AI Usage
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(totalTokens)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Token usage signal
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-yellow-300">
              Quality Score
            </p>
            <p className="mt-1 text-2xl font-semibold text-yellow-200">
              {averageQuality || "—"}
            </p>
            <p className="mt-1 text-xs text-yellow-200/70">
              Recent average
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Registered App
              </p>
              <h2 className="mt-2 text-xl font-semibold">SaaS App Record</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                This is the registered Embr app record stored in Supabase. Usage and quality
                data are layered on top once the app starts sending requests.
              </p>
            </div>

            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {dataSourceLabel(registeredApps?.source)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 font-semibold text-slate-100">{registeredApp?.status || "test"}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
              <p className="mt-1 font-semibold text-slate-100">{registeredApp?.ownerLabel || "Unassigned"}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Default Mode</p>
              <p className="mt-1 font-semibold text-slate-100">
                {registeredApp?.defaultMode || profile?.profile?.defaultMode || "assistant"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-slate-100">{formatDate(registeredApp?.createdAt)}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Integration
          </p>
          <h2 className="mt-2 text-xl font-semibold">Connect this app to Embr</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Use this app ID when sending requests to the Embr API. Future API key handling
            will live here once per-app keys are enabled.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">API Endpoint</p>
              <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
{`POST https://api.embrintelligence.ai/app-intelligence/respond`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">App ID</p>
              <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-yellow-300">
{appId}
              </pre>
            </div>
          </div>

          <pre className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
{`const response = await fetch("https://api.embrintelligence.ai/app-intelligence/respond", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-embr-app-id": "${appId}"
  },
  body: JSON.stringify({
    appId: "${appId}",
    userId: "user_123",
    environment: "production",
    message: "What should I focus on next?",
    appContext: {
      screen: "dashboard",
      currentTask: "first integration"
    }
  })
});`}
          </pre>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
              App Intelligence Profile
            </p>
            <h2 className="mt-2 text-xl font-semibold">Behavior Layer</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {profile?.profile?.tone || "No app-specific tone configured yet."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Profile
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  {profile?.known ? "Configured" : "Generic"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Default Mode
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  {profile?.profile?.defaultMode || "unknown"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Data Source
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  {dataSourceLabel(usage?.source || quality?.source)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
              Needs Review
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {formatNumber(needsReviewCount)} signals
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Review signals include boundary risk, invented-data risk, and placeholder
              language. Zero means recent responses passed without major risk flags.
            </p>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              Latest quality check:{" "}
              <span className="font-semibold text-slate-100">
                {latestQuality ? `${latestQuality.qualityScore}/100` : "No checks yet"}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent App Activity</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest Embr requests for this app, separated by environment and usage signal.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {dataSourceLabel(usage?.source)}
            </span>
          </div>

          {usageEvents.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Environment</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">AI Usage</th>
                    <th className="px-4 py-3">Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {usageEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(event.time)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            event.environment === "production"
                              ? "rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-300"
                              : "rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300"
                          }
                        >
                          {environmentLabel(event.environment)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{event.mode}</td>
                      <td className="px-4 py-3">{formatNumber(event.totalTokens)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {event.engine} / {event.model}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
              No usage events yet for this app.
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Quality Monitoring</h2>
              <p className="mt-1 text-sm text-slate-400">
                Recent response-quality evaluations for this app.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {dataSourceLabel(quality?.source)}
            </span>
          </div>

          {qualityEvents.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Quality Score</th>
                    <th className="px-4 py-3">Needs Review</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {qualityEvents.map((event) => {
                    const reviewSignals =
                      Number(event.inventedDataRisk) +
                      Number(event.boundaryRisk) +
                      Number(event.placeholderRisk);

                    return (
                      <tr key={event.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(event.time)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {event.qualityScore}/100
                        </td>
                        <td className="px-4 py-3">
                          {reviewSignals ? (
                            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                              {reviewSignals} signal{reviewSignals === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                              Clear
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {event.notes?.[0] || "No notes recorded."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
              No quality evaluations yet for this app.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
