"use client";

import { useEffect, useState } from "react";

type SystemStatus = {
  ok: boolean;
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

function formatUptime(seconds?: number) {
  if (seconds === undefined || seconds === null) return "Unknown";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SystemStatusPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    try {
      setLoading(true);

      const res = await fetch("/api/system/status", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await res.json()) as SystemStatus;
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

  const online = Boolean(status?.ok);

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Operations Status
          </h2>
          <p className="text-sm text-slate-400">
            Live read-only status for the Embr server and routing systems.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Server</p>
          <p className={online ? "text-green-400" : "text-red-400"}>
            {online ? "Online" : "Offline"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Uptime</p>
          <p className="text-slate-100">{formatUptime(status?.uptimeSeconds)}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Node</p>
          <p className="text-slate-100">{status?.nodeVersion || "Unknown"}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">PID</p>
          <p className="text-slate-100">{status?.pid || "Unknown"}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Route Check
          </p>
          <p className={status?.routeCheckAvailable ? "text-green-400" : "text-yellow-400"}>
            {status?.routeCheckAvailable ? "Available" : "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Learning
          </p>
          <p className={status?.learningAvailable ? "text-green-400" : "text-yellow-400"}>
            {status?.learningAvailable ? "Available" : "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Last Status Time
          </p>
          <p className="text-slate-100">
            {status?.time ? new Date(status.time).toLocaleString() : "Unknown"}
          </p>

          {status?.error ? (
            <p className="mt-2 text-sm text-red-400">{status.error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
