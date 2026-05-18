"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type LearningEvent = {
  time?: string;
  type?: string;
  message?: string;
  domain?: string;
  priority?: string;
  engine?: string;
  model?: string;
  nextMove?: string;
  ok?: boolean;
  error?: string;
  feedbackSignal?: string | null;
  feedbackTarget?: {
    time?: string;
    message?: string;
    domain?: string;
    priority?: string;
    engine?: string;
    model?: string;
    nextMove?: string;
  } | null;
};

type SummaryResponse = {
  ok?: boolean;
  totalEvents?: number;
  byDomain?: Record<string, number>;
  byEngine?: Record<string, number>;
  positive?: number;
  negative?: number;
  errors?: number;
  summary?: string;
  error?: string;
};

type EventsResponse = {
  ok?: boolean;
  events?: LearningEvent[];
  error?: string;
};

type RulesResponse = {
  ok?: boolean;
  rules?: string;
  error?: string;
};

type Correction = {
  ok?: boolean;
  time?: string;
  status?: string;
  feedbackSignal?: string;
  feedbackMessage?: string;
  repeatedCount?: number;
  confidence?: string;
  proposedAction?: string;
  safeToAutoApply?: boolean;
  target?: {
    time?: string;
    message?: string;
    domain?: string;
    priority?: string;
    engine?: string;
    model?: string;
    nextMove?: string;
  } | null;
};

type CorrectionsResponse = {
  ok?: boolean;
  corrections?: Correction[];
  error?: string;
};

type AppliedCorrection = {
  ok?: boolean;
  time?: string;
  fingerprint?: string;
  risk?: string;
  autoApplied?: boolean;
  appliedTo?: string;
  rule?: string;
  skippedBecause?: string | null;
  feedbackSignal?: string | null;
  target?: {
    time?: string;
    message?: string;
    domain?: string;
    priority?: string;
    engine?: string;
    model?: string;
    nextMove?: string;
  } | null;
};

type AppliedCorrectionsResponse = {
  ok?: boolean;
  applied?: AppliedCorrection[];
  error?: string;
};

type ProfileResponse = {
  ok?: boolean;
  profile?: {
    appId?: string;
    userId?: string;
    name?: string;
    location?: string;
    city?: string;
    state?: string;
    updatedAt?: string;
    facts?: Record<string, string>;
    preferences?: Record<string, string>;
  };
  error?: string;
};

export default function LearningPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [rules, setRules] = useState("");
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [appliedCorrections, setAppliedCorrections] = useState<AppliedCorrection[]>([]);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const [profileError, setProfileError] = useState("");
  const [newRule, setNewRule] = useState("");
  const [dashboardKey, setDashboardKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const recentFeedback = useMemo(
    () => events.filter((event) => event.feedbackSignal).slice(-10).reverse(),
    [events]
  );

  function learningHeaders() {
    return {
      "x-embr-dashboard-key": dashboardKey,
    };
  }

  async function learningHeadersWithAuth() {
    const headers: Record<string, string> = {
      ...learningHeaders(),
    };

    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async function loadLearning() {
    if (!dashboardKey) {
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const profileHeaders = await learningHeadersWithAuth();

      const [
        summaryRes,
        eventsRes,
        rulesRes,
        correctionsRes,
        appliedCorrectionsRes,
        profileRes,
      ] = await Promise.all([
        fetch("/api/learning/summary", {
          cache: "no-store",
          headers: learningHeaders(),
        }),
        fetch("/api/learning/events", {
          cache: "no-store",
          headers: learningHeaders(),
        }),
        fetch("/api/learning/rules", {
          cache: "no-store",
          headers: learningHeaders(),
        }),
        fetch("/api/learning/corrections", {
          cache: "no-store",
          headers: learningHeaders(),
        }),
        fetch("/api/learning/applied-corrections", {
          cache: "no-store",
          headers: learningHeaders(),
        }),
        fetch("/api/learning/profile", {
          cache: "no-store",
          headers: profileHeaders,
        }),
      ]);

      const summaryJson = (await summaryRes.json()) as SummaryResponse;
      const eventsJson = (await eventsRes.json()) as EventsResponse;
      const rulesJson = (await rulesRes.json()) as RulesResponse;
      const correctionsJson = (await correctionsRes.json()) as CorrectionsResponse;
      const appliedCorrectionsJson =
        (await appliedCorrectionsRes.json()) as AppliedCorrectionsResponse;
      const profileJson = (await profileRes.json()) as ProfileResponse;

      if (!summaryRes.ok) throw new Error(summaryJson.error || "Could not load summary.");
      if (!eventsRes.ok) throw new Error(eventsJson.error || "Could not load events.");
      if (!rulesRes.ok) throw new Error(rulesJson.error || "Could not load rules.");
      if (!correctionsRes.ok) throw new Error(correctionsJson.error || "Could not load corrections.");
      if (!appliedCorrectionsRes.ok) {
        throw new Error(appliedCorrectionsJson.error || "Could not load applied corrections.");
      }
      setSummary(summaryJson);
      setEvents(eventsJson.events || []);
      setRules(rulesJson.rules || "");
      setCorrections(correctionsJson.corrections || []);
      setAppliedCorrections(appliedCorrectionsJson.applied || []);

      if (!profileRes.ok) {
        setProfile(null);
        setProfileError(profileJson.error || "Sign in required to view profile memory.");
      } else {
        setProfile(profileJson.profile || null);
        setProfileError("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load learning data.");
    } finally {
      setLoading(false);
    }
  }

  async function runReflection() {
    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/reflect", {
        method: "POST",
        headers: learningHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not run reflection.");
      }

      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run reflection.");
    } finally {
      setWorking(false);
    }
  }

  async function clearProfileMemory(
    clearTarget: "location" | "name" | "preferences" | "all" = "all"
  ) {
    const labels = {
      location: "saved location",
      name: "saved name",
      preferences: "saved preferences",
      all: "all profile memory",
    };

    const confirmed = window.confirm(
      `Clear Embr ${labels[clearTarget]}?`
    );

    if (!confirmed) return;

    setWorking(true);
    setError("");

    try {
      const res = await fetch(
        `/api/learning/profile?clear=${encodeURIComponent(clearTarget)}`,
        {
          method: "DELETE",
          headers: await learningHeadersWithAuth(),
        }
      );

      const data = await res.json();

      console.log("Clear profile response:", data);

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not clear profile memory.");
      }

      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear profile memory.");
    } finally {
      setWorking(false);
    }
  }

  async function reportWrongRoute(event: any) {
    const expectedDomain = window.prompt(
      "Expected domain? Examples: general, weather, profile_memory, technical, culture, news, knowledge, business",
      event?.domain || ""
    );

    if (!expectedDomain?.trim()) return;

    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/correct", {
        method: "POST",
        headers: learningHeaders(),
        body: JSON.stringify({
          type: "wrong_route",
          message: event?.message || "",
          time: event?.time || "",
          actualDomain: event?.domain || "unknown",
          actualEngine: event?.engine || "unknown",
          expectedDomain: expectedDomain.trim(),
          event,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not create wrong-route correction.");
      }

      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create wrong-route correction.");
    } finally {
      setWorking(false);
    }
  }

  async function promoteCorrectionToSmokeTest(correction: any) {
    const expectedDomain = correction?.expected?.domain;
    const message = correction?.target?.message;

    if (!expectedDomain || !message) {
      setError("This correction is missing a message or expected domain.");
      return;
    }

    const confirmed = window.confirm(
      `Promote this correction to a router smoke test?\n\n"${message}" → ${expectedDomain}`
    );

    if (!confirmed) return;

    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/promote-smoke-test", {
        method: "POST",
        headers: learningHeaders(),
        body: JSON.stringify({
          correction,
          message,
          actualDomain: correction?.target?.domain || "unknown",
          actualEngine: correction?.target?.engine || "unknown",
          expectedDomain,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not promote correction to smoke test.");
      }

      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not promote correction to smoke test.");
    } finally {
      setWorking(false);
    }
  }

  async function applyLowRiskCorrections() {
    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/apply-low-risk", {
        method: "POST",
        headers: learningHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not apply low-risk corrections.");
      }

      await loadLearning();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not apply low-risk corrections."
      );
    } finally {
      setWorking(false);
    }
  }

  async function createCorrection() {
    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/correct", {
        method: "POST",
        headers: learningHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not create correction.");
      }

      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create correction.");
    } finally {
      setWorking(false);
    }
  }

  async function addRule() {
    const rule = newRule.trim();

    if (!rule) return;

    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...learningHeaders(),
        },
        body: JSON.stringify({ rule }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not add rule.");
      }

      setNewRule("");
      await loadLearning();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add rule.");
    } finally {
      setWorking(false);
    }
  }

  function unlockDashboard() {
    const cleanKey = keyInput.trim();

    if (!cleanKey) {
      setError("Enter the dashboard key.");
      return;
    }

    sessionStorage.setItem("embr_dashboard_key", cleanKey);
    setDashboardKey(cleanKey);
    setUnlocked(true);
    setError("");
  }

  function lockDashboard() {
    sessionStorage.removeItem("embr_dashboard_key");
    setDashboardKey("");
    setKeyInput("");
    setUnlocked(false);
    setSummary(null);
    setEvents([]);
    setRules("");
    setCorrections([]);
    setAppliedCorrections([]);
    setProfile(null);
    setProfileError("");
  }

  useEffect(() => {
    const savedKey = sessionStorage.getItem("embr_dashboard_key") || "";

    if (savedKey) {
      setDashboardKey(savedKey);
      setKeyInput(savedKey);
      setUnlocked(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dashboardKey && unlocked) {
      loadLearning();
    }
  }, [dashboardKey, unlocked]);

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-yellow-400">
            Embr Learning
          </div>
          <h1 className="mt-2 text-3xl font-bold">Dashboard Locked</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your private dashboard key to view Embr learning data. This is
            separate from the server admin token.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") unlockDashboard();
              }}
              placeholder="Dashboard key"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-yellow-400"
            />

            <button
              onClick={unlockDashboard}
              className="w-full rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400"
            >
              Unlock Learning Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-yellow-400">
            Embr Learning
          </div>
          <h1 className="mt-2 text-3xl font-bold">Learning Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Watch Embr learn from routing, feedback, mistakes, and approved rules.
            This dashboard does not expose the admin token to the browser.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={loadLearning}
              disabled={loading || working}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              onClick={runReflection}
              disabled={loading || working}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-50"
            >
              Run Reflection
            </button>

            <button
              onClick={createCorrection}
              disabled={loading || working}
              className="rounded-xl border border-yellow-500/60 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
            >
              Create Self-Correction
            </button>

            <button
              onClick={applyLowRiskCorrections}
              disabled={loading || working}
              className="rounded-xl border border-emerald-500/60 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              Apply Low-Risk
            </button>

            <button
              onClick={lockDashboard}
              disabled={working}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Lock Dashboard
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
            Loading Embr learning data...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Events" value={summary?.totalEvents ?? events.length} />
              <StatCard label="Positive" value={summary?.positive ?? 0} />
              <StatCard label="Negative" value={summary?.negative ?? 0} />
              <StatCard label="Errors" value={summary?.errors ?? 0} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Panel title="Profile Memory">
                {profileError && (
                  <div className="mb-3 rounded-xl border border-yellow-500/30 bg-yellow-950/30 p-3 text-sm text-yellow-200">
                    {profileError}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <span className="text-slate-500">App ID:</span>{" "}
                    <span className="text-slate-200">{profile?.appId || "Unknown"}</span>
                  </div>

                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <span className="text-slate-500">User ID:</span>{" "}
                    <span className="text-slate-200 break-all">
                      {profile?.userId || "Unknown"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <span className="text-slate-500">Name:</span>{" "}
                    <span className="text-slate-200">{profile?.name || "Not saved"}</span>
                  </div>

                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <span className="text-slate-500">Location:</span>{" "}
                    <span className="text-slate-200">
                      {profile?.location || "Not saved"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <span className="text-slate-500">Updated:</span>{" "}
                    <span className="text-slate-200">
                      {profile?.updatedAt || "Unknown"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950 px-3 py-2">
                    <div className="mb-2 text-slate-500">Preference Memory:</div>

                    {profile?.preferences && Object.keys(profile.preferences).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(profile.preferences).map(([key, value]) => (
                          <div key={key} className="text-xs leading-5">
                            <span className="text-yellow-400">{key}:</span>{" "}
                            <span className="text-slate-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">No preferences saved.</div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => clearProfileMemory("location")}
                      disabled={working}
                      className="rounded-xl border border-yellow-500/60 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                    >
                      Clear Location
                    </button>

                    <button
                      onClick={() => clearProfileMemory("name")}
                      disabled={working}
                      className="rounded-xl border border-yellow-500/60 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                    >
                      Clear Name
                    </button>

                    <button
                      onClick={() => clearProfileMemory("preferences")}
                      disabled={working}
                      className="rounded-xl border border-yellow-500/60 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                    >
                      Clear Preferences
                    </button>

                    <button
                      onClick={() => clearProfileMemory("all")}
                      disabled={working}
                      className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </Panel>
              <Panel title="Domains">
                <KeyValueList data={summary?.byDomain || {}} />
              </Panel>

              <Panel title="Engines / Tools">
                <KeyValueList data={summary?.byEngine || {}} />
              </Panel>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              
              <Panel title="Active Approved Rules">
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">
                  {rules || "No active rules loaded."}
                </pre>

                <div className="mt-4 space-y-3">
                  <textarea
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add an approved learning rule..."
                    className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-yellow-400"
                  />

                  <button
                    onClick={addRule}
                    disabled={working || !newRule.trim()}
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-400 disabled:opacity-50"
                  >
                    Add Approved Rule
                  </button>
                </div>
              </Panel>

              <Panel title="Recent Feedback">
                {recentFeedback.length === 0 ? (
                  <p className="text-sm text-slate-400">No feedback logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentFeedback.map((event, index) => (
                      <div
                        key={`${event.time}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                      >
                        <div className="text-xs uppercase tracking-wide text-yellow-400">
                          {event.feedbackSignal}
                        </div>
                        <div className="mt-1 text-sm text-slate-200">
                          “{event.message || "No message"}”
                        </div>
                        {event.feedbackTarget && (
                          <div className="mt-2 text-xs leading-5 text-slate-400">
                            Target: {event.feedbackTarget.domain || "unknown"} /{" "}
                            {event.feedbackTarget.engine || "unknown"}
                            <br />
                            Previous: {event.feedbackTarget.message || "No target message"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </section>

            <Panel title="Applied Low-Risk Corrections">
              {appliedCorrections.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No low-risk corrections applied yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {appliedCorrections.slice(-10).reverse().map((item, index) => (
                    <div
                      key={`${item.time}-${index}`}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-emerald-400">
                        <span>{item.autoApplied ? "auto-applied" : "reviewed"}</span>
                        {item.risk && <span>· {item.risk} risk</span>}
                        {item.appliedTo && <span>· {item.appliedTo}</span>}
                      </div>

                      <div className="mt-2 text-sm text-slate-200">
                        {item.rule || "No rule recorded."}
                      </div>

                      {item.skippedBecause && (
                        <div className="mt-2 rounded-lg bg-slate-900 p-2 text-xs text-slate-400">
                          Skipped: {item.skippedBecause}
                        </div>
                      )}

                      {item.target && (
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          Target: {item.target.domain || "unknown"} /{" "}
                          {item.target.engine || "unknown"}
                          <br />
                          Previous: {item.target.message || "No target message"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Self-Corrections">
              {corrections.length === 0 ? (
                <p className="text-sm text-slate-400">No self-corrections created yet.</p>
              ) : (
                <div className="space-y-3">
                  {corrections.slice(-10).reverse().map((correction, index) => (
                    <div
                      key={`${correction.time}-${index}`}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
                        <span>{correction.status || "correction"}</span>
                        {correction.confidence && <span>· {correction.confidence}</span>}
                        {correction.safeToAutoApply === false && <span>· approval required</span>}
                      </div>

                      <div className="mt-2 text-sm text-slate-200">
                        {correction.proposedAction || "No proposed action."}
                      </div>

                      {correction.target && (
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          Target: {correction.target.domain || "unknown"} /{" "}
                          {correction.target.engine || "unknown"}
                          <br />
                          Previous: {correction.target.message || "No target message"}
                        </div>
                      )}

                      {correction.feedbackMessage && (
                        <div className="mt-2 rounded-lg bg-slate-900 p-2 text-xs text-slate-400">
                          Feedback: “{correction.feedbackMessage}”
                        </div>
                      )}

                      {(correction as any).correctionType === "wrong_route" &&
                        (correction as any).expected?.domain &&
                        correction.target?.message && (
                          <button
                            type="button"
                            onClick={() => promoteCorrectionToSmokeTest(correction)}
                            disabled={working}
                            className="mt-3 rounded-lg border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            Promote to Smoke Test
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recent Learning Events">
              <div className="space-y-3">
                {events.slice(-20).reverse().map((event, index) => (
                  <div
                    key={`${event.time}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{event.time || "unknown time"}</span>
                      <span>·</span>
                      <span>{event.type || "event"}</span>
                      {event.domain && (
                        <>
                          <span>·</span>
                          <span>{event.domain}</span>
                        </>
                      )}
                      {event.engine && (
                        <>
                          <span>·</span>
                          <span>{event.engine}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-slate-200">
                      {event.message || "No message"}
                    </div>

                    {event.error && (
                      <div className="mt-2 rounded-lg bg-red-950/40 p-2 text-xs text-red-200">
                        {event.error}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => reportWrongRoute(event)}
                      disabled={working}
                      className="mt-3 rounded-lg border border-yellow-500/50 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                    >
                      Wrong Route
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-yellow-400">{value}</div>
    </div>
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function KeyValueList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-sm"
        >
          <span className="text-slate-300">{key}</span>
          <span className="font-semibold text-yellow-400">{value}</span>
        </div>
      ))}
    </div>
  );
}
