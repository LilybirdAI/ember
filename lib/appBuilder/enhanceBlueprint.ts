import OpenAI from "openai";
import { getHeavyModel } from "@/lib/aiConfig";
import type {
  BusinessAppBlueprint,
  BusinessField,
  BusinessRecord,
  FieldKind,
} from "@/lib/appBuilder/blueprint";

type BrainResult = {
  plan?: unknown;
  research?: unknown;
  critic?: unknown;
  steps?: unknown;
};

type EnhancementResult = {
  blueprint: BusinessAppBlueprint;
  usedAi: boolean;
  raw?: string;
  error?: string;
};

const allowedKinds = new Set<FieldKind>([
  "text",
  "number",
  "select",
  "textarea",
]);

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
      .slice(0, 70) || "generated-business-app"
  );
}

function parseJsonOutput(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Could not parse blueprint JSON.");
  }
}

function makeFieldKey(value: string, fallback: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9\s_-]/g, " ")
    .split(/[\s_-]+/)
    .filter(Boolean);

  if (cleaned.length === 0) return fallback;

  const [first, ...rest] = cleaned;

  return [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
  ].join("");
}

function normalizeField(raw: unknown, fallbackKey: string): BusinessField | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<BusinessField>;

  const label = cleanString(item.label || item.key, fallbackKey);
  const key = makeFieldKey(cleanString(item.key || label), fallbackKey);
  const kind = allowedKinds.has(item.kind as FieldKind)
    ? (item.kind as FieldKind)
    : "text";

  const field: BusinessField = {
    key,
    label,
    kind,
  };

  const placeholder = cleanString(item.placeholder);

  if (placeholder) {
    field.placeholder = placeholder;
  }

  if (kind === "select") {
    const options = Array.isArray(item.options)
      ? item.options.map((option) => String(option).trim()).filter(Boolean)
      : [];

    field.options = options.length > 0 ? options.slice(0, 12) : ["New"];
  }

  return field;
}

function mergeFields(
  baseFields: BusinessField[],
  rawFields: unknown
): BusinessField[] {
  const fieldsByKey = new Map<string, BusinessField>();

  for (const field of baseFields) {
    fieldsByKey.set(field.key, field);
  }

  if (Array.isArray(rawFields)) {
    rawFields.forEach((rawField, index) => {
      const field = normalizeField(rawField, `field${index + 1}`);

      if (field) {
        fieldsByKey.set(field.key, field);
      }
    });
  }

  return Array.from(fieldsByKey.values()).slice(0, 28);
}

function ensureKey(
  requested: unknown,
  fallback: string,
  fields: BusinessField[]
) {
  const keys = new Set(fields.map((field) => field.key));
  const requestedKey = cleanString(requested);

  if (requestedKey && keys.has(requestedKey)) return requestedKey;
  if (keys.has(fallback)) return fallback;

  return fields[0]?.key || fallback;
}

function normalizeStatuses(rawStatuses: unknown, fallback: string[]) {
  const statuses = Array.isArray(rawStatuses)
    ? rawStatuses.map((status) => String(status).trim()).filter(Boolean)
    : [];

  return statuses.length > 0 ? statuses.slice(0, 10) : fallback;
}

function normalizeClosedStatuses(
  rawClosedStatuses: unknown,
  statuses: string[],
  fallback: string[]
) {
  const statusSet = new Set(statuses);

  const closedStatuses = Array.isArray(rawClosedStatuses)
    ? rawClosedStatuses
        .map((status) => String(status).trim())
        .filter((status) => statusSet.has(status))
    : [];

  return closedStatuses.length > 0 ? closedStatuses : fallback;
}

function normalizeStatsLabels(
  rawStatsLabels: unknown,
  fallback: BusinessAppBlueprint["statsLabels"]
) {
  if (!rawStatsLabels || typeof rawStatsLabels !== "object") {
    return fallback;
  }

  const raw = rawStatsLabels as Partial<BusinessAppBlueprint["statsLabels"]>;

  return {
    active: cleanString(raw.active, fallback.active),
    value: cleanString(raw.value, fallback.value),
    followUp: cleanString(raw.followUp, fallback.followUp),
    closed: cleanString(raw.closed, fallback.closed),
  };
}

function normalizeSamples({
  rawSamples,
  fallbackSamples,
  fields,
  statuses,
}: {
  rawSamples: unknown;
  fallbackSamples: BusinessRecord[];
  fields: BusinessField[];
  statuses: string[];
}) {
  const fieldKeys = fields.map((field) => field.key);
  const statusSet = new Set(statuses);

  if (!Array.isArray(rawSamples)) {
    return fallbackSamples;
  }

  const samples: BusinessRecord[] = [];

  rawSamples.slice(0, 5).forEach((rawSample, index) => {
    if (!rawSample || typeof rawSample !== "object") return;

    const item = rawSample as Partial<BusinessRecord>;
    const rawData =
      item.data && typeof item.data === "object"
        ? (item.data as Record<string, unknown>)
        : {};

    const data: Record<string, string> = {};

    for (const key of fieldKeys) {
      const value = rawData[key];
      data[key] = value === undefined || value === null ? "" : String(value);
    }

    const status = cleanString(item.status);

    samples.push({
      id: cleanString(item.id, `sample-${index + 1}`),
      status: statusSet.has(status) ? status : statuses[0] || "New",
      data,
    });
  });

  return samples.length > 0 ? samples : fallbackSamples;
}

function normalizeStringArray(raw: unknown, fallback: string[], limit = 8) {
  const values = Array.isArray(raw)
    ? raw.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return values.length > 0 ? values.slice(0, limit) : fallback;
}

function normalizeBlueprintCandidate(
  candidate: unknown,
  base: BusinessAppBlueprint
): BusinessAppBlueprint {
  if (!candidate || typeof candidate !== "object") {
    return base;
  }

  const raw = candidate as Partial<BusinessAppBlueprint>;

  const fields = mergeFields(base.fields, raw.fields);
  const statuses = normalizeStatuses(raw.statuses, base.statuses);
  const closedStatuses = normalizeClosedStatuses(
    raw.closedStatuses,
    statuses,
    base.closedStatuses
  );

  const appName = cleanString(raw.appName, base.appName);

  const normalized: BusinessAppBlueprint = {
    appType: cleanString(raw.appType, base.appType),
    appName,
    slug: cleanString(raw.slug, slugify(appName || base.appName)),
    eyebrow: cleanString(raw.eyebrow, base.eyebrow),
    title: cleanString(raw.title, base.title),
    description: cleanString(raw.description, base.description),
    primaryEntity: cleanString(raw.primaryEntity, base.primaryEntity),
    createTitle: cleanString(raw.createTitle, base.createTitle),
    actionLabel: cleanString(raw.actionLabel, base.actionLabel),
    searchPlaceholder: cleanString(
      raw.searchPlaceholder,
      base.searchPlaceholder
    ),
    fields,
    statuses,
    closedStatuses,
    titleFieldKey: ensureKey(raw.titleFieldKey, base.titleFieldKey, fields),
    contactFieldKey: ensureKey(
      raw.contactFieldKey,
      base.contactFieldKey,
      fields
    ),
    valueFieldKey: ensureKey(raw.valueFieldKey, base.valueFieldKey, fields),
    followUpFieldKey: ensureKey(
      raw.followUpFieldKey,
      base.followUpFieldKey,
      fields
    ),
    notesFieldKey: ensureKey(raw.notesFieldKey, base.notesFieldKey, fields),
    subtitleFieldKeys: normalizeStringArray(
      raw.subtitleFieldKeys,
      base.subtitleFieldKeys,
      8
    ).filter((key) => fields.some((field) => field.key === key)),
    statsLabels: normalizeStatsLabels(raw.statsLabels, base.statsLabels),
    samples: normalizeSamples({
      rawSamples: raw.samples,
      fallbackSamples: base.samples,
      fields,
      statuses,
    }),
    nextSteps: normalizeStringArray(raw.nextSteps, base.nextSteps, 10),
  };

  if (normalized.subtitleFieldKeys.length === 0) {
    normalized.subtitleFieldKeys = base.subtitleFieldKeys.filter((key) =>
      fields.some((field) => field.key === key)
    );
  }

  return normalized;
}

export async function enhanceBusinessBlueprint({
  prompt,
  baseBlueprint,
  brain,
}: {
  prompt: string;
  baseBlueprint: BusinessAppBlueprint;
  brain: BrainResult;
}): Promise<EnhancementResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      blueprint: baseBlueprint,
      usedAi: false,
      error: "Missing OPENAI_API_KEY. Used base blueprint.",
    };
  }

  const model = getHeavyModel();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const instructions = `
You are Embr's final business-app blueprint synthesis engine.

You do not write code.
You do not write markdown.
You return valid JSON only.

Your job:
Improve the base blueprint using the classifier, Perplexity research, and Claude critique.

Rules:
- Preserve the user's exact domain.
- Do not collapse a domain-specific app into generic records.
- Do not name a real estate app Budget Tracker because it mentions price or budget.
- Make professional assumptions.
- Add missing fields/modules that make the app feel like a real business system.
- Keep the blueprint renderable by a deterministic Next.js renderer.
- Keep fields practical, not bloated.
- Keep statuses domain-specific.
- Include realistic sample records.
- Use corporate/professional business language.

Return JSON matching this shape exactly:

{
  "appType": "string",
  "appName": "string",
  "slug": "string",
  "eyebrow": "string",
  "title": "string",
  "description": "string",
  "primaryEntity": "string",
  "createTitle": "string",
  "actionLabel": "string",
  "searchPlaceholder": "string",
  "fields": [
    {
      "key": "string",
      "label": "string",
      "kind": "text | number | select | textarea",
      "placeholder": "string",
      "options": ["string"]
    }
  ],
  "statuses": ["string"],
  "closedStatuses": ["string"],
  "titleFieldKey": "string",
  "contactFieldKey": "string",
  "valueFieldKey": "string",
  "followUpFieldKey": "string",
  "notesFieldKey": "string",
  "subtitleFieldKeys": ["string"],
  "statsLabels": {
    "active": "string",
    "value": "string",
    "followUp": "string",
    "closed": "string"
  },
  "samples": [
    {
      "id": "string",
      "status": "string",
      "data": {
        "fieldKey": "string"
      }
    }
  ],
  "nextSteps": ["string"]
}
`;

  const input = `
User prompt:
${prompt}

Base blueprint:
${JSON.stringify(baseBlueprint, null, 2)}

Brain result:
${JSON.stringify(brain, null, 2)}
`;

  const options: any = {
    model,
    instructions,
    input,
    max_output_tokens: 9000,
  };

  if (model.startsWith("gpt-5")) {
    options.reasoning = {
      effort: "high",
    };
  }

  try {
    const response = await openai.responses.create(options);
    const raw = response.output_text || "";
    const parsed = parseJsonOutput(raw);
    const blueprint = normalizeBlueprintCandidate(parsed, baseBlueprint);

    return {
      blueprint,
      usedAi: true,
      raw,
    };
  } catch (error) {
    return {
      blueprint: baseBlueprint,
      usedAi: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown blueprint enhancement error.",
    };
  }
}
