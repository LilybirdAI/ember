"use client";

export default function AppIntelligenceConsole() {
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
          App Intelligence
        </p>

        <h2 className="mt-2 text-lg font-semibold text-slate-100">
          App Intelligence Console
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Embr can now run as an embeddable intelligence layer for any app using appId, userId, mode, memoryScope, message, and appContext.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Endpoint</p>
          <p className="text-slate-100">/app-intelligence/respond</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Known Apps</p>
          <p className="text-slate-100">Registry Enabled</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fallback</p>
          <p className="text-slate-100">Generic App</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <p className="text-green-400">Ready</p>
        </div>
      </div>
    </section>
  );
}
