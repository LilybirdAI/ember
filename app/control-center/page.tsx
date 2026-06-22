"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  app: {
    id: string;
    name: string;
    status: string;
    backend: string;
    payments: string;
    embr: string;
    lastChecked: string;
    dataMode?: string;
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
    error?: string;
  };
  business: {
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    payingUsers: number;
    conversion: string;
    estimatedRevenue: string;
    dataMode?: string;
  };
  embr: {
    interactions: number;
    topQuestion: string;
    escalations: number;
    aiUsage: string;
    dataMode?: string;
  };
  attention: string[];
  monthlySummary: string;
};

export default function ControlCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/control-center/mindshot-golf", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Dashboard request failed: ${res.status}`);
      }

      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown dashboard error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-300">Loading Control Center...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-900 bg-red-950/30 p-6">
          <h1 className="text-2xl font-bold text-red-200">
            Control Center unavailable
          </h1>
          <p className="mt-2 text-red-100">{error || "No dashboard data."}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-xl bg-red-200 px-4 py-2 text-sm font-bold text-red-950"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
              Powered by Embr Intelligence
            </p>
            <h1 className="text-4xl font-bold">
              {data.app.name} Control Center
            </h1>
            <p className="max-w-2xl text-slate-400">
              A simple owner view of app health, users, revenue, Embr activity,
              and what needs attention.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black"
          >
            Refresh
          </button>
        </header>

        <section className="rounded-3xl border border-emerald-900/50 bg-emerald-950/20 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-300">
                Live Embr system health connected
              </p>
              <p className="mt-1 text-sm text-emerald-100/80">
                App health, backend status, Embr status, and last checked time
                are coming from the live Embr backend.
              </p>
            </div>
            <p className="text-xs uppercase tracking-wide text-emerald-300">
              {data.app.dataMode || "live"}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatusCard label="App Status" value={data.app.status} />
          <StatusCard label="Backend" value={data.app.backend} />
          <StatusCard label="Payments" value={data.app.payments} />
          <StatusCard label="Embr" value={data.app.embr} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Business Snapshot" badge="Demo metrics">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Total Users" value={data.business.totalUsers} />
              <Metric label="Active Users" value={data.business.activeUsers} />
              <Metric label="Trial Users" value={data.business.trialUsers} />
              <Metric label="Paying Users" value={data.business.payingUsers} />
              <Metric label="Trial Conversion" value={data.business.conversion} />
              <Metric
                label="Estimated Revenue"
                value={data.business.estimatedRevenue}
              />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              User, trial, paying user, conversion, and revenue numbers are demo
              placeholders until MindShot data sources are connected.
            </p>
          </Panel>

          <Panel title="Embr Intelligence" badge="Partial demo">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric
                label="Interactions This Month"
                value={data.embr.interactions}
              />
              <Metric label="AI Usage" value={data.embr.aiUsage} />
              <Metric label="Escalations" value={data.embr.escalations} />
              <Metric label="Last Checked" value={formatDate(data.app.lastChecked)} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Top User Question
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {data.embr.topQuestion}
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Interactions, top question, and usage labels are demo placeholders
              until Embr interaction logs are connected.
            </p>
          </Panel>
        </section>

        <Panel title="What Needs Attention" badge="Owner view">
          <div className="space-y-3">
            {data.attention.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Monthly Summary" badge="Draft summary">
          <p className="text-slate-300">{data.monthlySummary}</p>
        </Panel>

        <Panel title="Live System Details" badge="Internal source">
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
      </div>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  const healthy = ["Healthy", "Online", "Connected", "Active"].includes(value);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${
            healthy ? "bg-emerald-400" : "bg-yellow-400"
          }`}
        />
        <p className="text-2xl font-bold text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        {badge ? (
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950 px-3 py-2">
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
