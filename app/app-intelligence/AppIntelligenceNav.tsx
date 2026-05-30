export default function AppIntelligenceNav() {
  const links = [
    { href: "/app-intelligence/apps", label: "Connected Apps" },
    { href: "/app-intelligence-console", label: "Developer Console" },
    { href: "/learning", label: "Operations" },
    { href: "/embr-intelligence", label: "Public Site", highlight: true },
  ];

  return (
    <nav className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <a href="/app-intelligence/apps" className="group">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Embr Intelligence
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-slate-100 group-hover:text-yellow-300">
              SaaS Control Center
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              Live
            </span>
          </div>
        </a>

        <div className="flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                link.highlight
                  ? "rounded-xl border border-yellow-500/50 px-3 py-2 font-semibold text-yellow-300 hover:bg-yellow-500/10"
                  : "rounded-xl border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800"
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
