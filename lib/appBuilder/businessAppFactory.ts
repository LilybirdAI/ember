export type GeneratedBusinessFile = {
  path: string;
  language: string;
  purpose: string;
  content: string;
};

export type GeneratedBusinessTemplate = {
  templateId: string;
  appName: string;
  slug: string;
  platform: string;
  framework: string;
  summary: string;
  previewHtml: string;
  previewType: string;
  previewNotes: string;
  files: GeneratedBusinessFile[];
  nextSteps: string[];
};

type BusinessRecord = {
  id: string;
  title: string;
  contact: string;
  category: string;
  status: string;
  value: number;
  followUp: string;
  notes: string;
};

type BusinessConfig = {
  templateId: string;
  appName: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  recordLabel: string;
  createTitle: string;
  actionLabel: string;
  titleLabel: string;
  contactLabel: string;
  categoryLabel: string;
  valueLabel: string;
  followUpLabel: string;
  notesLabel: string;
  searchPlaceholder: string;
  statusFlow: string[];
  closedStatuses: string[];
  stats: {
    activeLabel: string;
    valueLabel: string;
    followUpLabel: string;
    closedLabel: string;
  };
  samples: BusinessRecord[];
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "generated-business-app"
  );
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function inferConfig(prompt: string): BusinessConfig {
  const lower = prompt.toLowerCase();

  if (
    includesAny(lower, [
      "real estate",
      "realtor",
      "broker",
      "property",
      "listing",
      "buyer lead",
      "seller lead",
      "investor lead",
      "property interest",
      "deal value",
      "pipeline dashboard",
      "showing",
      "open house",
    ])
  ) {
    return {
      templateId: "real_estate_lead_tracker",
      appName: "Real Estate Lead Tracker",
      slug: "real-estate-lead-tracker",
      eyebrow: "Real Estate Pipeline",
      title: "Professional lead and deal tracker",
      description:
        "Track buyers, sellers, investors, property interests, follow-ups, deal value, and pipeline status from one focused workspace.",
      recordLabel: "Leads",
      createTitle: "Add real estate lead",
      actionLabel: "Save lead",
      titleLabel: "Lead name",
      contactLabel: "Phone / email",
      categoryLabel: "Lead type / property interest",
      valueLabel: "Budget / deal value",
      followUpLabel: "Next follow-up",
      notesLabel: "Motivation, preferences, objections, financing, or next action",
      searchPlaceholder: "Search leads, property interest, area, or status",
      statusFlow: ["New", "Contacted", "Showing", "Offer", "Closed", "Lost"],
      closedStatuses: ["Closed", "Lost"],
      stats: {
        activeLabel: "Active pipeline",
        valueLabel: "Pipeline value",
        followUpLabel: "Follow-ups",
        closedLabel: "Closed / Lost",
      },
      samples: [
        {
          id: "lead-1",
          title: "Avery Brooks",
          contact: "(555) 014-9011 · avery@example.com",
          category: "Buyer · Single-family home · North Shore",
          status: "Showing",
          value: 725000,
          followUp: "Tomorrow",
          notes:
            "Pre-approved buyer. Wants 3 beds, garage, and strong school district.",
        },
        {
          id: "lead-2",
          title: "Morgan Lee",
          contact: "(555) 014-9022 · morgan@example.com",
          category: "Seller · Condo listing · Downtown",
          status: "Contacted",
          value: 560000,
          followUp: "Friday",
          notes: "Needs CMA and listing prep checklist before signing.",
        },
        {
          id: "lead-3",
          title: "Harbor Capital Group",
          contact: "(555) 014-9033 · deals@harborcapital.example",
          category: "Investor · Small multifamily · Metro West",
          status: "Offer",
          value: 1250000,
          followUp: "Today",
          notes:
            "Looking for 4-8 unit properties with value-add upside.",
        },
      ],
    };
  }

  if (
    includesAny(lower, [
      "invoice",
      "billing",
      "payment tracking",
      "payment status",
      "overdue",
      "freelancer",
      "accounts receivable",
    ])
  ) {
    return {
      templateId: "invoice_tracker",
      appName: lower.includes("freelancer")
        ? "Freelancer Invoice Tracker"
        : "Invoice Tracker",
      slug: lower.includes("freelancer")
        ? "freelancer-invoice-tracker"
        : "invoice-tracker",
      eyebrow: "Invoice Tracker",
      title: "Professional billing dashboard",
      description:
        "Track clients, invoices, payment status, overdue balances, and follow-up work from one clean workspace.",
      recordLabel: "Invoices",
      createTitle: "Create invoice",
      actionLabel: "Save invoice",
      titleLabel: "Invoice title",
      contactLabel: "Client / contact",
      categoryLabel: "Service / project type",
      valueLabel: "Amount",
      followUpLabel: "Due date / follow-up",
      notesLabel: "Payment terms, scope, reminder details, or next action",
      searchPlaceholder: "Search invoices, clients, or status",
      statusFlow: ["Draft", "Sent", "Paid", "Overdue"],
      closedStatuses: ["Paid"],
      stats: {
        activeLabel: "Open invoices",
        valueLabel: "Outstanding",
        followUpLabel: "Needs follow-up",
        closedLabel: "Paid",
      },
      samples: [
        {
          id: "inv-1",
          title: "Website refresh deposit",
          contact: "Brightline Studio · dana@brightline.example",
          category: "Web project",
          status: "Sent",
          value: 2400,
          followUp: "May 3",
          notes: "Initial deposit for homepage redesign and brand cleanup.",
        },
        {
          id: "inv-2",
          title: "Lead dashboard MVP",
          contact: "North Harbor Realty · marcus@northharbor.example",
          category: "Business app",
          status: "Draft",
          value: 5200,
          followUp: "May 10",
          notes: "Draft waiting on final project scope approval.",
        },
        {
          id: "inv-3",
          title: "Monthly support retainer",
          contact: "Stonebridge Consulting · priya@stonebridge.example",
          category: "Retainer",
          status: "Paid",
          value: 1800,
          followUp: "Paid Apr 21",
          notes: "April support and maintenance retainer.",
        },
      ],
    };
  }

  if (
    includesAny(lower, [
      "crm",
      "lead tracker",
      "customer",
      "client portal",
      "service business",
      "cleaning",
      "landscaping",
      "contractor",
    ])
  ) {
    return {
      templateId: "business_crm",
      appName: "Business CRM",
      slug: "business-crm",
      eyebrow: "Business CRM",
      title: "Client and lead management dashboard",
      description:
        "Capture leads, track customers, organize notes, and manage follow-up work from one professional workspace.",
      recordLabel: "Clients / Leads",
      createTitle: "Add client or lead",
      actionLabel: "Save record",
      titleLabel: "Name / company",
      contactLabel: "Phone / email",
      categoryLabel: "Service / interest",
      valueLabel: "Estimated value",
      followUpLabel: "Next follow-up",
      notesLabel: "Notes, scope, objections, or next action",
      searchPlaceholder: "Search clients, leads, services, or status",
      statusFlow: ["New", "Contacted", "Proposal", "Active", "Closed"],
      closedStatuses: ["Closed"],
      stats: {
        activeLabel: "Active records",
        valueLabel: "Pipeline value",
        followUpLabel: "Follow-ups",
        closedLabel: "Closed",
      },
      samples: [
        {
          id: "crm-1",
          title: "Maya Chen",
          contact: "(555) 014-2289 · maya@example.com",
          category: "New service request",
          status: "Proposal",
          value: 3200,
          followUp: "Tomorrow",
          notes: "Needs proposal and service timeline.",
        },
        {
          id: "crm-2",
          title: "Riverside Dental",
          contact: "(555) 018-4490 · office@riverside.example",
          category: "Recurring account",
          status: "Active",
          value: 8600,
          followUp: "Friday",
          notes: "Ongoing commercial service account.",
        },
      ],
    };
  }

  return {
    templateId: "universal_business_system",
    appName: "Business System",
    slug: "business-system",
    eyebrow: "Business System",
    title: "Professional operations dashboard",
    description:
      "Turn a business workflow into a structured workspace with records, statuses, value tracking, notes, and follow-ups.",
    recordLabel: "Records",
    createTitle: "Add record",
    actionLabel: "Save record",
    titleLabel: "Record title",
    contactLabel: "Contact / owner",
    categoryLabel: "Category",
    valueLabel: "Value",
    followUpLabel: "Follow-up",
    notesLabel: "Notes or next action",
    searchPlaceholder: "Search records",
    statusFlow: ["New", "Active", "Review", "Done"],
    closedStatuses: ["Done"],
    stats: {
      activeLabel: "Active records",
      valueLabel: "Total value",
      followUpLabel: "Follow-ups",
      closedLabel: "Done",
    },
    samples: [
      {
        id: "record-1",
        title: "Starter record",
        contact: "Internal owner",
        category: "Primary workflow",
        status: "Active",
        value: 1200,
        followUp: "Today",
        notes: "This is the first generated business record.",
      },
      {
        id: "record-2",
        title: "Follow-up item",
        contact: "Client contact",
        category: "Needs review",
        status: "Review",
        value: 480,
        followUp: "Tomorrow",
        notes: "Use this area to track business work and next actions.",
      },
    ],
  };
}

function createPageTsx(config: BusinessConfig, prompt: string) {
  const configJson = JSON.stringify(config, null, 2);
  const recordsJson = JSON.stringify(config.samples, null, 2);

  return `"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

type BusinessRecord = {
  id: string;
  title: string;
  contact: string;
  category: string;
  status: string;
  value: number;
  followUp: string;
  notes: string;
};

type BusinessConfig = {
  templateId: string;
  appName: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  recordLabel: string;
  createTitle: string;
  actionLabel: string;
  titleLabel: string;
  contactLabel: string;
  categoryLabel: string;
  valueLabel: string;
  followUpLabel: string;
  notesLabel: string;
  searchPlaceholder: string;
  statusFlow: string[];
  closedStatuses: string[];
  stats: {
    activeLabel: string;
    valueLabel: string;
    followUpLabel: string;
    closedLabel: string;
  };
};

const appConfig: BusinessConfig = ${configJson};

const initialRecords: BusinessRecord[] = ${recordsJson};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getStatusClass(status: string) {
  return "status-badge " + status.toLowerCase().replace(/\\\\s+/g, "-");
}

export default function Page() {
  const [records, setRecords] = useState<BusinessRecord[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    contact: "",
    category: "",
    value: "",
    followUp: "",
    notes: "",
  });

  const stats = useMemo(() => {
    const activeRecords = records.filter(
      (record) => !appConfig.closedStatuses.includes(record.status),
    );

    const closedRecords = records.filter((record) =>
      appConfig.closedStatuses.includes(record.status),
    );

    const totalValue = activeRecords.reduce(
      (total, record) => total + record.value,
      0,
    );

    const followUps = activeRecords.filter(
      (record) =>
        record.followUp &&
        record.followUp.toLowerCase() !== "not scheduled",
    );

    return [
      {
        label: appConfig.stats.activeLabel,
        value: activeRecords.length,
        helper: "Currently moving",
      },
      {
        label: appConfig.stats.valueLabel,
        value: money.format(totalValue),
        helper: "Open estimated value",
      },
      {
        label: appConfig.stats.followUpLabel,
        value: followUps.length,
        helper: "Needs next action",
      },
      {
        label: appConfig.stats.closedLabel,
        value: closedRecords.length,
        helper: "Completed or closed",
      },
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.title,
        record.contact,
        record.category,
        record.status,
        record.followUp,
        record.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [records, search]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) return;

    const newRecord: BusinessRecord = {
      id: "record-" + Date.now(),
      title: form.title.trim(),
      contact: form.contact.trim() || "No contact provided",
      category: form.category.trim() || "General",
      value: Number(form.value) || 0,
      followUp: form.followUp.trim() || "Not scheduled",
      notes: form.notes.trim() || "No notes yet.",
      status: appConfig.statusFlow[0] || "New",
    };

    setRecords((current) => [newRecord, ...current]);

    setForm({
      title: "",
      contact: "",
      category: "",
      value: "",
      followUp: "",
      notes: "",
    });
  }

  function moveStatus(id: string) {
    setRecords((current) =>
      current.map((record) => {
        if (record.id !== id) return record;

        const currentIndex = appConfig.statusFlow.indexOf(record.status);
        const nextStatus =
          appConfig.statusFlow[(currentIndex + 1) % appConfig.statusFlow.length] ||
          appConfig.statusFlow[0] ||
          record.status;

        return {
          ...record,
          status: nextStatus,
        };
      }),
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">{appConfig.eyebrow}</p>
          <h1>{appConfig.title}</h1>
          <p className="hero-copy">{appConfig.description}</p>
        </div>
      </section>

      <section className="stat-grid" aria-label="Business overview">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Create</p>
            <h2>{appConfig.createTitle}</h2>
          </div>

          <form className="stacked-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="title">{appConfig.titleLabel}</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={appConfig.titleLabel}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="contact">{appConfig.contactLabel}</label>
              <input
                id="contact"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder={appConfig.contactLabel}
              />
            </div>

            <div className="form-two-column">
              <div className="form-row">
                <label htmlFor="category">{appConfig.categoryLabel}</label>
                <input
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder={appConfig.categoryLabel}
                />
              </div>

              <div className="form-row">
                <label htmlFor="value">{appConfig.valueLabel}</label>
                <input
                  id="value"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="followUp">{appConfig.followUpLabel}</label>
              <input
                id="followUp"
                name="followUp"
                value={form.followUp}
                onChange={handleChange}
                placeholder={appConfig.followUpLabel}
              />
            </div>

            <div className="form-row">
              <label htmlFor="notes">{appConfig.notesLabel}</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder={appConfig.notesLabel}
              />
            </div>

            <button className="button primary full-width" type="submit">
              {appConfig.actionLabel}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading split">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>{appConfig.recordLabel}</h2>
            </div>

            <label className="search-label" htmlFor="search">
              <span className="sr-only">Search</span>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={appConfig.searchPlaceholder}
              />
            </label>
          </div>

          <div className="record-list">
            {filteredRecords.map((record) => (
              <div className="record-card" key={record.id}>
                <div className="record-topline">
                  <div>
                    <h3>{record.title}</h3>
                    <p>{record.category}</p>
                  </div>

                  <span className={getStatusClass(record.status)}>
                    {record.status}
                  </span>
                </div>

                <p className="record-note">{record.notes}</p>

                <div className="record-meta">
                  <span>{record.contact}</span>
                  <span>{money.format(record.value)}</span>
                  <span>Follow-up: {record.followUp}</span>
                  <button
                    className="table-action"
                    type="button"
                    onClick={() => moveStatus(record.id)}
                  >
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

function createGlobalsCss() {
  return `:root {
  --background: #f4f6f8;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --text: #142033;
  --muted: #64748b;
  --border: #d8dee8;
  --primary: #1f3a5f;
  --primary-dark: #152a43;
  --success: #166534;
  --warning: #92400e;
  --danger: #991b1b;
  --shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

.page-shell {
  width: min(1280px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 40px;
}

.hero-card,
.panel,
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.hero-card {
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 800;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 1.05;
}

h2 {
  margin-bottom: 0;
  font-size: 1.35rem;
}

h3 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.hero-copy {
  max-width: 820px;
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.55;
  margin-bottom: 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  border-radius: 12px;
  padding: 16px;
  min-height: 112px;
}

.stat-card span {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.stat-card strong {
  display: block;
  margin: 6px 0;
  font-size: 1.75rem;
}

.stat-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 16px;
  margin-bottom: 16px;
}

.panel {
  border-radius: 12px;
  padding: 18px;
}

.panel-heading {
  margin-bottom: 18px;
}

.panel-heading.split {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.stacked-form {
  display: grid;
  gap: 12px;
}

.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row {
  display: grid;
  gap: 7px;
}

label {
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: white;
  color: var(--text);
  outline: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(31, 58, 95, 0.12);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.button.primary {
  background: var(--primary);
  color: white;
}

.full-width {
  width: 100%;
}

.record-list {
  display: grid;
  gap: 14px;
}

.record-card {
  border: 1px solid var(--border);
  background: var(--surface-soft);
  border-radius: 12px;
  padding: 16px;
}

.record-topline,
.record-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.record-topline p,
.record-note {
  color: var(--muted);
  margin-bottom: 0;
  line-height: 1.5;
}

.record-note {
  margin: 12px 0;
}

.record-meta {
  color: var(--muted);
  font-size: 0.83rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 900;
  background: #e2e8f0;
  color: #334155;
}

.status-badge.contacted,
.status-badge.showing,
.status-badge.sent,
.status-badge.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.offer,
.status-badge.review,
.status-badge.overdue {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.closed,
.status-badge.done,
.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-badge.lost {
  background: #fee2e2;
  color: #991b1b;
}

.search-label {
  min-width: 240px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.table-action {
  border: 1px solid var(--border);
  background: white;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .panel-heading.split {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-label {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .stat-grid,
  .form-two-column {
    grid-template-columns: 1fr;
  }

  .page-shell {
    width: min(100% - 20px, 1280px);
    padding: 16px 0 28px;
  }

  .hero-card,
  .panel {
    padding: 16px;
  }
}
`;
}

function createPreviewHtml(config: BusinessConfig) {
  const total = config.samples.length;
  const active = config.samples.filter(
    (item) => !config.closedStatuses.includes(item.status),
  ).length;
  const totalValue = config.samples.reduce((sum, item) => sum + item.value, 0);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${config.appName} Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f4f6f8; color: #142033; }
    .shell { max-width: 430px; margin: 0 auto; min-height: 100vh; background: white; box-shadow: 0 10px 24px rgba(15,23,42,.12); }
    .hero { background: linear-gradient(135deg, #1f3a5f, #2f4f6f); color: white; padding: 28px; border-radius: 0 0 20px 20px; }
    .badge { display: inline-flex; background: rgba(255,255,255,.18); border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 800; margin-bottom: 14px; }
    h1 { margin: 0 0 10px; font-size: 30px; line-height: 1; }
    p { margin: 0; line-height: 1.5; }
    .content { padding: 22px; display: grid; gap: 14px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { border: 1px solid #d8dee8; border-radius: 14px; padding: 16px; background: #f8fafc; }
    .label { color: #64748b; font-size: 12px; font-weight: 800; }
    .value { display: block; margin-top: 6px; font-size: 24px; font-weight: 900; }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="badge">${config.eyebrow}</div>
      <h1>${config.appName}</h1>
      <p>${config.description}</p>
    </section>

    <section class="content">
      <div class="stats">
        <div class="card"><div class="label">${config.stats.activeLabel}</div><strong class="value">${active}</strong></div>
        <div class="card"><div class="label">${config.stats.valueLabel}</div><strong class="value">$${Math.round(totalValue / 1000)}k</strong></div>
        <div class="card"><div class="label">Total ${config.recordLabel}</div><strong class="value">${total}</strong></div>
        <div class="card"><div class="label">${config.stats.followUpLabel}</div><strong class="value">${active}</strong></div>
      </div>

      ${config.samples
        .slice(0, 3)
        .map(
          (item) =>
            `<div class="card"><strong>${item.title}</strong><p>${item.category} · ${item.status}</p></div>`,
        )
        .join("")}
    </section>
  </main>
</body>
</html>`;
}

export function createBusinessAppTemplate({
  prompt,
}: {
  prompt: string;
}): GeneratedBusinessTemplate {
  const config = inferConfig(prompt);

  const packageJson = `{
  "name": "${config.slug}",
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

// This file was generated by Embr.
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
  title: ${JSON.stringify(config.appName)},
  description: "Generated by Embr.",
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

  const readme = `# ${config.appName}

${prompt}

## Run locally

npm install

npm run dev

Open the local URL printed in the terminal.

## Generated by Embr

This starter is intentionally local-first and uses sample data. The next step is usually adding persistence, auth, deployment, integrations, notifications, or client-specific workflow logic.
`;

  const files: GeneratedBusinessFile[] = [
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
      purpose: "Main business app.",
      content: createPageTsx(config, prompt),
    },
    {
      path: "app/globals.css",
      language: "css",
      purpose: "Global styles and app classes.",
      content: createGlobalsCss(),
    },
    {
      path: "README.md",
      language: "markdown",
      purpose: "Setup and run instructions.",
      content: readme,
    },
  ];

  return {
    templateId: config.templateId,
    appName: config.appName,
    slug: config.slug,
    platform: "business_tool",
    framework: "Next.js",
    summary: config.description,
    previewHtml: createPreviewHtml(config),
    previewType: "interactive_html",
    previewNotes:
      "This preview shows the generated business app layout. The exported project includes a runnable Next.js app.",
    files,
    nextSteps: [
      "Export the ZIP.",
      "Run npm install.",
      "Run npm run dev.",
      "Ask Embr to add persistence, authentication, deployment, integrations, or workflow-specific logic.",
    ],
  };
}
