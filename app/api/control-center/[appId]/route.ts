import { NextResponse } from "next/server";

type SystemStatus = {
  ok?: boolean;
  service?: string;
  status?: string;
  time?: string;
  uptimeSeconds?: number;
  nodeVersion?: string;
  routeCheckAvailable?: boolean;
  learningAvailable?: boolean;
  error?: string;
};

type UsageApp = {
  appId?: string;
  appName?: string;
  requests?: number;
  productionRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  lastUsedAt?: string | null;
};

type QualityApp = {
  appId?: string;
  appName?: string;
  responses?: number;
  averageQualityScore?: number;
  placeholderRiskCount?: number;
  boundaryRiskCount?: number;
  inventedDataRiskCount?: number;
  lastEvaluatedAt?: string | null;
};

type RegisteredApp = {
  appId?: string;
  appName?: string;
  defaultMode?: string;
  status?: string;
  ownerLabel?: string;
};

type UsageSummary = {
  apps?: UsageApp[];
};

type QualitySummary = {
  apps?: QualityApp[];
};

type RegisteredAppsSummary = {
  apps?: RegisteredApp[];
};

const pendingBusinessData = {
  "mindshot-golf": {
    business: {
      totalUsers: "Pending",
      activeUsers: "Pending",
      trialUsers: "Pending",
      payingUsers: "Pending",
      conversion: "Pending",
      estimatedRevenue: "Pending",
      dataMode: "pending-mindshot-data-source",
    },
  },
};


async function fetchMindShotBusinessSummary() {
  const url = process.env.MINDSHOT_DASHBOARD_URL;
  const key = process.env.MINDSHOT_DASHBOARD_KEY;

  if (!url || !key) {
    return null;
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "x-embr-dashboard-key": key,
    },
  });

  if (!res.ok) {
    console.warn(`MindShot dashboard summary failed with ${res.status}`);
    return null;
  }

  return res.json();
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl =
    process.env.EMBR_API_BASE_URL || "https://api.embrintelligence.ai";

  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ appId: string }> | { appId: string } }
) {
  const { appId } = await context.params;
  const pending = pendingBusinessData[appId as keyof typeof pendingBusinessData];

  if (!pending) {
    return NextResponse.json(
      {
        error: "Dashboard not found",
        receivedAppId: appId,
        availableAppIds: Object.keys(pendingBusinessData),
      },
      { status: 404 }
    );
  }

  try {
    const [system, usageSummary, qualitySummary, registeredApps, mindshotSummary] =
      await Promise.all([
        fetchJson<SystemStatus>("/system/status"),
        fetchJson<UsageSummary>("/app-intelligence/usage/summary"),
        fetchJson<QualitySummary>("/app-intelligence/quality/summary"),
        fetchJson<RegisteredAppsSummary>("/app-intelligence/apps"),
        appId === "mindshot-golf" ? fetchMindShotBusinessSummary() : null,
      ]);

    const usageApp = usageSummary.apps?.find((app) => app.appId === appId);
    const qualityApp = qualitySummary.apps?.find((app) => app.appId === appId);
    const registeredApp = registeredApps.apps?.find((app) => app.appId === appId);

    const isHealthy = Boolean(system.ok);
    const requests = usageApp?.requests ?? 0;
    const qualityScore = qualityApp?.averageQualityScore ?? null;
    const appName = registeredApp?.appName || usageApp?.appName || "MindShot Golf";
    const business = mindshotSummary?.business;
    const businessConnected = Boolean(business);
    const paymentsStatus =
      typeof business?.payments === "string"
        ? business.payments
        : "Data Pending";

    const businessStatusLine = businessConnected
      ? business?.activeUsers === "Pending" ||
        business?.estimatedRevenue === "Pending" ||
        paymentsStatus === "Data Pending"
        ? "MindShot user, trial, paying user, and conversion data are connected. Active users, payments, and estimated revenue are still pending."
        : "MindShot business metrics are connected."
      : "User, trial, paying user, conversion, and revenue metrics still need MindShot data sources connected.";

    const attention = [
      `MindShot Embr usage is connected and reporting ${requests} logged request${requests === 1 ? "" : "s"}.`,
      qualityScore !== null
        ? `MindShot response quality is currently ${qualityScore}/100.`
        : "MindShot quality data is not available yet.",
      businessStatusLine,
    ];

    const connectedBusinessSummary = businessConnected
      ? `Business data is connected with ${business?.totalUsers ?? 0} total users, ${business?.trialUsers ?? 0} trial users, ${business?.payingUsers ?? 0} paying users, and ${business?.conversion ?? "0%"} conversion. Active users, payments, and estimated revenue are still pending.`
      : "Business metrics are pending until MindShot user and subscription data sources are connected.";

    const monthlySummary =
      qualityScore !== null
        ? `MindShot has live Embr system health, registered app data, usage data, and quality data connected. Embr has logged ${requests} request${requests === 1 ? "" : "s"} for MindShot with a current quality score of ${qualityScore}/100. ${connectedBusinessSummary}`
        : `MindShot has live Embr system health and usage data connected. ${connectedBusinessSummary}`;

    return NextResponse.json({
      app: {
        id: appId,
        name: appName,
        status: isHealthy ? "Healthy" : "Needs Attention",
        backend: isHealthy ? "Online" : "Offline",
        payments: paymentsStatus,
        embr: isHealthy ? "Active" : "Needs Attention",
        lastChecked: system.time || new Date().toISOString(),
        dataMode: "live-system-status",
        ownerLabel: registeredApp?.ownerLabel || "George / MindShot",
        appMode: registeredApp?.defaultMode || "coach",
        appEnvironment: registeredApp?.status || "unknown",
      },
      system,
      business: mindshotSummary?.business
        ? {
            ...mindshotSummary.business,
            dataMode: "live-mindshot-supabase-partial",
          }
        : pending.business,
      embr: {
        interactions: requests,
        productionRequests: usageApp?.productionRequests ?? 0,
        testRequests: usageApp?.testRequests ?? 0,
        totalTokens: usageApp?.totalTokens ?? 0,
        topQuestion: "Live question summaries coming soon.",
        escalations: 0,
        aiUsage: requests > 0 ? "Active" : "No recent usage",
        qualityScore,
        placeholderRiskCount: qualityApp?.placeholderRiskCount ?? 0,
        boundaryRiskCount: qualityApp?.boundaryRiskCount ?? 0,
        inventedDataRiskCount: qualityApp?.inventedDataRiskCount ?? 0,
        lastUsedAt: usageApp?.lastUsedAt || null,
        lastEvaluatedAt: qualityApp?.lastEvaluatedAt || null,
        dataMode: "live-embr-usage-and-quality",
      },
      attention,
      monthlySummary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Control Center data unavailable",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
