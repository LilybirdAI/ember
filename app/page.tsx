import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const proofApps = [
  {
    name: "MindShot Golf",
    label: "Integration #1",
    text: "A live owner command center showing app health, Embr usage, quality score, risk flags, and business-metric wiring.",
  },
  {
    name: "BagFree",
    label: "Integration #2",
    text: "BagFree Travel Brain is powered by Embr, with operational status, Netlify Functions, Stripe visibility, and setup tracking.",
  },

  {
    name: "Fuel the Flame",
    label: "Integration #3",
    text: "Embr is already active inside Fuel the Flame, with a dedicated command center and operational status connection being wired next.",
  },
  {
    name: "Sober House Command Center",
    label: "Embr-Powered Product",
    text: "A live sober-living operations MVP for beds, residents, rent, drug screens, incidents, and daily oversight—with Embr turning house activity into clear operational next steps.",
  },
];

const routingExamples = [
  {
    task: "Fast, lightweight work",
    route: "GPT-5.6 Luna or Claude Haiku",
    text: "Classification, extraction, quick summaries, and low-cost repetitive tasks.",
  },
  {
    task: "Normal production work",
    route: "GPT-5.6 Terra or Claude Sonnet",
    text: "Everyday reasoning, planning, writing, technical review, and app intelligence.",
  },
  {
    task: "Complex decisions",
    route: "GPT-5.6 Sol or Claude Opus",
    text: "Architecture, difficult debugging, security analysis, and high-value reasoning.",
  },
  {
    task: "Current facts and research",
    route: "Perplexity",
    text: "Fresh information, source-backed answers, news, markets, and research workflows.",
  },
  {
    task: "Long-context and specialized work",
    route: "Gemini",
    text: "Large-context workloads, alternate reasoning, and specialized multimodal tasks.",
  },
];

export default async function Home() {
  const headerStore = await headers();
  const host = headerStore.get("host") || "";

  if (host.startsWith("app.")) {
    redirect("/client");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold tracking-tight">Embr Intelligence</p>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                The orchestration layer for intelligent software
              </p>
            </div>

            <Link
              href="https://app.embrintelligence.ai"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Client Login
            </Link>
          </nav>

          <div className="grid gap-10 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
                Multi-model orchestration for real software
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
                The intelligence layer between people, AI models, and business systems.
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
                Embr automatically selects the right models, tools, workflows,
                context, and reasoning for every task—then turns the result into
                useful action inside the business or product.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#how-embr-routes"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-semibold hover:bg-blue-400"
                >
                  See Embr in Action
                </Link>

                <a
                  href="mailto:matt@embrintelligence.ai?subject=Embr Intelligence Demo"
                  className="rounded-2xl border border-white/10 px-6 py-4 text-center font-semibold text-slate-200 hover:bg-white/10"
                >
                  Request a Demo
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">
                What Embr Orchestrates
              </p>

              <div className="mt-6 space-y-4">
                {[
                  "The right AI model for the task",
                  "Business tools, APIs, and data",
                  "App-specific context and memory",
                  "Multi-step workflows and reasoning",
                  "Quality, cost, speed, and risk controls",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-300">
          <span>GPT-5.6</span>
          <span className="text-slate-700">•</span>
          <span>Claude 5</span>
          <span className="text-slate-700">•</span>
          <span>Gemini</span>
          <span className="text-slate-700">•</span>
          <span>Perplexity</span>
          <span className="text-slate-700">•</span>
          <span className="text-blue-300">Automatic routing</span>
          <span className="text-slate-700">•</span>
          <span className="text-blue-300">App intelligence</span>
          <span className="text-slate-700">•</span>
          <span className="text-blue-300">Operational workflows</span>
        </div>
      </section>

      <section
        id="how-embr-routes"
        className="border-b border-white/10 px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
            The Intelligence Layer
          </p>

          <h2 className="mt-4 max-w-4xl text-4xl font-semibold md:text-5xl">
            Stop sending every task to the same model.
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Different work requires different intelligence. Embr evaluates
            complexity, cost, speed, freshness, risk, available tools, and
            business context—then selects the right route automatically.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {routingExamples.map((example) => (
              <div
                key={example.task}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                  {example.task}
                </p>

                <h3 className="mt-4 text-2xl font-semibold">
                  {example.route}
                </h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {example.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6">
            <p className="text-lg leading-8 text-slate-200">
              Embr does more than select a model. It combines the selected
              intelligence with app context, memory, tools, business systems,
              workflows, and quality controls—then returns an answer, insight,
              or action that fits the product.
            </p>
          </div>
        </div>
      </section>


      <section id="demo-command-center" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
            Demo Command Center
          </p>

          <h2 className="mt-4 text-4xl font-semibold">
            What app owners see inside Embr.
          </h2>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Every connected app gets a clear owner-facing command center showing
            what is live, what needs attention, and how the app intelligence layer
            is performing.
          </p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                  Sample App
                </p>

                <h3 className="mt-2 text-3xl font-semibold">
                  Owner Command Center
                </h3>

                <p className="mt-2 text-slate-400">
                  Sanitized sample data — no client information shown.
                </p>
              </div>

              <span className="w-fit rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-100">
                Partial Live
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">App Health</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  Healthy
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Embr Activity</p>
                <p className="mt-2 text-2xl font-semibold text-blue-300">
                  Active
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Quality Score</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  92/100
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Freshness</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  Current
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                  Connected
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["App health", "AI usage", "Quality score", "User counts"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                  Needs Attention
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["Payments", "Revenue reporting", "Active-user tracking"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Embr Insight
              </p>

              <p className="mt-4 text-lg leading-8 text-slate-200">
                The app is healthy and the intelligence layer is active. AI quality
                is strong, but revenue reporting and active-user tracking should be
                connected next to complete the owner view.
              </p>
            </div>
          </div>
        </div>
      </section>


      <section id="proof" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
            Proof in Progress
          </p>

          <h2 className="mt-4 text-4xl font-semibold">
            Already connected to real apps.
          </h2>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Embr is being built through real integrations, not fake dashboard
            screenshots. Each connected app gets its own command center and
            operational status.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {proofApps.map((app) => (
              <div
                key={app.name}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-semibold">{app.name}</h3>
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-100">
                    {app.label}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-slate-300">{app.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 md:p-10">
          <h2 className="text-4xl font-semibold">
            Make your app feel alive after launch.
          </h2>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Embr helps app owners add intelligence, support automation, and
            operational visibility without rebuilding the whole product.
          </p>

          <a
            href="mailto:matt@embrintelligence.ai?subject=Embr Intelligence Demo"
            className="mt-8 inline-flex rounded-2xl bg-blue-500 px-6 py-4 font-semibold hover:bg-blue-400"
          >
            Talk to Embr
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>© Embr Intelligence</p>
          <p>Apps with a living intelligence layer.</p>
        </div>
      </footer>
    </main>
  );
}
