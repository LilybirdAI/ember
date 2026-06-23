"use client";

import { useEffect, useState } from "react";

type RegisteredApp = {
  appId?: string;
  appName?: string;
  defaultMode?: string;
  status?: string;
  ownerLabel?: string;
  requests?: number;
  totalTokens?: number;
  lastUsedAt?: string | null;
};

type UsageApp = {
  appId?: string;
  requests?: number;
  productionRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  lastUsedAt?: string | null;
};

type QualityApp = {
  appId?: string;
  responses?: number;
  averageQualityScore?: number;
  placeholderRiskCount?: number;
  boundaryRiskCount?: number;
  inventedDataRiskCount?: number;
  lastEvaluatedAt?: string | null;
};

type OperatorSummary = {
  ok: boolean;
  generatedAt?: string;
  system?: {
    ok?: boolean;
    service?: string;
    status?: string;
    time?: string;
    uptimeSeconds?: number;
    nodeVersion?: string;
    routeCheckAvailable?: boolean;
    learningAvailable?: boolean;
  };
  apps?: {
    appCount?: number;
    registeredAppCount?: number;
    activeAppCount?: number;
    totalRequests?: number;
    totalTokens?: number;
    apps?: RegisteredApp[];
  };
  usage?: {
    totalRequests?: number;
    productionRequests?: number;
    testRequests?: number;
    totalTokens?: number;
    appCount?: number;
    apps?: UsageApp[];
  };
  quality?: {
    totalResponses?: number;
    averageQualityScore?: number;
    placeholderRiskCount?: number;
    boundaryRiskCount?: number;
    inventedDataRiskCount?: number;
    appCount?: number;
    apps?: QualityApp[];
  };
};

export default function OperatorDashboardPage() {
  const [data, setData] = useState<OperatorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOperatorSummary() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/operator/summary", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Operator request failed: ${res.status}`);
      }

      const json = (await res.json()) as OperatorSummary;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown operator error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperatorSummary();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        Loading Operator Dashboard...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="rounded-3xl border border-red-900 bg-red-950/30 p-6">
          <h1 className="text-2xl font-bold text-red-200">
            Operator Dashboard unavailable
          </h1>
          <p className="mt-2 text-red-100">{error || "No operator data."}</p>
        </div>
      </main>
    );
  }

  const registeredApps = data.apps?.apps || [];

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
              Embr Internal
            </p>
            <h1 className="mt-2 text-4xl font-bold">Operator Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Internal technical view for platform health, registered apps,
              usage, quality, and operational checks.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOperatorSummary}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black"
          >
            Refresh
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Server" value={data.system?.status || "unknown"} />
          <Metric label="Registered Apps" value={data.apps?.registeredAppCount ?? 0} />
          <Metric label="Total Requests" value={data.usage?.totalRequests ?? 0} />
          <Metric
            label="Avg Quality"
            value={
              typeof data.quality?.averageQualityScore === "number"
                ? `${data.quality.averageQualityScore}/100`
                : "unknown"
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Platform Health">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Detail label="Service" value={data.system?.service || "unknown"} />
              <Detail label="Status" value={data.system?.status || "unknown"} />
              <Detail label="Node" value={data.system?.nodeVersion || "unknown"} />
              <Detail
                label="Uptime"
                value={
                  typeof data.system?.uptimeSeconds === "number"
                    ? `${Math.round(data.system.uptimeSeconds / 3600)} hours`
                    : "unknown"
                }
              />
              <Detail
                label="Route Check"
                value={data.system?.routeCheckAvailable ? "Ready" : "Unknown"}
              />
              <Detail
                label="Learning"
                value={data.system?.learningAvailable ? "Ready" : "Unknown"}
              />
            </div>
          </Panel>

          <Panel title="AI Usage">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Detail
                label="Production Requests"
                value={String(data.usage?.productionRequests ?? 0)}
              />
              <Detail
                label="Test Requests"
                value={String(data.usage?.testRequests ?? 0)}
              />
              <Detail
                label="Total Tokens"
                value={formatNumber(data.usage?.totalTokens ?? 0)}
              />
              <Detail
                label="Quality Responses"
                value={String(data.quality?.totalResponses ?? 0)}
              />
              <Detail
                label="Placeholder Risks"
                value={String(data.quality?.placeholderRiskCount ?? 0)}
              />
              <Detail
                label="Boundary Risks"
                value={String(data.quality?.boundaryRiskCount ?? 0)}
              />
            </div>
          </Panel>
        </section>

        <Panel title="Registered Apps">
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="grid grid-cols-6 gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <div>App</div>
              <div>Owner</div>
              <div>Status</div>
              <div>Mode</div>
              <div>Requests</div>
              <div>Last Used</div>
            </div>

            {registeredApps.map((app) => (
              <div
                key={app.appId}
                className="grid grid-cols-6 gap-3 border-b border-slate-900 px-4 py-3 text-sm text-slate-200 last:border-b-0"
              >
                <div>
                  <div className="font-semibold text-white">{app.appName}</div>
                  <div className="text-xs text-slate-500">{app.appId}</div>
                </div>
                <div>{app.ownerLabel || "Unknown"}</div>
                <div>{app.status || "unknown"}</div>
                <div>{app.defaultMode || "unknown"}</div>
                <div>{app.requests ?? 0}</div>
                <div>{formatMaybeDate(app.lastUsedAt || null)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
      <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black px-3 py-2">
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function formatMaybeDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
