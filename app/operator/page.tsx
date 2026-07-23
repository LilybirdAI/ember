"use client";

import { useEffect, useMemo, useState } from "react";

type PortfolioApp = {
  appId?: string;
  appName?: string;
  defaultMode?: string;
  status?: string;
  ownerLabel?: string;
  requests?: number;
  productionRequests?: number;
  stagingRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  lastUsedAt?: string | null;
  qualityScore?: number | null;
  qualityResponses?: number;
  riskFlags?: number;
};

type OperatorSummary = {
  ok: boolean;
  generatedAt?: string;
  scope?: {
    mode?: string;
    appIds?: string[];
    excludedRecordsPreserved?: boolean;
  };
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
    apps?: PortfolioApp[];
  };
  usage?: {
    totalRequests?: number;
    productionRequests?: number;
    stagingRequests?: number;
    testRequests?: number;
    totalTokens?: number;
    appCount?: number;
  };
  quality?: {
    totalResponses?: number;
    averageQualityScore?: number | null;
    placeholderRiskCount?: number;
    boundaryRiskCount?: number;
    inventedDataRiskCount?: number;
    appCount?: number;
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

  const attentionItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const items: string[] = [];
    const apps = data.apps?.apps || [];

    if (!data.system?.ok) {
      items.push("The Embr backend is not reporting a healthy status.");
    }

    for (const app of apps) {
      const name = app.appName || app.appId || "Unknown app";

      if ((app.requests || 0) === 0) {
        items.push(`${name} has no recorded Embr requests.`);
      }

      if (
        typeof app.qualityScore === "number" &&
        app.qualityScore < 80
      ) {
        items.push(
          `${name} quality is ${app.qualityScore}/100 and should be reviewed.`
        );
      }

      if ((app.riskFlags || 0) > 0) {
        items.push(`${name} has ${app.riskFlags} quality or safety risk flags.`);
      }
    }

    return items;
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        Loading Embr Operator Command Center...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-900 bg-red-950/30 p-6">
          <h1 className="text-2xl font-bold text-red-200">
            Operator Command Center unavailable
          </h1>
          <p className="mt-2 text-red-100">{error || "No operator data."}</p>
        </div>
      </main>
    );
  }

  const portfolioApps = data.apps?.apps || [];
  const platformOnline = Boolean(data.system?.ok);

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
              Embr Internal
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Operator Command Center
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Portfolio health, real-app usage, response quality, operational
              attention, and the foundation for usage limits and billing.
            </p>

            <div className="mt-4 inline-flex rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              Four approved real apps only
            </div>
          </div>

          <button
            type="button"
            onClick={loadOperatorSummary}
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
          >
            Refresh
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Platform"
            value={platformOnline ? "Online" : "Needs Attention"}
            detail={data.system?.service || "embr-server"}
            healthy={platformOnline}
          />

          <Metric
            label="Portfolio Apps"
            value={data.apps?.registeredAppCount ?? 0}
            detail="Approved real integrations"
            healthy
          />

          <Metric
            label="Requests"
            value={formatNumber(data.usage?.totalRequests ?? 0)}
            detail="Approved apps only"
          />

          <Metric
            label="Production"
            value={formatNumber(data.usage?.productionRequests ?? 0)}
            detail="Production requests"
          />

          <Metric
            label="Avg Quality"
            value={
              typeof data.quality?.averageQualityScore === "number"
                ? `${data.quality.averageQualityScore}/100`
                : "No data"
            }
            detail={`${formatNumber(
              data.quality?.totalResponses ?? 0
            )} evaluated responses`}
            healthy={
              typeof data.quality?.averageQualityScore === "number" &&
              data.quality.averageQualityScore >= 80
            }
          />
        </section>

        <Panel
          title="Attention Queue"
          subtitle="Operational signals requiring review across the approved portfolio."
        >
          {attentionItems.length === 0 ? (
            <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 p-4 text-emerald-200">
              No immediate portfolio issues were detected.
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-amber-900 bg-amber-950/20 p-4 text-amber-100"
                >
                  <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-amber-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <section>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Portfolio
            </p>
            <h2 className="mt-1 text-2xl font-bold">Connected Products</h2>
            <p className="mt-2 text-slate-400">
              Demo registrations and unrelated test apps are excluded from every
              total shown here.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {portfolioApps.map((app) => (
              <AppCard key={app.appId} app={app} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Platform Health"
            subtitle="Current Embr infrastructure and intelligence services."
          >
            <div className="grid gap-3 sm:grid-cols-2">
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

          <Panel
            title="Usage & Quality"
            subtitle="Real activity from MindShot, BagFree, Fuel the Flame, and SHCC."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail
                label="Production Requests"
                value={formatNumber(data.usage?.productionRequests ?? 0)}
              />
              <Detail
                label="Test Requests"
                value={formatNumber(data.usage?.testRequests ?? 0)}
              />
              <Detail
                label="Total Tokens"
                value={formatNumber(data.usage?.totalTokens ?? 0)}
              />
              <Detail
                label="Quality Responses"
                value={formatNumber(data.quality?.totalResponses ?? 0)}
              />
              <Detail
                label="Placeholder Risks"
                value={formatNumber(data.quality?.placeholderRiskCount ?? 0)}
              />
              <Detail
                label="Boundary Risks"
                value={formatNumber(data.quality?.boundaryRiskCount ?? 0)}
              />
            </div>
          </Panel>
        </section>

        <Panel
          title="Usage Limits & Billing"
          subtitle="The next Embr platform mission."
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                Not enabled yet
              </div>

              <p className="mt-4 max-w-3xl text-slate-300">
                Exact provider cost, client allowances, Embr credits, soft
                limits, hard caps, rate limits, overages, and gross margin are
                not being calculated or enforced yet. No estimated billing
                figures are shown as real data.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-1">
              <span>Next: immutable usage events</span>
              <span>Then: provider pricing and cost</span>
              <span>Then: plans, allowances, and limits</span>
              <span>Then: billing and margin reporting</span>
            </div>
          </div>
        </Panel>

        <footer className="border-t border-slate-900 py-5 text-sm text-slate-500">
          Historical demo and test records remain preserved for audit but are
          excluded from this portfolio view.
        </footer>
      </div>
    </main>
  );
}

function AppCard({ app }: { app: PortfolioApp }) {
  const quality =
    typeof app.qualityScore === "number"
      ? `${app.qualityScore}/100`
      : "No data";

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {app.appName || app.appId}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{app.appId}</p>
        </div>

        <StatusBadge status={app.status || "unknown"} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Detail label="Owner" value={app.ownerLabel || "Unknown"} />
        <Detail label="Mode" value={app.defaultMode || "unknown"} />
        <Detail
          label="Requests"
          value={formatNumber(app.requests ?? 0)}
        />
        <Detail
          label="Production / Test"
          value={`${formatNumber(app.productionRequests ?? 0)} / ${formatNumber(
            app.testRequests ?? 0
          )}`}
        />
        <Detail
          label="Tokens"
          value={formatNumber(app.totalTokens ?? 0)}
        />
        <Detail label="Quality" value={quality} />
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-900 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Last used: {formatMaybeDate(app.lastUsedAt || null)}</span>
        <span>
          Risk flags: <strong className="text-slate-300">{app.riskFlags ?? 0}</strong>
        </span>
      </div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
      <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  healthy,
}: {
  label: string;
  value: string | number;
  detail: string;
  healthy?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center gap-2">
        {typeof healthy === "boolean" ? (
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              healthy ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        ) : null}

        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const production = normalized === "production" || normalized === "live";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        production
          ? "border-emerald-900 bg-emerald-950/40 text-emerald-300"
          : "border-slate-700 bg-black text-slate-300"
      }`}
    >
      {status}
    </span>
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
