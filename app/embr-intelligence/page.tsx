export default function EmbrIntelligenceLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.45em] text-yellow-400">
            Embr Intelligence
          </p>

          <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
            App-aware AI for products that need more than a chatbot.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Embr Intelligence is an embeddable AI layer for mobile and web apps.
            It helps apps understand user context, respond safely, track usage,
            and measure response quality across real product interactions.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:matt@echosignalmedia.com?subject=Embr Intelligence Integration"
              className="rounded-2xl bg-yellow-400 px-6 py-4 text-center font-semibold text-slate-950 hover:bg-yellow-300"
            >
              Book an Integration Call
            </a>

            <a
              href="/app-intelligence-console"
              className="rounded-2xl border border-slate-700 px-6 py-4 text-center font-semibold text-slate-100 hover:bg-slate-900"
            >
              View Platform Console
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              App Context
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Embr understands what is happening inside your app.
            </h2>
            <p className="mt-4 text-slate-400">
              Send screens, user state, progress, notes, events, or workflow
              data. Embr responds with context instead of generic answers.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              App Profiles
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Every app gets its own purpose, tone, and boundaries.
            </h2>
            <p className="mt-4 text-slate-400">
              Coaching apps, therapy-style apps, caregiver tools, business
              dashboards, and performance apps should not all sound the same.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Quality Layer
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Usage, quality, and risk signals are tracked from day one.
            </h2>
            <p className="mt-4 text-slate-400">
              Embr separates test from production, records usage, scores
              response quality, and flags risky or low-quality output patterns.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            How It Works
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {[
              "Your app sends context",
              "Embr selects the app profile",
              "AI engine responds",
              "Guardrails check output",
              "Usage + quality are logged",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <p className="text-sm text-slate-500">Step {index + 1}</p>
                <p className="mt-2 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-400">
            Built For
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Therapy and reflection apps",
              "Coaching and performance apps",
              "Caregiver support tools",
              "Fitness and habit apps",
              "Business dashboards",
              "Client portals",
              "Education apps",
              "App builders",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-300">
            Developer Preview
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            One endpoint. Any app. App-specific intelligence.
          </h2>

          <pre className="mt-6 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
{`POST /app-intelligence/respond

{
  "appId": "mindshot-golf",
  "userId": "user_123",
  "environment": "production",
  "message": "What should I focus on?",
  "appContext": {
    "screen": "round_summary",
    "score": 87,
    "missPattern": "short right"
  }
}`}
          </pre>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold">
            Give your app a real intelligence layer.
          </h2>
          <p className="mt-4 text-slate-400">
            Embr is built for products that need context-aware AI, not a generic
            chatbot bolted onto the side.
          </p>

          <a
            href="mailto:matt@echosignalmedia.com?subject=Embr Intelligence Integration"
            className="mt-8 inline-flex rounded-2xl bg-yellow-400 px-6 py-4 font-semibold text-slate-950 hover:bg-yellow-300"
          >
            Start an Embr Integration
          </a>
        </div>
      </section>
    </main>
  );
}
