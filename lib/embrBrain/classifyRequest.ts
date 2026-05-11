export type EmbrIntent =
  | "business_app"
  | "business_document"
  | "code_repair"
  | "research"
  | "general";

export type EmbrDomain =
  | "real_estate"
  | "invoice_finance"
  | "crm"
  | "proposal"
  | "business_plan"
  | "resume"
  | "app_builder"
  | "general_business"
  | "general";

export type EmbrPlan = {
  intent: EmbrIntent;
  domain: EmbrDomain;
  complexity: "light" | "medium" | "heavy";
  useResearch: boolean;
  useCritic: boolean;
  shouldAskClarifyingQuestions: boolean;
  reason: string;
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function classifyRequest(prompt: string): EmbrPlan {
  const lower = prompt.toLowerCase();

  const realEstate = includesAny(lower, [
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
    "buyers",
    "sellers",
  ]);

  const invoiceFinance = includesAny(lower, [
    "invoice",
    "billing",
    "payment tracking",
    "payment status",
    "overdue",
    "freelancer",
    "accounts receivable",
    "finance",
    "banking",
    "cash flow",
    "budget planner",
  ]);

  const crm = includesAny(lower, [
    "crm",
    "lead tracker",
    "customer",
    "client portal",
    "service business",
    "cleaning",
    "landscaping",
    "contractor",
  ]);

  const proposal = includesAny(lower, [
    "proposal",
    "scope of work",
    "statement of work",
    "quote",
    "client proposal",
  ]);

  const businessPlan = includesAny(lower, [
    "business plan",
    "mission statement",
    "go to market",
    "marketing plan",
    "startup plan",
  ]);

  const resume = includesAny(lower, ["resume", "cv", "cover letter"]);

  const codeRepair = includesAny(lower, [
    "fix this code",
    "debug",
    "build error",
    "failed to compile",
    "typescript error",
    "react error",
  ]);

  const appRequest = includesAny(lower, [
    "build me",
    "create an app",
    "make an app",
    "dashboard",
    "tracker",
    "portal",
    "tool",
    "system",
  ]);

  if (realEstate) {
    return {
      intent: "business_app",
      domain: "real_estate",
      complexity: "heavy",
      useResearch: true,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected real estate-specific workflow terms. Must create real estate pipeline logic, not generic records or budget tracking.",
    };
  }

  if (invoiceFinance) {
    return {
      intent: "business_app",
      domain: "invoice_finance",
      complexity: "heavy",
      useResearch: lower.includes("finance") || lower.includes("banking"),
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected invoice/finance workflow. Must create billing/payment logic with clients, invoices, statuses, and follow-up.",
    };
  }

  if (crm) {
    return {
      intent: "business_app",
      domain: "crm",
      complexity: "medium",
      useResearch: false,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected CRM/lead/customer workflow. Must create lead/client tracking with statuses, notes, and next actions.",
    };
  }

  if (proposal) {
    return {
      intent: "business_document",
      domain: "proposal",
      complexity: "medium",
      useResearch: false,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected proposal/scope request. Must produce a professional first draft, not ask excessive setup questions.",
    };
  }

  if (businessPlan) {
    return {
      intent: "business_document",
      domain: "business_plan",
      complexity: "heavy",
      useResearch: true,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected business plan/strategy request. Research and critique are useful.",
    };
  }

  if (resume) {
    return {
      intent: "business_document",
      domain: "resume",
      complexity: "medium",
      useResearch: false,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected resume/career document request. Must create a professional draft.",
    };
  }

  if (codeRepair) {
    return {
      intent: "code_repair",
      domain: "app_builder",
      complexity: "heavy",
      useResearch: false,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected code repair/build failure. Must analyze and fix, not give generic advice.",
    };
  }

  if (appRequest) {
    return {
      intent: "business_app",
      domain: "general_business",
      complexity: "medium",
      useResearch: false,
      useCritic: true,
      shouldAskClarifyingQuestions: false,
      reason:
        "Detected app/tool/dashboard request. Must create a useful business starter and avoid generic fallback if domain clues exist.",
    };
  }

  return {
    intent: "general",
    domain: "general",
    complexity: "light",
    useResearch: false,
    useCritic: false,
    shouldAskClarifyingQuestions: false,
    reason:
      "General request. Answer directly with clear human explanation unless more context is truly required.",
  };
}
