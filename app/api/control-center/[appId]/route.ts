import { NextResponse } from "next/server";

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

async function fetchJson(path: string) {
  const baseUrl =
    process.env.EMBR_API_BASE_URL || "https://api.embrintelligence.ai";

  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}`);
  }

  return res.json();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ appId: string }> }
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
    const [system, usageSummary, qualitySummary, registeredApps] =
      await Promise.all([
        fetchJson("/system/status"),
        fetchJson("/app-intelligence/usage/summary"),
        fetchJson("/app-intelligence/quality/summary"),
        fetchJson("/app-intelligence/apps"),
      ]);

    const usageApp = usageSummary.apps?.find(
      (app: { appId?: string }) => app.appId === appId
    );

    const qualityApp = qualitySummary.apps?.find(
      (app: { appId?: string }) => app.appId === appId
    );

    const registeredApp = registeredApps.apps?.find(
      (app: { appId?: string }) => app.appId === appId
    );

    const isHealthy = Boolean(system.ok);
    const requests = usageApp?.requests ?? 0;
    const qualityScore = qualityApp?.averageQualityScore ?? null;
    const appName = registeredApp?.appName || usageApp?.appName || "MindShot Golf";

    const attention = [
      `MindShot Embr usage is connected and reporting ${requests} logged request${requests === 1 ? "" : "s"}.`,
      qualityScore !== null
        ? `MindShot response quality is currently ${qualityScore}/100.`
        : "MindShot quality data is not available yet.",
      "User, trial, paying user, conversion, and revenue metrics still need MindShot data sources connected.",
    ];

    const monthlySummary =
      qualityScore !== null
        ? `MindShot has live Embr system health, registered app data, usage data, and quality data connected. Embr has logged ${requests} request${requests === 1 ? "" : "s"} for MindShot with a current quality score of ${qualityScore}/100. Business metrics are pending until MindShot user and subscription data sources are connected.`
        : `MindShot has live Embr system health and usage data connected. Business metrics are pending until MindShot user and subscription data sources are connected.`;

    return NextResponse.json({
      app: {
        id: appId,
        name: appName,
        status: isHealthy ? "Healthy" : "Needs Attention",
        backend: isHealthy ? "Online" : "Offline",
        payments: "Data Pending",
        embr: isHealthy ? "Active" : "Needs Attention",
        lastChecked: system.time || new Date().toISOString(),
        dataMode: "live-system-status",
        ownerLabel: registeredApp?.ownerLabel || "George / MindShot",
        appMode: registeredApp?.defaultMode || "coach",
        appEnvironment: registeredApp?.status || "unknown",
      },
      system,
      business: pending.business,
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
