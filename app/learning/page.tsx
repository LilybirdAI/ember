"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function LearningPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [rules, setRules] = useState("");
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const recentFeedback = useMemo(
    () => events.filter((event) => event.feedbackSignal).slice(-10).reverse(),
    [events]
  );

  async function loadLearning() {
    setError("");
    setLoading(true);

    try {
      const [summaryRes, eventsRes, rulesRes, correctionsRes] = await Promise.all([
        fetch("/api/learning/summary", { cache: "no-store" }),
        fetch("/api/learning/events", { cache: "no-store" }),
        fetch("/api/learning/rules", { cache: "no-store" }),
        fetch("/api/learning/corrections", { cache: "no-store" }),
      ]);

      const summaryJson = (await summaryRes.json()) as SummaryResponse;
      const eventsJson = (await eventsRes.json()) as EventsResponse;
      const rulesJson = (await rulesRes.json()) as RulesResponse;
      const correctionsJson = (await correctionsRes.json()) as CorrectionsResponse;

      if (!summaryRes.ok) throw new Error(summaryJson.error || "Could not load summary.");
      if (!eventsRes.ok) throw new Error(eventsJson.error || "Could not load events.");
      if (!rulesRes.ok) throw new Error(rulesJson.error || "Could not load rules.");
      if (!correctionsRes.ok) throw new Error(correctionsJson.error || "Could not load corrections.");

      setSummary(summaryJson);
      setEvents(eventsJson.events || []);
      setRules(rulesJson.rules || "");
      setCorrections(correctionsJson.corrections || []);
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

  async function createCorrection() {
    setWorking(true);
    setError("");

    try {
      const res = await fetch("/api/learning/correct", {
        method: "POST",
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

  useEffect(() => {
    loadLearning();
  }, []);

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
