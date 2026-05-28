export default function AppIntelligenceNav() {
  return (
    <nav className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/app-intelligence-console"
          className="text-lg font-bold text-slate-100"
        >
          Embr App Intelligence
        </a>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/app-intelligence-console"
            className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            Console
          </a>

          <a
            href="/app-intelligence/apps"
            className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            Apps
          </a>

          <a
            href="/learning"
            className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            Learning
          </a>

          <a
            href="/embr-intelligence"
            className="rounded-xl border border-yellow-500/50 px-3 py-2 text-yellow-300 hover:bg-yellow-500/10"
          >
            Public Site
          </a>
        </div>
      </div>
    </nav>
  );
}
