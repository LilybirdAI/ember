"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BagFreeStatus = {
  appId: string;
  name: string;
  path: string;
  statusLabel: string;
  statusTone: "green" | "yellow" | "red" | "gray";
  dataFreshness: string;
  lastChecked: string | null;
  liveSources: string[];
  pendingSources: string[];
  message: string;
};

function formatTime(value: string | null) {
  if (!value) return "Not connected";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default function BagFreeControlCenterPage() {
  const [status, setStatus] = useState<BagFreeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatus() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/client-status", {
        cache: "no-store",
      });

      if (!response.ok) {
        setError(`Status request failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      const bagfree = data.statuses?.find(
        (item: BagFreeStatus) => item.appId === "bagfree"
      );

      if (!bagfree) {
        setError("BagFree status was not found for this account.");
        return;
      }

      setStatus(bagfree);
    } catch {
      setError("Could not load BagFree operational status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <p className="text-slate-300">Loading BagFree Control Center...</p>
      </main>
    );
  }

  if (error || !status) {
    return (
      <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/30 bg-red-500/10 p-8">
          <h1 className="text-3xl font-semibold text-red-100">
            BagFree Control Center unavailable
          </h1>

          <p className="mt-4 text-red-100/80">{error}</p>

          <button
            onClick={loadStatus}
            className="mt-6 rounded-xl bg-red-300 px-4 py-2 font-semibold text-red-950"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
              Powered by Embr Intelligence
            </p>

            <h1 className="mt-4 text-4xl font-semibold">
              BagFree Control Center
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Operational view of BagFree site health, Travel Brain connection,
              Embr integration status, and what still needs setup.
            </p>
          </div>

          <button
            onClick={loadStatus}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
          >
            Refresh
          </button>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-semibold">{status.statusLabel}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Freshness</p>
            <p className="mt-2 text-2xl font-semibold">{status.dataFreshness}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Last Updated</p>
            <p className="mt-2 text-lg font-semibold">{formatTime(status.lastChecked)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Integration</p>
            <p className="mt-2 text-2xl font-semibold">Embr #2</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Operational Summary
          </p>

          <p className="mt-4 text-lg text-slate-200">{status.message}</p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
              Connected
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {status.liveSources.length ? (
                status.liveSources.map((source) => (
                  <span
                    key={source}
                    className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100"
                  >
                    {source}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-300">No live sources connected yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
              Needs Setup
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {status.pendingSources.length ? (
                status.pendingSources.map((source) => (
                  <span
                    key={source}
                    className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-100"
                  >
                    {source}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-300">No pending setup items.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Next Operational Moves
          </p>

          <ul className="mt-4 space-y-3 text-slate-300">
            <li>Connect Supabase user and membership counts.</li>
            <li>Connect active-user tracking.</li>
            <li>Connect revenue reporting.</li>
            <li>Begin summarizing BagFree Travel Brain usage and top traveler questions.</li>
          </ul>
        </section>

        <div className="mt-8">
          <Link
            href="/client"
            className="inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Back to Client Command Center
          </Link>
        </div>
      </div>
    </main>
  );
}
