"use client";

import { useEffect, useState } from "react";



type QualitySummary = {
  ok?: boolean;
  totalResponses?: number;
  averageQualityScore?: number;
  placeholderRiskCount?: number;
  boundaryRiskCount?: number;
  inventedDataRiskCount?: number;
  appCount?: number;
  apps?: Array<{
    appId: string;
    appName: string;
    responses: number;
    averageQualityScore: number;
    placeholderRiskCount: number;
    boundaryRiskCount: number;
    inventedDataRiskCount: number;
    lastEvaluatedAt: string | null;
  }>;
  error?: string;
};


type AppProfileListResponse = {
  ok?: boolean;
  profiles?: Array<{
    id: string;
    name: string;
    defaultMode: string;
    tone: string;
    purpose: string;
  }>;
  error?: string;
};

type UsageSummary = {
  ok?: boolean;
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
    placeholderGuardrailCount: number;
    lastUsedAt: string | null;
  }>;
  error?: string;
};

type AppIntelResponse = {
  ok?: boolean;
  type?: string;
  appId?: string;
  userId?: string | null;
  mode?: string;
  memoryScope?: string;
  engine?: string;
  model?: string;
  content?: string;
  response?: string;
  text?: string;
  placeholderGuardrailApplied?: boolean;
  appIntelligence?: {
    appProfileUsed?: string;
    appName?: string;
    appTone?: string;
    contextReceived?: boolean;
  };
  error?: string;
};

const DEFAULT_CONTEXT = JSON.stringify(
  {
    screen: "round_summary",
    score: 87,
    missPattern: "short right",
    mood: "frustrated",
    notes: "Started strong but lost focus on the back nine."
  },
  null,
  2
);

export default function AppIntelligenceConsolePage() {
  const [appId, setAppId] = useState("mindshot-golf");
  const [userId, setUserId] = useState("test-user-1");
  const [mode, setMode] = useState("");
  const [memoryScope, setMemoryScope] = useState("app_user");
  const [environment, setEnvironment] = useState("test");
  const [message, setMessage] = useState("What should I focus on after this round?");
  const [appContext, setAppContext] = useState(DEFAULT_CONTEXT);
  const [result, setResult] = useState<AppIntelResponse | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<AppProfileListResponse["profiles"]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [qualitySummary, setQualitySummary] = useState<QualitySummary | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);



  useEffect(() => {
    loadProfiles();
    loadMetrics();
  }, []);



  async function loadProfiles() {
    try {
      setProfilesLoading(true);

      const res = await fetch("/api/app-intelligence/profiles", {
        cache: "no-store",
      });

      const data = (await res.json()) as AppProfileListResponse;

      if (data.ok && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
    } catch {
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  }

  async function loadMetrics() {
    try {
      setMetricsLoading(true);

      const [usageRes, qualityRes] = await Promise.all([
        fetch("/api/app-intelligence/usage/summary", { cache: "no-store" }),
        fetch("/api/app-intelligence/quality/summary", { cache: "no-store" }),
      ]);

      const usage = (await usageRes.json()) as UsageSummary;
      const quality = (await qualityRes.json()) as QualitySummary;

      setUsageSummary(usage);
      setQualitySummary(quality);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown metrics loading error";

      setUsageSummary({ ok: false, error: message });
      setQualitySummary({ ok: false, error: message });
    } finally {
      setMetricsLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);


  function getCurrentPayload() {
    let parsedContext: unknown = {};

    try {
      parsedContext = appContext.trim() ? JSON.parse(appContext) : {};
    } catch {
      parsedContext = {
        error: "App Context JSON is invalid.",
        raw: appContext,
      };
    }

    const payload: Record<string, unknown> = {
      appId,
      userId,
      environment,
      memoryScope,
      message,
      appContext: parsedContext,
    };

    if (mode.trim()) {
      payload.mode = mode.trim();
    }

    return payload;
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  function getJavaScriptSnippet() {
    return `await fetch("https://YOUR-EMBR-SERVER/app-intelligence/respond", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-embr-app-id": "${appId}",
    "x-embr-app-key": "YOUR_APP_KEY"
  },
  body: JSON.stringify(${JSON.stringify(getCurrentPayload(), null, 2)})
});`;
  }

  function getReactNativeSnippet() {
    return `async function askEmbr(message: string) {
  const res = await fetch("https://YOUR-EMBR-SERVER/app-intelligence/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-embr-app-id": "${appId}",
      "x-embr-app-key": process.env.EXPO_PUBLIC_EMBR_APP_KEY ?? ""
    },
    body: JSON.stringify({
      ...${JSON.stringify(getCurrentPayload(), null, 6)},
      message
    })
  });

  const data = await res.json();
  return data.text || data.response || data.content;
}`;
  }

  function getSwiftSnippet() {
    return `struct EmbrRequest: Encodable {
    let appId: String
    let userId: String
    let environment: String
    let memoryScope: String
    let message: String
    let appContext: [String: String]
}

func askEmbr(message: String) async throws -> String {
    let url = URL(string: "https://YOUR-EMBR-SERVER/app-intelligence/respond")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("${appId}", forHTTPHeaderField: "x-embr-app-id")
    request.setValue("YOUR_APP_KEY", forHTTPHeaderField: "x-embr-app-key")

    let body = EmbrRequest(
        appId: "${appId}",
        userId: "${userId}",
        environment: "${environment}",
        memoryScope: "${memoryScope}",
        message: message,
        appContext: [
            "screen": "current_screen",
            "mood": "user_mood"
        ]
    )

    request.httpBody = try JSONEncoder().encode(body)

    let (data, _) = try await URLSession.shared.data(for: request)
    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

    return json?["text"] as? String
        ?? json?["response"] as? String
        ?? json?["content"] as? String
        ?? ""
}`;
  }



  function applyProfile(appProfileId: string) {
    setAppId(appProfileId);

    const profile = profiles?.find((item) => item.id === appProfileId);

    if (profile?.defaultMode) {
      setMode("");
    }
  }

  async function runTest() {
    let parsedContext: unknown = {};

    try {
      parsedContext = appContext.trim() ? JSON.parse(appContext) : {};
    } catch {
      setResult({
        ok: false,
        error: "App Context must be valid JSON.",
      });
      setRaw("");
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        appId,
        userId,
        memoryScope,
        message,
        appContext: parsedContext,
      };

      if (mode.trim()) {
        payload.mode = mode.trim();
      }

      const res = await fetch("/api/app-intelligence/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setRaw(text);

      try {
        setResult(JSON.parse(text) as AppIntelResponse);
        await loadMetrics();
      } catch {
        setResult({
          ok: false,
          error: "Response was not valid JSON.",
          text,
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setRaw("");
    } finally {
      setLoading(false);
    }
  }

  const output = result?.content || result?.response || result?.text || "";
  const profile = result?.appIntelligence?.appProfileUsed || "Unknown";
  const appName = result?.appIntelligence?.appName || "Unknown";
  const selectedMode = result?.mode || "Unknown";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Embr App Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            App Intelligence Console
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Test Embr as an embeddable intelligence layer for any app using appId,
            userId, mode, memoryScope, message, and appContext.
          </p>
        </section>



        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
              SDK
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Embr Intelligence SDK
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              The TypeScript SDK is the first client integration layer for apps using Embr.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Package</p>
              <p className="text-slate-100">@embr/intelligence</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="text-green-400">SDK v0.1 Ready</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Methods</p>
              <p className="text-slate-100">authCheck · getProfile · respond</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Repo</p>
              <a
                href="https://github.com/LilybirdAI/embr-intelligence-sdk"
                className="text-yellow-300 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GitHub SDK
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Usage
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                App Intelligence Usage
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Server-side usage tracking for app intelligence requests.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMetrics}
              disabled={metricsLoading}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {metricsLoading ? "Refreshing..." : "Refresh Usage"}
            </button>
          </div>

          {usageSummary?.error ? (
            <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
              {usageSummary.error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Requests
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.totalRequests ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Apps
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.appCount ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Tokens
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.totalTokens ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Placeholder Guards
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.placeholderGuardrailCount ?? 0}
              </p>
            </div>
          </div>

          {usageSummary?.apps?.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">Requests</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Dashboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {usageSummary.apps.slice(0, 8).map((app) => (
                    <tr key={app.appId}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-100">
                          {app.appName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.appId}
                        </div>
                      </td>
                      <td className="px-4 py-3">{app.requests}</td>
                      <td className="px-4 py-3">{app.totalTokens}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {app.lastUsedAt
                          ? new Date(app.lastUsedAt).toLocaleString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>


        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Platform Metrics
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Usage + Quality
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Live server-side metrics for Embr App Intelligence.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMetrics}
              disabled={metricsLoading}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {metricsLoading ? "Refreshing..." : "Refresh Metrics"}
            </button>
          </div>

          {usageSummary?.error || qualitySummary?.error ? (
            <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
              {usageSummary?.error || qualitySummary?.error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total Requests
              </p>
              <p className="text-2xl font-semibold">
                {usageSummary?.totalRequests ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-green-300">
                Production
              </p>
              <p className="text-2xl font-semibold text-green-200">
                {usageSummary?.productionRequests ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-300">
                Test / Demo
              </p>
              <p className="text-2xl font-semibold text-blue-200">
                {usageSummary?.testRequests ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Avg Quality
              </p>
              <p className="text-2xl font-semibold">
                {qualitySummary?.averageQualityScore ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Risk Flags
              </p>
              <p className="text-2xl font-semibold">
                {(qualitySummary?.boundaryRiskCount ?? 0) +
                  (qualitySummary?.inventedDataRiskCount ?? 0) +
                  (qualitySummary?.placeholderRiskCount ?? 0)}
              </p>
            </div>
          </div>

          {usageSummary?.apps?.length || qualitySummary?.apps?.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Prod</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Avg Quality</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {(usageSummary?.apps || []).slice(0, 8).map((app) => {
                    const qualityApp = qualitySummary?.apps?.find(
                      (item) => item.appId === app.appId
                    );

                    return (
                      <tr key={app.appId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-100">
                            {app.appName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {app.appId}
                          </div>
                        </td>
                        <td className="px-4 py-3">{app.requests}</td>
                        <td className="px-4 py-3 text-green-300">
                          {app.productionRequests ?? 0}
                        </td>
                        <td className="px-4 py-3 text-blue-300">
                          {app.testRequests ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          {qualityApp?.averageQualityScore ?? "—"}
                        </td>
                        <td className="px-4 py-3">{app.totalTokens}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {app.lastUsedAt
                            ? new Date(app.lastUsedAt).toLocaleString()
                            : "Unknown"}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/app-intelligence/apps/${app.appId}`}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-slate-800"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>


        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
                Payload
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Current Integration Payload
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Copy the exact JSON payload currently configured in the console.
              </p>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(getCurrentPayload(), null, 2))}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Copy Payload
            </button>
          </div>

          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
            {JSON.stringify(getCurrentPayload(), null, 2)}
          </pre>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                App ID
              </span>
              <select
                value={profiles?.some((profile) => profile.id === appId) ? appId : "__custom__"}
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setAppId("");
                    return;
                  }

                  applyProfile(event.target.value);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              >
                {profilesLoading ? (
                  <option value={appId}>Loading profiles...</option>
                ) : null}

                {profiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} — {profile.id}
                  </option>
                ))}

                <option value="__custom__">Custom appId</option>
              </select>

              <input
                value={appId}
                onChange={(event) => setAppId(event.target.value)}
                placeholder="custom-app-id"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                User ID
              </span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Mode Override
              </span>
              <input
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                placeholder="blank = registry default"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Memory Scope
              </span>
              <input
                value={memoryScope}
                onChange={(event) => setMemoryScope(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Environment
              </span>
              <select
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              >
                <option value="test">test</option>
                <option value="staging">staging</option>
                <option value="production">production</option>
              </select>
            </label>

          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Message
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-36 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-yellow-500"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                App Context JSON
              </span>
              <textarea
                value={appContext}
                onChange={(event) => setAppContext(event.target.value)}
                className="min-h-36 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs outline-none focus:border-yellow-500"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={runTest}
              disabled={loading}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading ? "Testing..." : "Run Test"}
            </button>
          </div>
        </section>


        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
              Integration
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              App Intelligence API Snippets
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Starter examples for wiring Embr into web, React Native, and iOS apps.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">
                  JavaScript / Web
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getJavaScriptSnippet())}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-yellow-300 hover:bg-slate-800"
                >
                  Copy JavaScript
                </button>
              </div>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
{`await fetch("https://YOUR-EMBR-SERVER/app-intelligence/respond", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-embr-app-id": "mindshot-golf",
    "x-embr-app-key": "YOUR_APP_KEY"
  },
  body: JSON.stringify({
    appId: "mindshot-golf",
    userId: currentUser.id,
    environment: "production",
    memoryScope: "app_user",
    message: userMessage,
    appContext: {
      screen: "round_summary",
      score: 87,
      missPattern: "short right",
      mood: "frustrated"
    }
  })
});`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">
                  React Native / Expo
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getReactNativeSnippet())}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-yellow-300 hover:bg-slate-800"
                >
                  Copy RN
                </button>
              </div>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
{`async function askEmbr(message: string) {
  const res = await fetch("https://YOUR-EMBR-SERVER/app-intelligence/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-embr-app-id": "mindshot-golf",
      "x-embr-app-key": process.env.EXPO_PUBLIC_EMBR_APP_KEY ?? ""
    },
    body: JSON.stringify({
      appId: "mindshot-golf",
      userId: user.id,
      environment: "production",
      memoryScope: "app_user",
      message,
      appContext: {
        screen: "round_summary",
        score,
        missPattern,
        mood
      }
    })
  });

  const data = await res.json();
  return data.text || data.response || data.content;
}`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">
                  Swift / iOS
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getSwiftSnippet())}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-yellow-300 hover:bg-slate-800"
                >
                  Copy Swift
                </button>
              </div>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
{`struct EmbrRequest: Encodable {
    let appId: String
    let userId: String
    let environment: String
    let memoryScope: String
    let message: String
    let appContext: [String: String]
}

func askEmbr(message: String) async throws -> String {
    let url = URL(string: "https://YOUR-EMBR-SERVER/app-intelligence/respond")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("mindshot-golf", forHTTPHeaderField: "x-embr-app-id")
    request.setValue("YOUR_APP_KEY", forHTTPHeaderField: "x-embr-app-key")

    let body = EmbrRequest(
        appId: "mindshot-golf",
        userId: "user_123",
        environment: "production",
        memoryScope: "app_user",
        message: message,
        appContext: [
            "screen": "round_summary",
            "mood": "frustrated",
            "missPattern": "short right"
        ]
    )

    request.httpBody = try JSONEncoder().encode(body)

    let (data, _) = try await URLSession.shared.data(for: request)
    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

    return json?["text"] as? String
        ?? json?["response"] as? String
        ?? json?["content"] as? String
        ?? ""
}`}
              </pre>
            </div>
          </div>
        </section>


        {result ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className={result.ok ? "text-green-400" : "text-red-400"}>
                  {result.ok ? "OK" : "Needs attention"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Profile
                </p>
                <p>{profile}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  App
                </p>
                <p>{appName}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Mode
                </p>
                <p>{selectedMode}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Engine
                </p>
                <p>
                  {result.engine || "Unknown"} / {result.model || "Unknown"}
                </p>
              </div>
            </div>

            {result.placeholderGuardrailApplied ? (
              <div className="mt-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-200">
                Placeholder guardrail was applied.
              </div>
            ) : null}

            {result.error ? (
              <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
                {result.error}
              </div>
            ) : null}

            {output ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Response
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">
                  {output}
                </p>
              </div>
            ) : null}

            {result?.appId ? (
            <div className="mt-4">
              <a
                href={`/app-intelligence/apps/${result.appId}`}
                className="inline-flex rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-yellow-300 hover:bg-slate-800"
              >
                Open App Dashboard
              </a>
            </div>
          ) : null}

          <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <summary className="cursor-pointer text-sm text-slate-300">
                Raw JSON
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                {raw || JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        ) : null}
      </div>
    </main>
  );
}
