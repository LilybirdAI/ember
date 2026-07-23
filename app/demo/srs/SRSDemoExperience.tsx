"use client";

import { useMemo, useState } from "react";

type ScenarioId =
  | "product"
  | "revenue"
  | "support"
  | "security"
  | "knowledge";

type Scenario = {
  id: ScenarioId;
  eyebrow: string;
  title: string;
  description: string;
  prompt: string;
  classification: string;
  route: string;
  model: string;
  tools: string[];
  safeguards: string[];
  responseTitle: string;
  response: string[];
  metrics: {
    label: string;
    value: string;
  }[];
};

const scenarios: Scenario[] = [
  {
    id: "product",
    eyebrow: "Digital Product Engineering",
    title: "Product Intelligence",
    description:
      "Turn application telemetry, user reports, and technical context into prioritized engineering action.",
    prompt:
      "A mobile client reports that account deletion fails with an UNAUTHENTICATED response after the UI signs the user out. Diagnose the likely sequence problem and recommend the safest implementation path.",
    classification: "Technical diagnosis · Authentication lifecycle · High impact",
    route: "Architecture and debugging workflow",
    model: "Complex technical reasoning tier",
    tools: [
      "Application context",
      "Error-pattern analysis",
      "Authentication lifecycle",
      "Implementation planning",
    ],
    safeguards: [
      "No production credentials requested",
      "No destructive action executed",
      "Human approval required",
    ],
    responseTitle: "Recommended implementation path",
    response: [
      "The likely failure is sequencing: the client invalidates the authenticated session before the protected deletion function completes.",
      "Keep the user authenticated while calling the deletion endpoint, verify the server-side identity, delete or anonymize related records, and only then revoke the session.",
      "Add idempotency so repeated deletion attempts do not corrupt state, and preserve a limited audit record without retaining unnecessary personal information.",
      "Validate the complete flow in a nonproduction environment before release.",
    ],
    metrics: [
      { label: "Route confidence", value: "94%" },
      { label: "Risk level", value: "High" },
      { label: "Human approval", value: "Required" },
      { label: "Suggested next step", value: "Staging test" },
    ],
  },
  {
    id: "revenue",
    eyebrow: "Revenue Operations",
    title: "Revenue Intelligence",
    description:
      "Combine account, product, and operational signals into focused commercial next steps.",
    prompt:
      "Review a software account with declining usage, two unresolved support tickets, and an upcoming renewal. Create an intervention plan for the account team.",
    classification: "Retention risk · Commercial workflow · Time sensitive",
    route: "Business reasoning and prioritization workflow",
    model: "Balanced production reasoning tier",
    tools: [
      "Account health context",
      "Usage trend summary",
      "Support history",
      "Renewal workflow",
    ],
    safeguards: [
      "Customer data scoped to account",
      "No automated outreach sent",
      "Recommendations require owner review",
    ],
    responseTitle: "Account intervention plan",
    response: [
      "Treat the account as an active retention risk rather than a routine renewal.",
      "Resolve the two open support issues first, then schedule a value-review conversation centered on the customer’s original adoption goals.",
      "Prepare a concise usage comparison showing where activity declined and identify one feature or workflow that could restore measurable value.",
      "Do not lead with renewal terms until the support and adoption concerns have been acknowledged.",
    ],
    metrics: [
      { label: "Retention risk", value: "Elevated" },
      { label: "Priority", value: "This week" },
      { label: "Automation", value: "Review only" },
      { label: "Primary owner", value: "Account lead" },
    ],
  },
  {
    id: "support",
    eyebrow: "Service Operations",
    title: "Support Orchestration",
    description:
      "Classify requests, retrieve approved context, and produce consistent responses and escalation decisions.",
    prompt:
      "A customer says they were charged twice, cannot access premium features, and wants an immediate refund. Determine the correct support workflow.",
    classification: "Billing issue · Access failure · Customer escalation",
    route: "Support triage and policy workflow",
    model: "Balanced production reasoning tier",
    tools: [
      "Billing-event context",
      "Entitlement status",
      "Support policy",
      "Escalation rules",
    ],
    safeguards: [
      "No refund automatically issued",
      "Payment data minimized",
      "Escalation threshold applied",
    ],
    responseTitle: "Support workflow",
    response: [
      "First verify whether there are two settled charges or one settled charge plus a temporary authorization.",
      "Separately confirm the customer’s current entitlement state because the access failure may be independent of the billing complaint.",
      "Restore valid access immediately when entitlement is confirmed.",
      "Escalate a confirmed duplicate settlement for refund approval and provide the customer with one clear owner and expected response time.",
    ],
    metrics: [
      { label: "Urgency", value: "High" },
      { label: "Refund authority", value: "Approval needed" },
      { label: "Access action", value: "Verify now" },
      { label: "Escalation", value: "Billing owner" },
    ],
  },
  {
    id: "security",
    eyebrow: "Security & Governance",
    title: "Governed AI Workflow",
    description:
      "Apply privacy, security, and approval controls before an AI-generated result reaches a user or system.",
    prompt:
      "An internal team wants to paste customer support exports, API logs, and authentication errors into a public AI chatbot for analysis. Evaluate the request.",
    classification: "Data-governance review · External AI system · Sensitive context",
    route: "Security and governance workflow",
    model: "Complex risk-analysis tier",
    tools: [
      "Data classification",
      "Vendor-use policy",
      "Privacy controls",
      "Approved-system registry",
    ],
    safeguards: [
      "Public AI submission blocked",
      "Sensitive fields identified",
      "Approved alternative required",
    ],
    responseTitle: "Governance decision",
    response: [
      "Do not submit the raw exports or logs to a public consumer AI service.",
      "The material may contain customer identifiers, tokens, session data, internal endpoints, and commercially sensitive operational information.",
      "Use an approved enterprise environment with no-training protections, controlled retention, scoped access, and documented vendor terms.",
      "Redact unnecessary identifiers and secrets before analysis, even inside an approved environment.",
    ],
    metrics: [
      { label: "Decision", value: "Blocked" },
      { label: "Data sensitivity", value: "High" },
      { label: "Approved path", value: "Enterprise AI" },
      { label: "Redaction", value: "Required" },
    ],
  },
  {
    id: "knowledge",
    eyebrow: "AI & Data Foundation",
    title: "Knowledge Intelligence",
    description:
      "Answer operational questions from controlled company context while preserving source boundaries and uncertainty.",
    prompt:
      "Summarize the current implementation status of a client platform, identify unresolved dependencies, and prepare the next executive update.",
    classification: "Knowledge synthesis · Project status · Executive communication",
    route: "Retrieval and synthesis workflow",
    model: "Long-context reasoning tier",
    tools: [
      "Approved project records",
      "Decision history",
      "Dependency tracking",
      "Executive-summary format",
    ],
    safeguards: [
      "Approved sources only",
      "Unknowns clearly labeled",
      "No unsupported completion claims",
    ],
    responseTitle: "Executive project update",
    response: [
      "The core implementation is operational, but the release remains dependent on final production access, stakeholder validation, and completion of the deployment checklist.",
      "The highest-risk dependency is not code volume; it is coordination around credentials, approvals, and final acceptance criteria.",
      "The next update should distinguish completed engineering work from externally controlled blockers.",
      "Recommend assigning one owner and due date to every unresolved dependency before communicating a launch date.",
    ],
    metrics: [
      { label: "Source coverage", value: "87%" },
      { label: "Open dependencies", value: "3" },
      { label: "Confidence", value: "High" },
      { label: "Next review", value: "Stakeholders" },
    ],
  },
];

const traceSteps = [
  {
    number: "01",
    title: "Understand",
    text: "Classify the objective, complexity, urgency, risk, and business context.",
  },
  {
    number: "02",
    title: "Route",
    text: "Select the appropriate intelligence tier, tools, and workflow.",
  },
  {
    number: "03",
    title: "Govern",
    text: "Apply privacy, security, data-access, and human-approval controls.",
  },
  {
    number: "04",
    title: "Reason",
    text: "Combine the selected intelligence with approved application context.",
  },
  {
    number: "05",
    title: "Act",
    text: "Return a useful answer, recommendation, escalation, or controlled action.",
  },
];

export default function SRSDemoExperience() {
  const [selectedId, setSelectedId] = useState<ScenarioId>("product");
  const [prompt, setPrompt] = useState(scenarios[0].prompt);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [activeStep, setActiveStep] = useState(traceSteps.length);

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === selectedId) ?? scenarios[0],
    [selectedId]
  );

  function selectScenario(nextScenario: Scenario) {
    setSelectedId(nextScenario.id);
    setPrompt(nextScenario.prompt);
    setHasRun(true);
    setRunning(false);
    setActiveStep(traceSteps.length);
  }

  async function runDemo() {
    if (!prompt.trim() || running) return;

    setRunning(true);
    setHasRun(false);
    setActiveStep(0);

    for (let step = 1; step <= traceSteps.length; step += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 550));
      setActiveStep(step);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setHasRun(true);
    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(212,160,23,0.17),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold tracking-tight">
                Embr Intelligence
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                Enterprise orchestration demonstration
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-100">
                SRS Consulting
              </span>

              <a
                href="/"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Embr Home
              </a>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
                Partnership Demonstration
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
                One intelligence layer across products, data, operations, and
                governance.
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
                Embr evaluates each task, selects the appropriate intelligence,
                applies approved business context and safeguards, and turns the
                result into a useful answer or controlled workflow.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
                {[
                  "Multi-model routing",
                  "Application context",
                  "Tool orchestration",
                  "Security controls",
                  "Human approval",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                    Demonstration Environment
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Presentation-safe orchestration
                  </h2>
                </div>

                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="mt-5 space-y-4">
                {[
                  ["Environment", "Sanitized demo"],
                  ["Proprietary logic", "Protected"],
                  ["External actions", "Disabled"],
                  ["Human control", "Enabled"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4"
                  >
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
              Select a workflow
            </p>
            <h2 className="mt-3 text-4xl font-semibold">
              See how Embr adapts to different enterprise work.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {scenarios.map((item) => {
              const selected = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectScenario(item)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    selected
                      ? "border-blue-400/50 bg-blue-500/15"
                      : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                      selected ? "text-blue-200" : "text-slate-500"
                    }`}
                  >
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                Enterprise Request
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{scenario.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Edit the request or run the prepared example.
              </p>
            </div>

            <label
              htmlFor="demo-prompt"
              className="mt-6 block text-sm font-semibold text-slate-200"
            >
              Request
            </label>

            <textarea
              id="demo-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={9}
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-400"
            />

            <button
              type="button"
              onClick={runDemo}
              disabled={running || !prompt.trim()}
              className="mt-5 w-full rounded-2xl bg-blue-500 px-6 py-4 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Embr is orchestrating…" : "Run Embr Workflow"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Demonstration output is simulated and sanitized. No external
              systems or customer data are accessed.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                  Live Orchestration Trace
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  How Embr handles the request
                </h2>
              </div>

              <span
                className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                  running
                    ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {running ? "Processing" : "Workflow ready"}
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {traceSteps.map((step, index) => {
                const complete = activeStep > index;
                const current = activeStep === index && running;

                return (
                  <div
                    key={step.number}
                    className={`grid grid-cols-[46px_1fr] gap-4 rounded-2xl border p-4 transition ${
                      complete
                        ? "border-blue-400/25 bg-blue-500/10"
                        : current
                          ? "border-yellow-400/30 bg-yellow-500/10"
                          : "border-white/10 bg-slate-950/60"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold ${
                        complete
                          ? "border-blue-400/40 bg-blue-500/20 text-blue-100"
                          : current
                            ? "border-yellow-400/40 bg-yellow-500/20 text-yellow-100"
                            : "border-white/10 text-slate-600"
                      }`}
                    >
                      {complete ? "✓" : step.number}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{step.title}</h3>
                        {current && (
                          <span className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                Classification
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-200">
                {scenario.classification}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                Selected Route
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-100">
                {scenario.route}
              </p>
              <p className="mt-2 text-sm text-slate-400">{scenario.model}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                Operational Controls
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-200">
                Scoped context · Guardrails · Approval boundaries
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                Context and tools
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {scenario.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                Governance checks
              </p>
              <div className="mt-5 space-y-3">
                {scenario.safeguards.map((safeguard) => (
                  <div
                    key={safeguard}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-300">
                      ✓
                    </span>
                    <span>{safeguard}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div
            className={`transition duration-500 ${
              hasRun ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
                  Governed Result
                </p>
                <h2 className="mt-3 text-4xl font-semibold">
                  {scenario.responseTitle}
                </h2>
              </div>

              <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                Ready for human review
              </span>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                <div className="space-y-5">
                  {scenario.response.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-lg leading-8 text-slate-300"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {scenario.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
                  >
                    <p className="text-sm text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
              Embr Intelligence Network
            </p>

            <h2 className="mt-4 text-4xl font-semibold md:text-5xl">
              Embr calls the right intelligence for the work.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              Embr does not send every request to the same model. It evaluates
              the task’s complexity, speed, cost, freshness, context, and risk,
              then selects the appropriate provider, intelligence tier, tools,
              and workflow automatically.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
                    OpenAI
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    GPT-5.6 Intelligence Tiers
                  </h3>
                </div>

                <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                  Active
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    model: "GPT-5.6 Luna",
                    use: "Lightweight intelligence",
                    detail:
                      "Classification, extraction, quick summaries, routing support, and high-volume repetitive work.",
                  },
                  {
                    model: "GPT-5.6 Terra",
                    use: "Normal production intelligence",
                    detail:
                      "Everyday reasoning, planning, writing, product workflows, and general application intelligence.",
                  },
                  {
                    model: "GPT-5.6 Sol",
                    use: "Complex intelligence",
                    detail:
                      "Architecture, difficult debugging, cybersecurity analysis, scientific work, and high-value decisions.",
                  },
                ].map((item) => (
                  <div
                    key={item.model}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-lg font-semibold text-slate-100">
                        {item.model}
                      </p>
                      <span className="text-sm font-semibold text-blue-300">
                        {item.use}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
                    Anthropic
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Claude Intelligence Tiers
                  </h3>
                </div>

                <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  Active
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    model: "Claude Haiku 4.5",
                    use: "Lightweight intelligence",
                    detail:
                      "Fast classification, structured extraction, concise analysis, and low-latency support work.",
                  },
                  {
                    model: "Claude Sonnet 5",
                    use: "Normal production intelligence",
                    detail:
                      "Production reasoning, technical review, planning, writing, analysis, and client-facing workflows.",
                  },
                  {
                    model: "Claude Opus 4.8",
                    use: "Complex intelligence",
                    detail:
                      "Difficult architecture, deep technical analysis, complex debugging, and high-stakes reasoning.",
                  },
                ].map((item) => (
                  <div
                    key={item.model}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-lg font-semibold text-slate-100">
                        {item.model}
                      </p>
                      <span className="text-sm font-semibold text-violet-300">
                        {item.use}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                    Google
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Gemini</h3>
                </div>

                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Specialized route
                </span>
              </div>

              <p className="mt-5 leading-7 text-slate-300">
                Embr can call Gemini for long-context workloads, multimodal
                analysis, large-document understanding, and specialized tasks
                where its capabilities best match the request.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  "Long context",
                  "Multimodal work",
                  "Large documents",
                  "Specialized analysis",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    Research Intelligence
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Perplexity</h3>
                </div>

                <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  Current information
                </span>
              </div>

              <p className="mt-5 leading-7 text-slate-300">
                Embr can route work to Perplexity when the task requires fresh
                public information, current research, recent developments, or
                source-backed answers.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  "Current facts",
                  "Live research",
                  "Source-backed answers",
                  "Recent developments",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-yellow-400/25 bg-yellow-500/10 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
                  The Embr Difference
                </p>
                <h3 className="mt-3 text-3xl font-semibold">
                  The client asks for an outcome—not a model.
                </h3>
              </div>

              <p className="text-lg leading-8 text-slate-300">
                Embr handles provider selection, intelligence tiering, tool
                access, context, governance, fallback behavior, and quality
                controls behind the scenes. The private decision thresholds,
                scoring methods, prompts, and fallback rules remain protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-yellow-400/25 bg-yellow-500/10 p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
                  Embr Intelligence + SRS Consulting
                </p>
                <h2 className="mt-4 max-w-4xl text-4xl font-semibold md:text-5xl">
                  A partnership layer for intelligent products and enterprise
                  transformation.
                </h2>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                  SRS brings enterprise delivery, digital engineering, data,
                  security, and client relationships. Embr adds reusable
                  orchestration, application intelligence, governance, and
                  multi-model capability across those engagements.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "Joint AI and product engagements",
                  "Embr-powered client solutions",
                  "Enterprise orchestration architecture",
                  "Security and governance workflows",
                  "Referral and delivery collaboration",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-yellow-300/15 bg-slate-950/50 px-5 py-4 text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:matt@embrintelligence.ai?subject=Embr Intelligence and SRS Partnership"
                className="rounded-2xl bg-yellow-400 px-6 py-4 text-center font-semibold text-slate-950 transition hover:bg-yellow-300"
              >
                Continue the Partnership Discussion
              </a>

              <a
                href="https://embrintelligence.com"
                className="rounded-2xl border border-white/10 px-6 py-4 text-center font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Explore Embr Intelligence
              </a>
            </div>
          </div>

          <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Embr Intelligence LLC</p>
            <p>Private demonstration · Proprietary technology protected</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
