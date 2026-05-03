type TemplateFile = {
  path: string;
  language: string;
  purpose: string;
  content: string;
};

type TemplateInput = {
  prompt: string;
};

function getAppName(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("cleaning")) return "CleanOps CRM";
  if (lower.includes("crm")) return "Business CRM";

  return "Business Dashboard";
}

function getSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "generated-app"
  );
}

export function createCleaningCrmTemplate({ prompt }: TemplateInput) {
  const appName = getAppName(prompt);
  const slug = getSlug(appName);

  const pageTsx = `"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

type LeadStatus = "New" | "Contacted" | "Estimate Sent" | "Booked";
type CustomerStatus = "Active" | "Needs Follow-up" | "Paused";
type JobStatus = "Scheduled" | "Completed" | "Follow-up";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  source: string;
  status: LeadStatus;
  estimate: number;
  notes: string;
  created: string;
};

type Customer = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  service: string;
  status: CustomerStatus;
  nextVisit: string;
  balance: number;
};

type JobNote = {
  id: string;
  customer: string;
  title: string;
  note: string;
  date: string;
  status: JobStatus;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const initialLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Maya Chen",
    phone: "(555) 014-2289",
    email: "maya@example.com",
    service: "Move-out clean",
    source: "Website form",
    status: "Estimate Sent",
    estimate: 320,
    notes: "Needs apartment cleaned before keys are returned Friday.",
    created: "Today",
  },
  {
    id: "lead-2",
    name: "Riverside Dental",
    phone: "(555) 018-4490",
    email: "office@riversidedental.example",
    service: "Recurring office clean",
    source: "Referral",
    status: "Contacted",
    estimate: 860,
    notes: "Asked for evening availability twice per week.",
    created: "Yesterday",
  },
];

const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Olivia Martin",
    address: "1420 Cedar Lane",
    phone: "(555) 011-3044",
    email: "olivia@example.com",
    service: "Bi-weekly home cleaning",
    status: "Active",
    nextVisit: "Tue, 9:00 AM",
    balance: 0,
  },
  {
    id: "cust-2",
    name: "Northpoint Realty",
    address: "88 Market Street, Suite 210",
    phone: "(555) 017-9021",
    email: "ops@northpoint.example",
    service: "Turnover cleaning",
    status: "Active",
    nextVisit: "Wed, 1:30 PM",
    balance: 240,
  },
  {
    id: "cust-3",
    name: "Samir Patel",
    address: "730 Willow Court",
    phone: "(555) 015-7720",
    email: "samir@example.com",
    service: "Monthly deep clean",
    status: "Needs Follow-up",
    nextVisit: "Not scheduled",
    balance: 180,
  },
];

const initialJobNotes: JobNote[] = [
  {
    id: "job-1",
    customer: "Olivia Martin",
    title: "Bi-weekly visit",
    note: "Completed kitchen, bathrooms, floors, and dusting. Client requested oven add-on next visit.",
    date: "Today",
    status: "Completed",
  },
  {
    id: "job-2",
    customer: "Northpoint Realty",
    title: "Unit 4B turnover",
    note: "Bring extra degreaser and replacement mop pads. Lockbox code confirmed.",
    date: "Tomorrow",
    status: "Scheduled",
  },
  {
    id: "job-3",
    customer: "Samir Patel",
    title: "Follow-up call",
    note: "Left voicemail about rescheduling monthly deep clean and collecting open balance.",
    date: "Yesterday",
    status: "Follow-up",
  },
];

function getStatusClass(status: string) {
  return "status-badge " + status.toLowerCase().replace(/\\s+/g, "-");
}

export default function Page() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [jobNotes, setJobNotes] = useState<JobNote[]>(initialJobNotes);
  const [customerSearch, setCustomerSearch] = useState("");

  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Standard home cleaning",
    source: "Website form",
    estimate: "",
    notes: "",
  });

  const [noteForm, setNoteForm] = useState({
    customerId: initialCustomers[0]?.id ?? "",
    title: "Visit note",
    note: "",
  });

  const stats = useMemo(() => {
    const openLeads = leads.filter((lead) => lead.status !== "Booked");
    const activeCustomers = customers.filter(
      (customer) => customer.status === "Active",
    );
    const scheduledJobs = jobNotes.filter((job) => job.status === "Scheduled");
    const pipelineValue = openLeads.reduce(
      (total, lead) => total + lead.estimate,
      0,
    );

    return [
      {
        label: "Open leads",
        value: openLeads.length,
        helper: "Requests waiting on follow-up",
      },
      {
        label: "Active customers",
        value: activeCustomers.length,
        helper: "Recurring or recently served",
      },
      {
        label: "Scheduled jobs",
        value: scheduledJobs.length,
        helper: "Upcoming cleanings in the queue",
      },
      {
        label: "Lead pipeline",
        value: currencyFormatter.format(pipelineValue),
        helper: "Estimated value of open leads",
      },
    ];
  }, [customers, jobNotes, leads]);

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (!search) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.address,
        customer.phone,
        customer.email,
        customer.service,
        customer.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [customerSearch, customers]);

  function handleLeadChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setLeadForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleNoteChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setNoteForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leadForm.name.trim()) return;

    const newLead: Lead = {
      id: "lead-" + Date.now(),
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim() || "Not provided",
      email: leadForm.email.trim() || "Not provided",
      service: leadForm.service,
      source: leadForm.source,
      status: "New",
      estimate: Number(leadForm.estimate) || 0,
      notes: leadForm.notes.trim() || "No notes yet.",
      created: "Today",
    };

    setLeads((current) => [newLead, ...current]);

    setLeadForm({
      name: "",
      phone: "",
      email: "",
      service: "Standard home cleaning",
      source: "Website form",
      estimate: "",
      notes: "",
    });
  }

  function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedCustomer = customers.find(
      (customer) => customer.id === noteForm.customerId,
    );

    if (!selectedCustomer || !noteForm.note.trim()) return;

    const newNote: JobNote = {
      id: "job-" + Date.now(),
      customer: selectedCustomer.name,
      title: noteForm.title.trim() || "Job note",
      note: noteForm.note.trim(),
      date: "Just now",
      status: "Follow-up",
    };

    setJobNotes((current) => [newNote, ...current]);

    setNoteForm((current) => ({
      ...current,
      title: "Visit note",
      note: "",
    }));
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">CRM Starter</p>
          <h1>Cleaning business dashboard</h1>
          <p className="hero-copy">
            Capture leads, track customers, and keep job notes organized from one
            simple workspace.
          </p>
        </div>

        <div className="hero-actions">
          <a href="#lead-capture" className="button primary">
            Add lead
          </a>
          <a href="#customers" className="button secondary">
            View customers
          </a>
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
        <article className="panel" id="lead-capture">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Lead capture</p>
              <h2>New quote request</h2>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleLeadSubmit}>
            <div className="form-row">
              <label htmlFor="lead-name">Name</label>
              <input
                id="lead-name"
                name="name"
                type="text"
                value={leadForm.name}
                onChange={handleLeadChange}
                placeholder="Customer or company name"
                required
              />
            </div>

            <div className="form-two-column">
              <div className="form-row">
                <label htmlFor="lead-phone">Phone</label>
                <input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  value={leadForm.phone}
                  onChange={handleLeadChange}
                  placeholder="(555) 000-0000"
                />
              </div>

              <div className="form-row">
                <label htmlFor="lead-email">Email</label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  value={leadForm.email}
                  onChange={handleLeadChange}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="form-two-column">
              <div className="form-row">
                <label htmlFor="lead-service">Service</label>
                <select
                  id="lead-service"
                  name="service"
                  value={leadForm.service}
                  onChange={handleLeadChange}
                >
                  <option>Standard home cleaning</option>
                  <option>Deep clean</option>
                  <option>Move-out clean</option>
                  <option>Recurring office clean</option>
                  <option>Turnover cleaning</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="lead-estimate">Estimate</label>
                <input
                  id="lead-estimate"
                  name="estimate"
                  type="number"
                  min="0"
                  value={leadForm.estimate}
                  onChange={handleLeadChange}
                  placeholder="250"
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="lead-source">Source</label>
              <select
                id="lead-source"
                name="source"
                value={leadForm.source}
                onChange={handleLeadChange}
              >
                <option>Website form</option>
                <option>Referral</option>
                <option>Google Business Profile</option>
                <option>Phone call</option>
                <option>Walk-in</option>
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="lead-notes">Notes</label>
              <textarea
                id="lead-notes"
                name="notes"
                value={leadForm.notes}
                onChange={handleLeadChange}
                placeholder="Rooms, timing, access instructions, pets, or special requests"
                rows={4}
              />
            </div>

            <button className="button primary full-width" type="submit">
              Save lead
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Follow-up queue</p>
              <h2>Recent leads</h2>
            </div>
          </div>

          <div className="record-list">
            {leads.map((lead) => (
              <div className="record-card" key={lead.id}>
                <div className="record-topline">
                  <div>
                    <h3>{lead.name}</h3>
                    <p>{lead.service}</p>
                  </div>

                  <span className={getStatusClass(lead.status)}>
                    {lead.status}
                  </span>
                </div>

                <p className="record-note">{lead.notes}</p>

                <div className="record-meta">
                  <span>{lead.phone}</span>
                  <span>{lead.source}</span>
                  <span>{currencyFormatter.format(lead.estimate)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel wide-panel" id="customers">
        <div className="panel-heading split">
          <div>
            <p className="eyebrow">Customer list</p>
            <h2>Customers and recurring accounts</h2>
          </div>

          <label className="search-label" htmlFor="customer-search">
            <span className="sr-only">Search customers</span>
            <input
              id="customer-search"
              type="search"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search customers"
            />
          </label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Next visit</th>
                <th>Status</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                    <span>{customer.address}</span>
                    <span>{customer.phone}</span>
                  </td>
                  <td>{customer.service}</td>
                  <td>{customer.nextVisit}</td>
                  <td>
                    <span className={getStatusClass(customer.status)}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    {customer.balance === 0
                      ? "Paid"
                      : currencyFormatter.format(customer.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Job notes</p>
              <h2>Add a service update</h2>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleNoteSubmit}>
            <div className="form-row">
              <label htmlFor="note-customer">Customer</label>
              <select
                id="note-customer"
                name="customerId"
                value={noteForm.customerId}
                onChange={handleNoteChange}
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="note-title">Note title</label>
              <input
                id="note-title"
                name="title"
                type="text"
                value={noteForm.title}
                onChange={handleNoteChange}
                placeholder="Visit note"
              />
            </div>

            <div className="form-row">
              <label htmlFor="note-body">Details</label>
              <textarea
                id="note-body"
                name="note"
                value={noteForm.note}
                onChange={handleNoteChange}
                placeholder="What was completed, what needs attention, or what to bring next time?"
                rows={5}
                required
              />
            </div>

            <button className="button primary full-width" type="submit">
              Save job note
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>Job notes</h2>
            </div>
          </div>

          <div className="record-list">
            {jobNotes.map((job) => (
              <div className="record-card" key={job.id}>
                <div className="record-topline">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.customer}</p>
                  </div>

                  <span className={getStatusClass(job.status)}>
                    {job.status}
                  </span>
                </div>

                <p className="record-note">{job.note}</p>

                <div className="record-meta">
                  <span>{job.date}</span>
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

  const globalsCss = `:root {
  --background: #f4f6f8;
  --surface: #ffffff;
  --surface-soft: #f1f5f9;
  --text: #122033;
  --muted: #667789;
  --border: #d9e2ec;
  --primary: #1f3a5f;
  --primary-dark: #152a43;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
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
  background:
    var(--background);
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
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 56px;
}

.hero-card,
.panel,
.stat-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
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
  margin-bottom: 12px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
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
  max-width: 620px;
  color: var(--muted);
  font-size: 1.08rem;
  line-height: 1.7;
  margin-bottom: 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

.button.primary:hover {
  background: var(--primary-dark);
}

.button.secondary {
  background: var(--surface-soft);
  color: var(--text);
}

.full-width {
  width: 100%;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 14px;
  padding: 22px;
}

.stat-card span {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.stat-card strong {
  display: block;
  margin: 10px 0;
  font-size: 2rem;
}

.stat-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  border-radius: 14px;
  padding: 24px;
}

.wide-panel {
  margin-bottom: 20px;
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
  gap: 16px;
}

.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
  border-radius: 14px;
  padding: 12px 14px;
  background: white;
  color: var(--text);
  outline: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
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
}

.record-topline p {
  color: var(--muted);
  margin-bottom: 0;
}

.record-note {
  color: var(--muted);
  line-height: 1.55;
  margin: 12px 0;
}

.record-meta {
  color: var(--muted);
  font-size: 0.83rem;
  flex-wrap: wrap;
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

.status-badge.new,
.status-badge.contacted,
.status-badge.needs-follow-up,
.status-badge.follow-up {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.estimate-sent,
.status-badge.scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.booked,
.status-badge.active,
.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.paused {
  background: #fee2e2;
  color: #991b1b;
}

.search-label {
  min-width: 260px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

td span {
  display: block;
  color: var(--muted);
  margin-top: 4px;
  font-size: 0.86rem;
}

@media (max-width: 900px) {
  .hero-card,
  .panel-heading.split,
  .record-topline {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-grid,
  .dashboard-grid,
  .form-two-column {
    grid-template-columns: 1fr;
  }

  .search-label {
    width: 100%;
    min-width: 0;
  }
}
`;

  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${appName}",
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

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`;

  const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file was generated by Embr.
`;

  const readme = `# ${appName}

${prompt}

## Run locally

Install dependencies:

npm install

Start the development server:

npm run dev

Open the local URL printed in the terminal.

## Generated by Embr

This starter is intentionally local-first and uses sample data. The next step is usually adding persistence, auth, deployment, or client-specific workflow logic.
`;

  const previewHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${appName} Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f8fb;
      color: #122033;
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
      gap: 16px;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .card {
      border: 1px solid #d9e2ec;
      border-radius: 12px;
      padding: 16px;
      background: #f8fafc;
    }
    .label {
      color: #667789;
      font-size: 12px;
      font-weight: 800;
    }
    .value {
      display: block;
      margin-top: 6px;
      font-size: 26px;
      font-weight: 900;
    }
    .button {
      display: block;
      text-align: center;
      border-radius: 999px;
      padding: 13px 18px;
      background: #2563eb;
      color: white;
      font-weight: 900;
      text-decoration: none;
    }
    .list {
      display: grid;
      gap: 10px;
    }
    .item {
      border: 1px solid #d9e2ec;
      border-radius: 16px;
      padding: 14px;
      background: white;
    }
    .item strong {
      display: block;
      margin-bottom: 4px;
    }
    .item span {
      color: #667789;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="badge">Cleaning Business CRM</div>
      <h1>${appName}</h1>
      <p>Capture leads, track customers, and keep job notes organized from one simple workspace.</p>
    </section>

    <section class="content">
      <div class="stats">
        <div class="card">
          <div class="label">Open leads</div>
          <strong class="value">2</strong>
        </div>
        <div class="card">
          <div class="label">Pipeline</div>
          <strong class="value">$1.2k</strong>
        </div>
        <div class="card">
          <div class="label">Customers</div>
          <strong class="value">3</strong>
        </div>
        <div class="card">
          <div class="label">Jobs</div>
          <strong class="value">1</strong>
        </div>
      </div>

      <a class="button" href="#">Capture Lead</a>

      <div class="list">
        <div class="item">
          <strong>Maya Chen</strong>
          <span>Move-out clean · Estimate sent</span>
        </div>
        <div class="item">
          <strong>Riverside Dental</strong>
          <span>Recurring office clean · Contacted</span>
        </div>
        <div class="item">
          <strong>Olivia Martin</strong>
          <span>Bi-weekly home cleaning · Active customer</span>
        </div>
      </div>
    </section>
  </main>
</body>
</html>
`;

  const files: TemplateFile[] = [
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
      purpose: "Main CRM dashboard app.",
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

  return {
    appName,
    slug,
    platform: "business_tool",
    framework: "Next.js",
    summary:
      "A local-first CRM starter for a cleaning business with lead capture, customer tracking, job notes, and dashboard metrics.",
    previewHtml,
    previewType: "interactive_html",
    previewNotes:
      "This preview shows the generated CRM starter layout. The exported project includes a runnable Next.js app.",
    files,
    nextSteps: [
      "Export the ZIP.",
      "Run npm install.",
      "Run npm run dev.",
      "Ask Embr to add persistence, authentication, or deployment setup.",
    ],
  };
}
