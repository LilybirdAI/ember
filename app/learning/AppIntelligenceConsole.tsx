"use client";

import { useState } from "react";

type AppIntelResponse = {
  ok?: boolean;
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

const presets: Record<string, { mode: string; context: string; message: string }> = {
  "mindshot-golf": {
    mode: "coach",
    message: "What should I focus on after this round?",
    context: JSON.stringify(
      {
        screen: "round_summary",
        score: 87,
        missPattern: "short right",
        mood: "frustrated",
        notes: "Started strong but lost focus on the back nine."
      },
      null,
      2
    ),
  },
  "sobriety-journal": {
    mode: "companion",
    message: "I had a rough craving today. What should I do next?",
    context: JSON.stringify(
      {
        screen: "daily_checkin",
        sobrietyDays: 42,
        mood: "anxious",
        trigger: "stress after work"
      },
      null,
      2
    ),
  },
  "caregiver-companion": {
    mode: "support",
    message: "What should I watch for today?",
    context: JSON.stringify(
      {
        screen: "patient_summary",
        missedMedications: 1,
        sleepHours: 4,
        notes: "More confused than usual this morning."
      },
      null,
      2
    ),
  },
  "random-client-app": {
    mode: "assistant",
    message: "Summarize what I should do next.",
    context: JSON.stringify(
      {
        screen: "dashboard",
        openTasks: 4,
        oldestTaskDays: 9
      },
      null,
      2
    ),
  },
};

export default function AppIntelligenceConsole() {
  const [appId, setAppId] = useState("mindshot-golf");
  const [userId, setUserId] = useState("test-user-1");
  const [mode, setMode] = useState("coach");
  const [memoryScope, setMemoryScope] = useState("app_user");
  const [message, setMessage] = useState(presets["mindshot-golf"].message);
  const [appContext, setAppContext] = useState(presets["mindshot-golf"].context);
  const [result, setResult] = useState<AppIntelResponse | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  function applyPreset(nextAppId: string) {
    setAppId(nextAppId);

    const preset = presets[nextAppId];
    if (!preset) return;

    setMode(preset.mode);
    setMessage(preset.message);
    setAppContext(preset.context);
  }

  async function runAppIntelligenceTest() {
    let parsedContext: unknown;

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

      const res = await fetch("/api/app-intelligence/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId,
          userId,
          mode,
          memoryScope,
          message,
          appContext: parsedContext,
        }),
      });

      const text = await res.text();
      setRaw(text);

      try {
        setResult(JSON.parse(text) as AppIntelResponse);
      } catch {
        setResult({
          ok: false,
          error: "App Intelligence response was not JSON.",
          text,
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown App Intelligence error",
      });
      setRaw("");
    } finally {
      setLoading(false);
    }
  }

  const ok = result?.ok === true;
  const profile = result?.appIntelligence?.appProfileUsed || "Unknown";
  const appName = result?.appIntelligence?.appName || "Unknown";
  const selectedMode = result?.mode || mode;
  const engine = result?.engine || "Unknown";
  const model = result?.model || "Unknown";
  const output = result?.content || result?.response || result?.text || "";

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
          App Intelligence
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-100">
          App Intelligence Console
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Test Embr as an embeddable intelligence layer for any app.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            App ID
          </span>
          <select
            value={appId}
            onChange={(event) => applyPreset(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-slate-500"
          >
            <option value="mindshot-golf">mindshot-golf</option>
            <option value="sobriety-journal">sobriety-journal</option>
            <option value="caregiver-companion">caregiver-companion</option>
            <option value="business-dashboard">business-dashboard</option>
            <option value="random-client-app">random-client-app</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            User ID
          </span>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            Mode
          </span>
          <input
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            Memory Scope
          </span>
          <input
            value={memoryScope}
            onChange={(event) => setMemoryScope(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            Message
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
            App Context JSON
          </span>
          <textarea
            value={appContext}
            onChange={(event) => setAppContext(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100 outline-none focus:border-slate-500"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={runAppIntelligenceTest}
          disabled={loading}
          className="rounded-xl border border-yellow-500 bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
        >
          {loading ? "Testing..." : "Run App Intelligence Test"}
        </button>
      </div>

      {result ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className={ok ? "text-green-400" : "text-red-400"}>
                {ok ? "OK" : "Needs attention"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
              <p className="text-slate-100">{profile}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">App</p>
              <p className="text-slate-100">{appName}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mode</p>
              <p className="text-slate-100">{selectedMode}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Engine</p>
              <p className="text-slate-100">{engine} / {model}</p>
            </div>
          </div>

          {result.placeholderGuardrailApplied ? (
            <div className="mt-3 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              Placeholder guardrail was applied.
            </div>
          ) : null}

          {result.error ? (
            <div className="mt-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
              {result.error}
            </div>
          ) : null}

          {output ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Response</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                {output}
              </p>
            </div>
          ) : null}

          <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <summary className="cursor-pointer text-sm text-slate-300">
              Raw JSON
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
              {raw || JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}
