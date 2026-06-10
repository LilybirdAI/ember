"use client";

import { useEffect, useState } from "react";

type SystemStatus = {
  ok?: boolean;
  service?: string;
  status?: string;
  time?: string;
  uptimeSeconds?: number;
  pid?: number;
  nodeVersion?: string;
  routeCheckAvailable?: boolean;
  learningAvailable?: boolean;
  error?: string;
};

export default function ControlCenterPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    setLoading(true);

    try {
      const res = await fetch("/api/system/status", {
        cache: "no-store",
      });

      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        ok: false,
        service: "embr-server",
        status: "offline",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              Embr Control Center
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              System health, routing readiness, and operational visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Server
            </div>
            <div className="mt-2 text-2xl font-bold">
              {status?.status || "unknown"}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {status?.service || "embr-server"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Route Check
            </div>
            <div className="mt-2 text-2xl font-bold">
              {status?.routeCheckAvailable ? "ready" : "unknown"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Learning
            </div>
            <div className="mt-2 text-2xl font-bold">
              {status?.learningAvailable ? "ready" : "unknown"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-slate-100">
            Server Details
          </h2>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Detail label="OK" value={String(Boolean(status?.ok))} />
            <Detail label="Time" value={status?.time || "unknown"} />
            <Detail
              label="Uptime"
              value={
                typeof status?.uptimeSeconds === "number"
                  ? `${status.uptimeSeconds}s`
                  : "unknown"
              }
            />
            <Detail label="PID" value={status?.pid?.toString() || "unknown"} />
            <Detail
              label="Node"
              value={status?.nodeVersion || "unknown"}
            />
            <Detail
              label="Error"
              value={status?.error || "none"}
              danger={Boolean(status?.error)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-950 px-3 py-2">
      <span className="text-slate-500">{label}:</span>{" "}
      <span className={danger ? "text-red-300" : "text-slate-200"}>
        {value}
      </span>
    </div>
  );
}
