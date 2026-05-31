export default function AppIntelligenceNav() {
  const clientLinks = [
    { href: "/app-intelligence/apps", label: "Connected Apps" },
  ];

  const developerLinks = [
    { href: "/app-intelligence-console", label: "Developer Console" },
  ];

  const internalLinks = [
    { href: "/learning", label: "Operations" },
  ];

  const publicLinks = [
    { href: "/embr-intelligence", label: "Public Site" },
  ];

  function renderLinks(
    title: string,
    links: Array<{ href: string; label: string }>,
    highlight = false
  ) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {title}
        </p>

        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                highlight
                  ? "rounded-xl border border-yellow-500/50 px-3 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10"
                  : "rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <a href="/app-intelligence/apps" className="group">
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
              Embr Intelligence
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-slate-100 group-hover:text-yellow-300">
                SaaS Control Center
              </span>

              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Live
              </span>

              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
                Supabase + JSONL fallback
              </span>
            </div>
          </a>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            <span className="font-semibold text-slate-100">Platform map:</span>{" "}
            client workspace, developer tools, internal operations, public product site.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {renderLinks("Client Workspace", clientLinks)}
          {renderLinks("Developer Tools", developerLinks)}
          {renderLinks("Internal / Admin", internalLinks)}
          {renderLinks("Public", publicLinks, true)}
        </div>
      </div>
    </nav>
  );
}
