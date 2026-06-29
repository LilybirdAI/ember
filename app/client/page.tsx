"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientApp = {
  appId: string;
  name: string;
  description: string;
  path: string;
  status: "live" | "coming-soon";
};

type ClientAccount = {
  username: string;
  displayName: string;
  role: "admin" | "client";
  landingPath: string;
  apps: ClientApp[];
};

type AppStatus = {
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

function toneClasses(tone: AppStatus["statusTone"]) {
  if (tone === "green") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (tone === "yellow") return "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
  if (tone === "red") return "border-red-400/30 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/5 text-slate-300";
}

export default function ClientHomePage() {
  const router = useRouter();
  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [statuses, setStatuses] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const statusByAppId = useMemo(() => {
    return new Map(statuses.map((status) => [status.appId, status]));
  }, [statuses]);

  async function loadDashboard() {
    const sessionResponse = await fetch("/api/client-session", { cache: "no-store" });

    if (!sessionResponse.ok) {
      router.replace("/client-login");
      return;
    }

    const sessionData = await sessionResponse.json();
    setAccount(sessionData.account);

    const statusResponse = await fetch("/api/client-status", { cache: "no-store" });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      setStatuses(statusData.statuses || []);
    }

    setLoading(false);
  }

  async function logout() {
    await fetch("/api/client-logout", { method: "POST" });
    router.replace("/client-login");
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading Embr Command Center...</p>
      </main>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
              Embr Intelligence
            </p>

            <h1 className="mt-4 text-4xl font-semibold">
              Client Command Center
            </h1>

            <p className="mt-3 text-slate-300">
              Signed in as {account.displayName}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        {account.role === "admin" ? (
          <Link
            href="/operator"
            className="mt-8 block rounded-2xl border border-blue-400/30 bg-blue-500/10 p-5 hover:bg-blue-500/15"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
              Admin
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Open Embr Operator Dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Internal view for all client apps, platform health, and Embr operations.
            </p>
          </Link>
        ) : null}

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {account.apps.map((app) => {
            const status = statusByAppId.get(app.appId);

            return (
              <div
                key={app.appId}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{app.name}</h2>
                    <p className="mt-2 text-sm text-slate-300">{app.description}</p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      status ? toneClasses(status.statusTone) : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {status?.statusLabel || "Checking"}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Operational Status
                  </p>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Freshness</p>
                      <p className="font-semibold text-white">
                        {status?.dataFreshness || "Checking"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Last Updated</p>
                      <p className="font-semibold text-white">
                        {formatTime(status?.lastChecked || null)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-300">
                    {status?.message || "Checking operational data..."}
                  </p>
                </div>

                {status?.liveSources?.length ? (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                      Connected
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {status.liveSources.map((source) => (
                        <span
                          key={source}
                          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {status?.pendingSources?.length ? (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                      Needs Setup
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {status.pendingSources.map((source) => (
                        <span
                          key={source}
                          className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-100"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {app.status === "live" ? (
                  <Link
                    href={app.path}
                    className="mt-5 inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-400"
                  >
                    Open Command Center
                  </Link>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    This Command Center is reserved and will activate when the app is connected to Embr.
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
