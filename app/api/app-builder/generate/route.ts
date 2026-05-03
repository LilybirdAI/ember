import OpenAI from "openai";
import {
  apiBadRequest,
  apiOk,
  apiServerError,
  apiTooManyRequests,
  apiUnauthorized,
} from "@/lib/api";
import { validateGeneratedTemplate } from "@/lib/appTemplates/validateTemplate";
import { createGeneratedAppFromPrompt } from "@/lib/appTemplates/index";
import { getHeavyModel } from "@/lib/aiConfig";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkMonthlyUsageLimit, logUsageEvent } from "@/lib/usage";
import { createInvoiceTrackerTemplate } from "@/lib/appTemplates/invoiceTrackerTemplate";
import { createCleaningCrmTemplate } from "@/lib/appTemplates/cleaningCrmTemplate";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TemplateFile = {
  path: string;
  language: string;
  purpose: string;
  content: string;
};

type TemplateResult = {
  appName: string;
  slug: string;
  platform: string;
  framework: string;
  summary: string;
  previewHtml: string;
  previewType: string;
  previewNotes: string;
  files: TemplateFile[];
  nextSteps: string[];
};

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "generated-app"
  );
}

function titleCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function inferAppName(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("invoice")) return "Invoice Tracker";
  if (lower.includes("habit")) return "Habit Tracker";
  if (lower.includes("booking")) return "Booking Manager";
  if (lower.includes("fitness")) return "Fitness Tracker";
  if (lower.includes("restaurant")) return "Restaurant Manager";
  if (lower.includes("todo") || lower.includes("to do")) return "Todo App";
  if (lower.includes("budget")) return "Budget Tracker";
  if (lower.includes("inventory")) return "Inventory Tracker";
  if (lower.includes("client portal")) return "Client Portal";
  if (lower.includes("crm")) return "CRM Starter";
  if (lower.includes("lead")) return "Lead Tracker";

  return titleCase(prompt) || "Generated App";
}

function shouldUseInvoiceTemplate(prompt: string) {
  const lower = prompt.toLowerCase();

  return (
    lower.includes("invoice") ||
    lower.includes("billing") ||
    lower.includes("payment tracking") ||
    lower.includes("payment status") ||
    lower.includes("overdue") ||
    lower.includes("freelancer") ||
    lower.includes("accounts receivable")
  );
}

function shouldUseCleaningCrmTemplate(prompt: string) {
  const lower = prompt.toLowerCase();

  return (
    lower.includes("cleaning") &&
    (lower.includes("crm") ||
      lower.includes("lead") ||
      lower.includes("customer") ||
      lower.includes("job") ||
      lower.includes("dashboard"))
  );
}

function stripCodeFence(raw: string) {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\s*/, "");
    text = text.replace(/```$/g, "");
  }

  return text.trim();
}

function createFallbackPageTsx(appName: string, prompt: string) {
  return `"use client";

import { type FormEvent, useMemo, useState } from "react";

type ItemStatus = "New" | "Active" | "Review" | "Done";

type Item = {
  id: string;
  title: string;
  detail: string;
  status: ItemStatus;
};

const appTitle = ${JSON.stringify(appName)};
const appPrompt = ${JSON.stringify(prompt)};

const starterItems: Item[] = [
  {
    id: "item-1",
    title: "Starter record",
    detail: "This is the first generated record.",
    status: "Active",
  },
  {
    id: "item-2",
    title: "Follow-up item",
    detail: "Use this area to track work, clients, leads, tasks, or activity.",
    status: "Review",
  },
  {
    id: "item-3",
    title: "New item",
    detail: "Recently added starter record.",
    status: "New",
  },
];

function getStatusClass(status: ItemStatus) {
  return "status " + status.toLowerCase();
}

export default function Page() {
  const [items, setItems] = useState<Item[]>(starterItems);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const stats = useMemo(() => {
    return [
      {
        label: "Total",
        value: items.length,
      },
      {
        label: "Active",
        value: items.filter((item) => item.status === "Active").length,
      },
      {
        label: "Review",
        value: items.filter((item) => item.status === "Review").length,
      },
      {
        label: "Done",
        value: items.filter((item) => item.status === "Done").length,
      },
    ];
  }, [items]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    const newItem: Item = {
      id: "item-" + Date.now(),
      title: title.trim(),
      detail: detail.trim() || "No details yet.",
      status: "New",
    };

    setItems((current) => [newItem, ...current]);
    setTitle("");
    setDetail("");
  }

  function advanceStatus(id: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const nextStatus =
          item.status === "New"
            ? "Active"
            : item.status === "Active"
              ? "Review"
              : item.status === "Review"
                ? "Done"
                : "New";

        return {
          ...item,
          status: nextStatus,
        };
      }),
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Generated by Ember</p>
        <h1>{appTitle}</h1>
        <p className="hero-copy">{appPrompt}</p>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <p className="eyebrow">Create</p>
          <h2>Add a record</h2>

          <form className="form" onSubmit={addItem}>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Record title"
              />
            </label>

            <label>
              Details
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder="Notes, description, or next action"
                rows={5}
              />
            </label>

            <button className="button" type="submit">
              Save record
            </button>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Workspace</p>
          <h2>Records</h2>

          <div className="record-list">
            {items.map((item) => (
              <div className="record-card" key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>

                <div className="record-actions">
                  <span className={getStatusClass(item.status)}>
                    {item.status}
                  </span>

                  <button type="button" onClick={() => advanceStatus(item.id)}>
                    Move status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
`;
}

function isGeneratedPageSafe(content: string) {
  const trimmed = content.trim();

  if (!trimmed.includes("export default function")) return false;
  if (!trimmed.includes("return (")) return false;
  if (trimmed.includes("```")) return false;

  const importLines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("import "));

  for (const line of importLines) {
    if (!line.includes("from \"react\"") && !line.includes("from 'react'")) {
      return false;
    }
  }

  return true;
}

function normalizePageTsx(raw: string, appName: string, prompt: string) {
  let content = stripCodeFence(raw);

  if (!content.startsWith('"use client";') && !content.startsWith("'use client';")) {
    content = `"use client";\n\n${content}`;
  }

  if (!isGeneratedPageSafe(content)) {
    return createFallbackPageTsx(appName, prompt);
  }

  return content;
}

function createPreviewHtml(appName: string, prompt: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${appName} Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      background: #f6f8fb;
      color: #132033;
    }
    .shell {
      max-width: 430px;
      margin: 0 auto;
      min-height: 100vh;
      background: white;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
    }
    .hero {
      background: linear-gradient(135deg, #1f3a5f, #2f4f6f);
      color: white;
      padding: 28px;
      border-radius: 0 0 28px 28px;
    }
    .badge {
      display: inline-flex;
      background: rgba(255,255,255,0.18);
      border-radius: 999px;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 14px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 32px;
      line-height: 1;
    }
    p {
      margin: 0;
      line-height: 1.5;
    }
    .content {
      padding: 22px;
      display: grid;
      gap: 14px;
    }
    .card {
      border: 1px solid #d9e2ec;
      border-radius: 12px;
      padding: 16px;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="badge">Generated App</div>
      <h1>${appName}</h1>
      <p>${prompt}</p>
    </section>
    <section class="content">
      <div class="card"><strong>Dashboard</strong><p>Starter workspace generated by Ember.</p></div>
      <div class="card"><strong>Create records</strong><p>Add and track items from one place.</p></div>
      <div class="card"><strong>Recent activity</strong><p>See the latest updates and next actions.</p></div>
    </section>
  </main>
</body>
</html>`;
}

function createBaseFiles({
  appName,
  slug,
  prompt,
  pageTsx,
}: {
  appName: string;
  slug: string;
  prompt: string;
  pageTsx: string;
}): TemplateFile[] {
  const packageJson = `{
  "name": "${slug}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
`;

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`;

  const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file was generated by Ember.
`;

  const tsconfigJson = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(appName)},
  description: "Generated by Ember.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  const globalsCss = `:root {
  --background: #f4f6f8;
  --surface: #ffffff;
  --surface-soft: #f1f5f9;
  --text: #132033;
  --muted: #64748b;
  --border: #d9e2ec;
  --primary: #1f3a5f;
  --primary-dark: #152a43;
  --shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    var(--background);
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 36px 0 60px;
}

.hero,
.panel,
.stat-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.hero {
  border-radius: 16px;
  padding: 34px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
}

h2 {
  margin-bottom: 16px;
  font-size: 1.35rem;
}

h3 {
  margin-bottom: 6px;
}

.hero-copy {
  max-width: 720px;
  color: var(--muted);
  font-size: 1.08rem;
  line-height: 1.7;
  margin-bottom: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 14px;
  padding: 22px;
}

.stat-card span {
  color: var(--muted);
  font-weight: 800;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 20px;
}

.panel {
  border-radius: 14px;
  padding: 24px;
}

.form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 800;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  outline: none;
  color: var(--text);
  background: white;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.button,
.record-actions button {
  border: 0;
  border-radius: 999px;
  padding: 12px 16px;
  background: var(--primary);
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.button:hover,
.record-actions button:hover {
  background: var(--primary-dark);
}

.record-list {
  display: grid;
  gap: 14px;
}

.record-card {
  display: grid;
  gap: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  background: var(--surface-soft);
}

.record-card p {
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 0;
}

.record-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status {
  display: inline-flex;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 900;
  background: #dbeafe;
  color: #1d4ed8;
}

.status.new {
  background: #e2e8f0;
  color: #334155;
}

.status.review {
  background: #fef3c7;
  color: #92400e;
}

.status.done {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 900px) {
  .stats-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
`;

  const readme = `# ${appName}

${prompt}

## Run locally

npm install

npm run dev

Open the local URL printed in the terminal.

## Generated by Ember

This starter is intentionally local-first and uses sample data.
`;

  return [
    {
      path: "package.json",
      language: "json",
      purpose: "Project dependencies and scripts.",
      content: packageJson,
    },
    {
      path: "next.config.mjs",
      language: "javascript",
      purpose: "Next.js configuration.",
      content: nextConfig,
    },
    {
      path: "next-env.d.ts",
      language: "ts",
      purpose: "Next.js type declarations.",
      content: nextEnv,
    },
    {
      path: "tsconfig.json",
      language: "json",
      purpose: "TypeScript configuration.",
      content: tsconfigJson,
    },
    {
      path: "app/layout.tsx",
      language: "tsx",
      purpose: "Root app layout.",
      content: layoutTsx,
    },
    {
      path: "app/page.tsx",
      language: "tsx",
      purpose: "Main generated app.",
      content: pageTsx,
    },
    {
      path: "app/globals.css",
      language: "css",
      purpose: "Global styles and app classes.",
      content: globalsCss,
    },
    {
      path: "README.md",
      language: "markdown",
      purpose: "Setup and run instructions.",
      content: readme,
    },
  ];
}

async function generateCustomPage({
  model,
  prompt,
  appName,
}: {
  model: string;
  prompt: string;
  appName: string;
}) {
  const instructions = `
You are Ember's custom app page generator.

Create a complete Next.js App Router page file.

Return ONLY complete app/page.tsx file contents.
No markdown.
No code fences.
No explanations.

Rules:
Design style:
- Make the app look professional, corporate, clean, and client-ready.
- Prefer business dashboard styling over trendy startup styling.
- Use practical sections: stats, forms, tables/lists, statuses, recent activity, notes, customer/client records, financial records, or workflow records.
- Use restrained copy and polished business wording.
- Avoid neon, playful gradients, cartoon styling, overly modern gimmicks, and toy-like UI.
- The app should feel appropriate for real estate, banking, finance, proposals, service businesses, or business operations.

Technical rules:
- Include "use client"; at the top.
- You may import React hooks from "react".
- Do not import any local components.
- Do not import any external libraries.
- Do not use image imports.
- Use sample/local state data only.
- Build the requested app as a usable interactive starter.
- Use the available CSS class names: page-shell, hero, eyebrow, hero-copy, stats-grid, stat-card, dashboard-grid, panel, form, button, record-list, record-card, record-actions, status.
- You may add extra class names, but the app must still look acceptable with the base styles.
- Must include export default function Page().
- Must finish all JSX and braces.
`;

  const responseOptions: any = {
    model,
    instructions,
    input: `
App name: ${appName}

User prompt:
${prompt}
`,
    max_output_tokens: 9000,
  };

  if (model.startsWith("gpt-5")) {
    responseOptions.reasoning = {
      effort: "high",
    };
  }

  return client.responses.create(responseOptions);
}

async function ensureProjectBelongsToUser(userId: string, projectId: string | null) {
  if (!projectId) return;

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Project not found for this user.");
  }
}

async function logModelUsage({
  userId,
  model,
  usage,
}: {
  userId: string;
  model: string;
  usage: any;
}) {
  try {
    await logUsageEvent({
      userId,
      conversationId: null,
      model,
      usage,
    });
  } catch (error) {
    console.error("GENERATE APP USAGE LOGGING ERROR:", error);
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiServerError("Missing OpenAI API key.", {
        output: "Ember is missing an OPENAI_API_KEY.",
      });
    }

    const user = await getUserFromRequest(req);

    const usageStatus = await checkMonthlyUsageLimit(user.id);

    if (!usageStatus.allowed) {
      return apiTooManyRequests("Monthly usage limit reached.", {
        output:
          "You’ve reached your monthly Ember usage limit. Upgrade or wait until usage resets.",
        used: usageStatus.used,
        limit: usageStatus.limit,
        remaining: usageStatus.remaining,
      });
    }

    const body = await req.json();

    const prompt = cleanString(body.prompt || body.message);
    const projectId = cleanString(body.projectId) || null;

    if (!prompt) {
      return apiBadRequest("Build prompt is required.", {
        output: "Tell Ember what app you want to build.",
      });
    }

    await ensureProjectBelongsToUser(user.id, projectId);

    let template: TemplateResult;

    if (shouldUseInvoiceTemplate(prompt)) {
      template = createInvoiceTrackerTemplate({ prompt });
    } else if (shouldUseCleaningCrmTemplate(prompt)) {
      template = createCleaningCrmTemplate({ prompt });
    } else {
      const appName = inferAppName(prompt);
      const slug = slugify(appName);
      const model = getHeavyModel();

      const pageResponse = await generateCustomPage({
        model,
        prompt,
        appName,
      });

      await logModelUsage({
        userId: user.id,
        model,
        usage: pageResponse.usage,
      });

      const pageTsx = normalizePageTsx(
        pageResponse.output_text || "",
        appName,
        prompt
      );

      template = {
        appName,
        slug,
        platform: "web",
        framework: "Next.js",
        summary: `A generated app starter for: ${prompt}`,
        previewHtml: createPreviewHtml(appName, prompt),
        previewType: "interactive_html",
        previewNotes:
          "This preview summarizes the generated app. The exported project contains the working Next.js starter.",
        files: createBaseFiles({
          appName,
          slug,
          prompt,
          pageTsx,
        }),
        nextSteps: [
          "Export the ZIP.",
          "Run npm install.",
          "Run npm run dev.",
          "Ask Ember to add persistence, authentication, or deployment setup.",
        ],
      };
    }

    const validationErrors = validateGeneratedTemplate(template);

    if (validationErrors.length > 0) {
      return apiServerError("Generated template failed validation.", {
        output:
          "Ember generated an app template, but it failed validation before saving.",
        validationErrors,
      });
    }

    const { data: generatedApp, error: appInsertError } = await supabaseAdmin
      .from("generated_apps")
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: template.appName,
        platform: template.platform,
        framework: template.framework,
        summary: template.summary,
        build_prompt: prompt,
        status: "draft",
        preview_html: template.previewHtml,
        preview_type: template.previewType,
        preview_notes: template.previewNotes,
      })
      .select(
        "id, name, platform, framework, status, summary, preview_type, preview_notes, created_at, updated_at"
      )
      .single();

    if (appInsertError) {
      throw appInsertError;
    }

    const fileRows = template.files.map((file) => ({
      user_id: user.id,
      generated_app_id: generatedApp.id,
      path: file.path,
      content: file.content,
      language: file.language,
      purpose: file.purpose,
    }));

    const { data: files, error: filesInsertError } = await supabaseAdmin
      .from("generated_app_files")
      .insert(fileRows)
      .select("id, path, language, purpose, created_at, updated_at");

    if (filesInsertError) {
      throw filesInsertError;
    }

    return apiOk({
      output: `I created ${template.appName}, generated a preview, and saved ${template.files.length} files.`,
      generatedApp,
      files: files || [],
      assumptions: [
        shouldUseCleaningCrmTemplate(prompt)
          ? "Used Ember's known-good cleaning CRM template."
          : "Used Ember's hybrid app generator with a stable Next.js scaffold and AI-generated app page.",
      ],
      nextSteps: template.nextSteps,
      rawPlan: {
        appName: template.appName,
        platform: template.platform,
        framework: template.framework,
        summary: template.summary,
        files: template.files.map((file) => ({
          path: file.path,
          language: file.language,
          purpose: file.purpose,
        })),
      },
    });
  } catch (error) {
    console.error("GENERATED APP ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.", {
        output: "You need to log in first.",
      });
    }

    const message = error instanceof Error ? error.message : "";

    if (message.toLowerCase().includes("project not found")) {
      return apiBadRequest("Project not found.", {
        output: "That project could not be found. Reselect the project and try again.",
      });
    }

    return apiServerError("Could not generate app.", {
      output: "Ember could not generate the app. Check the terminal logs.",
    });
  }
}
