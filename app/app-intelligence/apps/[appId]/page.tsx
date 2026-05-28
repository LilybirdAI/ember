"use client";

import { useEffect, useState } from "react";
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
  events?: Array<{
    id: string;
    time: string;
    qualityScore: number;
    inventedDataRisk: boolean;
    boundaryRisk: boolean;
    placeholderRisk: boolean;
  }>;
  error?: string;
};

export default function AppDashboardPage() {
  const params = useParams<{ appId: string }>();
  const appId = params?.appId || "";

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [quality, setQuality] = useState<QualityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [profileRes, usageRes, qualityRes] = await Promise.all([
        fetch(`/api/app-intelligence/profile?appId=${encodeURIComponent(appId)}`, {
          cache: "no-store",
        }),
        fetch(`/api/app-intelligence/usage?appId=${encodeURIComponent(appId)}&limit=25`, {
          cache: "no-store",
        }),
        fetch(`/api/app-intelligence/quality?appId=${encodeURIComponent(appId)}&limit=25`, {
          cache: "no-store",
        }),
      ]);

      setProfile((await profileRes.json()) as ProfileResponse);
      setUsage((await usageRes.json()) as UsageResponse);
      setQuality((await qualityRes.json()) as QualityResponse);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown dashboard load error";

      setProfile({ ok: false, error: message });
      setUsage({ ok: false, error: message });
      setQuality({ ok: false, error: message });
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

  const productionRequests = usageEvents.filter(
    (event) => event.environment === "production"
  ).length;

  const testRequests = usageEvents.filter(
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

  const riskFlags = qualityEvents.reduce((sum, event) => {
    return (
      sum +
      Number(event.inventedDataRisk) +
      Number(event.boundaryRisk) +
      Number(event.placeholderRisk)
    );
  }, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <AppIntelligenceNav />
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            App Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {profile?.profile?.name || appId}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            {profile?.profile?.purpose ||
              "Per-app usage and quality dashboard for Embr App Intelligence."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
              appId: {appId}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
              known: {profile?.known ? "yes" : "no"}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
              default mode: {profile?.profile?.defaultMode || "unknown"}
            </span>
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


        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Dashboard Guide
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            How to read this dashboard
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            This dashboard shows how Embr is performing inside this specific app.
            Production requests are real app usage. Test / Demo requests are internal
            testing, smoke tests, and console experiments. Average Quality measures
            how well Embr used app context, followed the app profile, gave useful
            next steps, stayed display-ready, and avoided risk flags.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-green-300">
                Production
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Real app traffic. This is what matters most for usage, billing,
                and client reporting.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-blue-300">
                Test / Demo
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Internal testing traffic from smoke tests, the console, demos, or
                development work.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-yellow-300">
                Avg Quality
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Embr&apos;s response-quality score based on context use, profile fit,
                actionability, display readiness, and risk checks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-red-300">
                Risk Flags
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Potential safety or reliability issues detected by the quality
                evaluator, such as boundary risk or invented-data risk.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Requests
            </p>
            <p className="text-2xl font-semibold">{usageEvents.length}</p>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-green-300">
              Production
            </p>
            <p className="text-2xl font-semibold text-green-200">
              {productionRequests}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-300">
              Test / Demo
            </p>
            <p className="text-2xl font-semibold text-blue-200">
              {testRequests}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Tokens
            </p>
            <p className="text-2xl font-semibold">{totalTokens}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Avg Quality
            </p>
            <p className="text-2xl font-semibold">{averageQuality}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-slate-400">
            {profile?.profile?.tone || "No tone configured."}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Quality</h2>
          <p className="mt-2 text-sm text-slate-400">
            Recent evaluations: {qualityEvents.length} · Risk flags: {riskFlags}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Recent Usage</h2>

          {usageEvents.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Environment</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {usageEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(event.time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {event.environment || "test"}
                      </td>
                      <td className="px-4 py-3">{event.mode}</td>
                      <td className="px-4 py-3">{event.totalTokens ?? "—"}</td>
                      <td className="px-4 py-3">
                        {event.engine} / {event.model}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No usage events yet for this app.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
