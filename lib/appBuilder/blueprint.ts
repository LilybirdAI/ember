export type FieldKind = "text" | "number" | "select" | "textarea";

export type BusinessField = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: string[];
};

export type BusinessRecord = {
  id: string;
  status: string;
  data: Record<string, string>;
};

export type BusinessAppBlueprint = {
  appType: string;
  appName: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryEntity: string;
  createTitle: string;
  actionLabel: string;
  searchPlaceholder: string;
  fields: BusinessField[];
  statuses: string[];
  closedStatuses: string[];
  titleFieldKey: string;
  contactFieldKey: string;
  valueFieldKey: string;
  followUpFieldKey: string;
  notesFieldKey: string;
  subtitleFieldKeys: string[];
  statsLabels: {
    active: string;
    value: string;
    followUp: string;
    closed: string;
  };
  samples: BusinessRecord[];
  nextSteps: string[];
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

function baseNextSteps(entityName: string) {
  return [
    "Export the ZIP.",
    "Run npm install.",
    "Run npm run dev.",
    `Ask Embr to add persistence, authentication, reminders, integrations, or advanced ${entityName.toLowerCase()} workflows.`,
  ];
}

function realEstateBlueprint(): BusinessAppBlueprint {
  return {
    appType: "real_estate_lead_tracker",
    appName: "Real Estate Lead Tracker",
    slug: "real-estate-lead-tracker",
    eyebrow: "Real Estate Pipeline",
    title: "Broker lead and deal command center",
    description:
      "Track buyer, seller, and investor leads with source attribution, agent ownership, property interest, price context, follow-up actions, commission pipeline, and closing milestones.",
    primaryEntity: "Real Estate Leads",
    createTitle: "Add real estate lead",
    actionLabel: "Save lead",
    searchPlaceholder:
      "Search leads, source, agent, property type, area, status, or next action",
    fields: [
      {
        key: "leadName",
        label: "Lead name",
        kind: "text",
        placeholder: "Name, couple, company, or investor group",
      },
      {
        key: "leadType",
        label: "Lead type",
        kind: "select",
        options: ["Buyer", "Seller", "Investor", "Renter"],
      },
      {
        key: "leadSource",
        label: "Lead source",
        kind: "select",
        options: [
          "Website form",
          "Referral",
          "Zillow",
          "Realtor.com",
          "Open house",
          "Cold call",
          "Social media",
          "Direct mail",
          "Other",
        ],
      },
      {
        key: "assignedAgent",
        label: "Assigned agent",
        kind: "text",
        placeholder: "Agent responsible for follow-up",
      },
      {
        key: "contact",
        label: "Phone / email",
        kind: "text",
        placeholder: "(555) 000-0000 · name@example.com",
      },
      {
        key: "propertyType",
        label: "Property type",
        kind: "select",
        options: [
          "Single-family",
          "Condo",
          "Townhome",
          "Multifamily",
          "Commercial",
          "Land",
          "Mixed-use",
        ],
      },
      {
        key: "propertyInterest",
        label: "Property interest",
        kind: "text",
        placeholder: "Specific listing, buyer criteria, seller property, or investment target",
      },
      {
        key: "propertyAddress",
        label: "Property / target address",
        kind: "text",
        placeholder: "123 Main St or target area",
      },
      {
        key: "targetArea",
        label: "Target area",
        kind: "text",
        placeholder: "Neighborhood, city, market, school district",
      },
      {
        key: "priceContext",
        label: "Price context",
        kind: "select",
        options: [
          "Buyer budget",
          "Seller expected price",
          "Investor max offer",
          "Listing price",
          "Rental range",
        ],
      },
      {
        key: "priceRange",
        label: "Price range",
        kind: "text",
        placeholder: "$500k–$750k",
      },
      {
        key: "dealValue",
        label: "Deal / property value",
        kind: "number",
        placeholder: "750000",
      },
      {
        key: "commissionEstimate",
        label: "Commission estimate",
        kind: "number",
        placeholder: "22500",
      },
      {
        key: "nextAction",
        label: "Next action",
        kind: "select",
        options: [
          "Call",
          "Text",
          "Email",
          "Schedule showing",
          "Send comps",
          "Prepare CMA",
          "Contract review",
          "Follow-up reminder",
        ],
      },
      {
        key: "nextFollowUp",
        label: "Next follow-up date",
        kind: "text",
        placeholder: "Tomorrow, Friday, May 15...",
      },
      {
        key: "lastContactOutcome",
        label: "Last contact outcome",
        kind: "select",
        options: [
          "No answer",
          "Left voicemail",
          "Responded",
          "Scheduled showing",
          "Needs CMA",
          "Sent offer",
          "Not interested",
        ],
      },
      {
        key: "expectedCloseDate",
        label: "Expected close date",
        kind: "text",
        placeholder: "June 30, 2026",
      },
      {
        key: "milestone",
        label: "Deal milestone",
        kind: "select",
        options: [
          "Lead intake",
          "Pre-approval",
          "Showing",
          "Offer prep",
          "Under contract",
          "Inspection",
          "Financing",
          "Closing",
        ],
      },
      {
        key: "notes",
        label: "Notes",
        kind: "textarea",
        placeholder:
          "Motivation, objections, financing, property details, duplicate warnings, client preferences, or next action",
      },
    ],
    statuses: [
      "New",
      "Contacted",
      "Showing",
      "Offer",
      "Under Contract",
      "Closed",
      "Lost",
    ],
    closedStatuses: ["Closed", "Lost"],
    titleFieldKey: "leadName",
    contactFieldKey: "contact",
    valueFieldKey: "commissionEstimate",
    followUpFieldKey: "nextFollowUp",
    notesFieldKey: "notes",
    subtitleFieldKeys: [
      "leadType",
      "leadSource",
      "propertyType",
      "targetArea",
      "priceRange",
      "assignedAgent",
    ],
    statsLabels: {
      active: "Active pipeline",
      value: "Commission pipeline",
      followUp: "Follow-ups due",
      closed: "Closed / Lost",
    },
    samples: [
      {
        id: "lead-1",
        status: "Showing",
        data: {
          leadName: "Avery Brooks",
          leadType: "Buyer",
          leadSource: "Website form",
          assignedAgent: "Dana Lewis",
          contact: "(555) 014-9011 · avery@example.com",
          propertyType: "Single-family",
          propertyInterest: "3 bed home with garage and strong school district",
          propertyAddress: "North Shore target area",
          targetArea: "North Shore",
          priceContext: "Buyer budget",
          priceRange: "$650k–$800k",
          dealValue: "725000",
          commissionEstimate: "21750",
          nextAction: "Schedule showing",
          nextFollowUp: "Tomorrow",
          lastContactOutcome: "Responded",
          expectedCloseDate: "July 15",
          milestone: "Showing",
          notes:
            "Pre-approved buyer. Wants strong schools, garage, and fast showing availability.",
        },
      },
      {
        id: "lead-2",
        status: "Contacted",
        data: {
          leadName: "Morgan Lee",
          leadType: "Seller",
          leadSource: "Referral",
          assignedAgent: "Marcus Reed",
          contact: "(555) 014-9022 · morgan@example.com",
          propertyType: "Condo",
          propertyInterest: "Potential downtown condo listing",
          propertyAddress: "88 Market Street, Unit 4B",
          targetArea: "Downtown",
          priceContext: "Seller expected price",
          priceRange: "$525k–$600k",
          dealValue: "560000",
          commissionEstimate: "16800",
          nextAction: "Prepare CMA",
          nextFollowUp: "Friday",
          lastContactOutcome: "Needs CMA",
          expectedCloseDate: "August 1",
          milestone: "Lead intake",
          notes:
            "Needs CMA, listing prep checklist, and pricing conversation before signing.",
        },
      },
      {
        id: "lead-3",
        status: "Offer",
        data: {
          leadName: "Harbor Capital Group",
          leadType: "Investor",
          leadSource: "Cold call",
          assignedAgent: "Priya Shah",
          contact: "(555) 014-9033 · deals@harborcapital.example",
          propertyType: "Multifamily",
          propertyInterest: "4-8 unit value-add multifamily",
          propertyAddress: "Metro West target area",
          targetArea: "Metro West",
          priceContext: "Investor max offer",
          priceRange: "$900k–$1.4M",
          dealValue: "1250000",
          commissionEstimate: "37500",
          nextAction: "Contract review",
          nextFollowUp: "Today",
          lastContactOutcome: "Sent offer",
          expectedCloseDate: "June 30",
          milestone: "Offer prep",
          notes:
            "Investor wants upside, rent growth, and off-market opportunities. Watch duplicate lead risk across agents.",
        },
      },
    ],
    nextSteps: baseNextSteps("real estate"),
  };
}

function invoiceBlueprint(prompt: string): BusinessAppBlueprint {
  const freelancer = prompt.toLowerCase().includes("freelancer");

  return {
    appType: "invoice_tracker",
    appName: freelancer ? "Freelancer Invoice Tracker" : "Invoice Tracker",
    slug: freelancer ? "freelancer-invoice-tracker" : "invoice-tracker",
    eyebrow: "Invoice Tracker",
    title: "Professional billing dashboard",
    description:
      "Track clients, invoices, payment status, overdue balances, due dates, and follow-up work from one clean workspace.",
    primaryEntity: "Invoices",
    createTitle: "Create invoice",
    actionLabel: "Save invoice",
    searchPlaceholder: "Search invoices, clients, status, or notes",
    fields: [
      {
        key: "invoiceTitle",
        label: "Invoice title",
        kind: "text",
        placeholder: "Project milestone, retainer, or service",
      },
      {
        key: "client",
        label: "Client / contact",
        kind: "text",
        placeholder: "Client name · email",
      },
      {
        key: "category",
        label: "Service / project type",
        kind: "text",
        placeholder: "Web project, retainer, consulting...",
      },
      {
        key: "amount",
        label: "Amount",
        kind: "number",
        placeholder: "1500",
      },
      {
        key: "dueDate",
        label: "Due date / follow-up",
        kind: "text",
        placeholder: "May 15",
      },
      {
        key: "notes",
        label: "Notes",
        kind: "textarea",
        placeholder: "Payment terms, scope, reminder details, or next action",
      },
    ],
    statuses: ["Draft", "Sent", "Paid", "Overdue"],
    closedStatuses: ["Paid"],
    titleFieldKey: "invoiceTitle",
    contactFieldKey: "client",
    valueFieldKey: "amount",
    followUpFieldKey: "dueDate",
    notesFieldKey: "notes",
    subtitleFieldKeys: ["client", "category", "dueDate"],
    statsLabels: {
      active: "Open invoices",
      value: "Outstanding",
      followUp: "Follow-ups",
      closed: "Paid",
    },
    samples: [
      {
        id: "inv-1",
        status: "Sent",
        data: {
          invoiceTitle: "Website refresh deposit",
          client: "Brightline Studio · dana@brightline.example",
          category: "Web project",
          amount: "2400",
          dueDate: "May 3",
          notes: "Initial deposit for homepage redesign and brand cleanup.",
        },
      },
      {
        id: "inv-2",
        status: "Draft",
        data: {
          invoiceTitle: "Lead dashboard MVP",
          client: "North Harbor Realty · marcus@northharbor.example",
          category: "Business app",
          amount: "5200",
          dueDate: "May 10",
          notes: "Draft invoice waiting on final scope approval.",
        },
      },
      {
        id: "inv-3",
        status: "Paid",
        data: {
          invoiceTitle: "Monthly support retainer",
          client: "Stonebridge Consulting · priya@stonebridge.example",
          category: "Retainer",
          amount: "1800",
          dueDate: "Paid Apr 21",
          notes: "April support and maintenance retainer.",
        },
      },
    ],
    nextSteps: baseNextSteps("invoice"),
  };
}

function crmBlueprint(): BusinessAppBlueprint {
  return {
    appType: "business_crm",
    appName: "Business CRM",
    slug: "business-crm",
    eyebrow: "Business CRM",
    title: "Client and lead management dashboard",
    description:
      "Capture leads, track customers, organize notes, and manage follow-up work from one professional workspace.",
    primaryEntity: "Clients / Leads",
    createTitle: "Add client or lead",
    actionLabel: "Save record",
    searchPlaceholder: "Search clients, leads, services, or status",
    fields: [
      {
        key: "name",
        label: "Name / company",
        kind: "text",
        placeholder: "Client or company name",
      },
      {
        key: "contact",
        label: "Phone / email",
        kind: "text",
        placeholder: "(555) 000-0000 · name@example.com",
      },
      {
        key: "service",
        label: "Service / interest",
        kind: "text",
        placeholder: "Service, package, or project type",
      },
      {
        key: "value",
        label: "Estimated value",
        kind: "number",
        placeholder: "2500",
      },
      {
        key: "nextFollowUp",
        label: "Next follow-up",
        kind: "text",
        placeholder: "Tomorrow, Friday, May 15...",
      },
      {
        key: "notes",
        label: "Notes",
        kind: "textarea",
        placeholder: "Scope, objections, timeline, or next action",
      },
    ],
    statuses: ["New", "Contacted", "Proposal", "Active", "Closed"],
    closedStatuses: ["Closed"],
    titleFieldKey: "name",
    contactFieldKey: "contact",
    valueFieldKey: "value",
    followUpFieldKey: "nextFollowUp",
    notesFieldKey: "notes",
    subtitleFieldKeys: ["service", "nextFollowUp"],
    statsLabels: {
      active: "Active records",
      value: "Pipeline value",
      followUp: "Follow-ups",
      closed: "Closed",
    },
    samples: [
      {
        id: "crm-1",
        status: "Proposal",
        data: {
          name: "Maya Chen",
          contact: "(555) 014-2289 · maya@example.com",
          service: "New service request",
          value: "3200",
          nextFollowUp: "Tomorrow",
          notes: "Needs proposal and service timeline.",
        },
      },
      {
        id: "crm-2",
        status: "Active",
        data: {
          name: "Riverside Dental",
          contact: "(555) 018-4490 · office@riverside.example",
          service: "Recurring account",
          value: "8600",
          nextFollowUp: "Friday",
          notes: "Ongoing commercial service account.",
        },
      },
    ],
    nextSteps: baseNextSteps("CRM"),
  };
}

function universalBlueprint(prompt: string): BusinessAppBlueprint {
  return {
    appType: "business_system",
    appName: "Business System",
    slug: "business-system",
    eyebrow: "Business System",
    title: "Professional operations dashboard",
    description:
      "Turn a business workflow into a structured workspace with records, statuses, value tracking, notes, and follow-ups.",
    primaryEntity: "Records",
    createTitle: "Add record",
    actionLabel: "Save record",
    searchPlaceholder: "Search records",
    fields: [
      {
        key: "title",
        label: "Record title",
        kind: "text",
        placeholder: "Record title",
      },
      {
        key: "contact",
        label: "Contact / owner",
        kind: "text",
        placeholder: "Owner, client, or contact",
      },
      {
        key: "category",
        label: "Category",
        kind: "text",
        placeholder: "Category or workflow type",
      },
      {
        key: "value",
        label: "Value",
        kind: "number",
        placeholder: "0",
      },
      {
        key: "followUp",
        label: "Follow-up",
        kind: "text",
        placeholder: "Today, tomorrow, this week...",
      },
      {
        key: "notes",
        label: "Notes",
        kind: "textarea",
        placeholder: "Notes or next action",
      },
    ],
    statuses: ["New", "Active", "Review", "Done"],
    closedStatuses: ["Done"],
    titleFieldKey: "title",
    contactFieldKey: "contact",
    valueFieldKey: "value",
    followUpFieldKey: "followUp",
    notesFieldKey: "notes",
    subtitleFieldKeys: ["category", "followUp"],
    statsLabels: {
      active: "Active records",
      value: "Total value",
      followUp: "Follow-ups",
      closed: "Done",
    },
    samples: [
      {
        id: "record-1",
        status: "Active",
        data: {
          title: "Starter record",
          contact: "Internal owner",
          category: "Primary workflow",
          value: "1200",
          followUp: "Today",
          notes: `Generated from prompt: ${prompt}`,
        },
      },
    ],
    nextSteps: baseNextSteps("business"),
  };
}

export function createBusinessBlueprint(prompt: string): BusinessAppBlueprint {
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
    return realEstateBlueprint();
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
    return invoiceBlueprint(prompt);
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
    return crmBlueprint();
  }

  return universalBlueprint(prompt);
}
