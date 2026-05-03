import { createCleaningCrmTemplate } from "@/lib/appTemplates/cleaningCrmTemplate";
import { createInvoiceTrackerTemplate } from "@/lib/appTemplates/invoiceTrackerTemplate";
import { createUniversalNextTemplate } from "@/lib/appTemplates/universalNextTemplate";

type TemplateInput = {
  prompt: string;
  platform?: string;
  framework?: string;
};

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

export function createGeneratedAppFromPrompt({
  prompt,
}: TemplateInput) {
  if (shouldUseInvoiceTemplate(prompt)) {
    return createInvoiceTrackerTemplate({ prompt });
  }

  if (shouldUseCleaningCrmTemplate(prompt)) {
    return createCleaningCrmTemplate({ prompt });
  }

  return createUniversalNextTemplate({ prompt });
}
