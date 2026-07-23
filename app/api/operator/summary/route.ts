import { NextResponse } from "next/server";

type RegisteredApp = {
  appId?: string;
  appName?: string;
  defaultMode?: string;
  status?: string;
  ownerLabel?: string;
  requests?: number;
  productionRequests?: number;
  stagingRequests?: number;
  testRequests?: number;
  totalTokens?: number;
  lastUsedAt?: string | null;
  qualityScore?: number | null;
  qualityResponses?: number;
  riskFlags?: number;
};

type UsageApp = {
  appId?: string;
  appName?: string;
  requests?: number;
  productionRequests?: number;
  stagingRequests?: number;
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

type AppsSummary = {
  apps?: RegisteredApp[];
};

type UsageSummary = {
  apps?: UsageApp[];
};

type QualitySummary = {
  apps?: QualityApp[];
};

const PORTFOLIO_APPS = [
  {
    appId: "mindshot-golf",
    appName: "MindShot Golf",
    ownerLabel: "George / MindShot",
    defaultMode: "coach",
    defaultStatus: "test",
  },
  {
    appId: "bagfree",
    appName: "BagFree",
    ownerLabel: "Larry / BagFree",
    defaultMode: "assistant",
    defaultStatus: "production",
  },
  {
    appId: "fuel-the-flame",
    appName: "Fuel the Flame",
    ownerLabel: "Fuel the Flame",
    defaultMode: "motivator",
    defaultStatus: "test",
  },
  {
    appId: "sober-house-command-center",
    appName: "Sober House Command Center",
    ownerLabel: "Matt / Embr",
    defaultMode: "assistant",
    defaultStatus: "test",
  },
] as const;

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

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET() {
  try {
    const [system, rawApps, rawUsage, rawQuality] = await Promise.all([
      fetchJson<Record<string, unknown>>("/system/status"),
      fetchJson<AppsSummary>("/app-intelligence/apps"),
      fetchJson<UsageSummary>("/app-intelligence/usage/summary"),
      fetchJson<QualitySummary>("/app-intelligence/quality/summary"),
    ]);

    const registeredById = new Map(
      (rawApps.apps || [])
        .filter((app) => app.appId)
        .map((app) => [String(app.appId), app])
    );

    const usageById = new Map(
      (rawUsage.apps || [])
        .filter((app) => app.appId)
        .map((app) => [String(app.appId), app])
    );

    const qualityById = new Map(
      (rawQuality.apps || [])
        .filter((app) => app.appId)
        .map((app) => [String(app.appId), app])
    );

    const portfolioApps: RegisteredApp[] = PORTFOLIO_APPS.map((portfolio) => {
      const registered = registeredById.get(portfolio.appId);
      const usage = usageById.get(portfolio.appId);
      const quality = qualityById.get(portfolio.appId);

      const placeholderRisks = numberValue(quality?.placeholderRiskCount);
      const boundaryRisks = numberValue(quality?.boundaryRiskCount);
      const inventedDataRisks = numberValue(quality?.inventedDataRiskCount);

      return {
        appId: portfolio.appId,
        appName: portfolio.appName,
        ownerLabel: portfolio.ownerLabel,
        defaultMode: portfolio.defaultMode,
        status: registered?.status || portfolio.defaultStatus,
        requests: numberValue(usage?.requests ?? registered?.requests),
        productionRequests: numberValue(usage?.productionRequests),
        stagingRequests: numberValue(usage?.stagingRequests),
        testRequests: numberValue(usage?.testRequests),
        totalTokens: numberValue(usage?.totalTokens ?? registered?.totalTokens),
        lastUsedAt:
          usage?.lastUsedAt ||
          registered?.lastUsedAt ||
          quality?.lastEvaluatedAt ||
          null,
        qualityScore:
          typeof quality?.averageQualityScore === "number"
            ? quality.averageQualityScore
            : null,
        qualityResponses: numberValue(quality?.responses),
        riskFlags:
          placeholderRisks + boundaryRisks + inventedDataRisks,
      };
    });

    const usageApps: UsageApp[] = portfolioApps.map((app) => ({
      appId: app.appId,
      appName: app.appName,
      requests: app.requests,
      productionRequests: app.productionRequests,
      stagingRequests: app.stagingRequests,
      testRequests: app.testRequests,
      totalTokens: app.totalTokens,
      lastUsedAt: app.lastUsedAt,
    }));

    const qualityApps: QualityApp[] = PORTFOLIO_APPS.map((portfolio) => {
      const quality = qualityById.get(portfolio.appId);

      return {
        appId: portfolio.appId,
        appName: portfolio.appName,
        responses: numberValue(quality?.responses),
        averageQualityScore:
          typeof quality?.averageQualityScore === "number"
            ? quality.averageQualityScore
            : undefined,
        placeholderRiskCount: numberValue(quality?.placeholderRiskCount),
        boundaryRiskCount: numberValue(quality?.boundaryRiskCount),
        inventedDataRiskCount: numberValue(quality?.inventedDataRiskCount),
        lastEvaluatedAt: quality?.lastEvaluatedAt || null,
      };
    });

    const totalRequests = usageApps.reduce(
      (sum, app) => sum + numberValue(app.requests),
      0
    );

    const productionRequests = usageApps.reduce(
      (sum, app) => sum + numberValue(app.productionRequests),
      0
    );

    const stagingRequests = usageApps.reduce(
      (sum, app) => sum + numberValue(app.stagingRequests),
      0
    );

    const testRequests = usageApps.reduce(
      (sum, app) => sum + numberValue(app.testRequests),
      0
    );

    const totalTokens = usageApps.reduce(
      (sum, app) => sum + numberValue(app.totalTokens),
      0
    );

    const totalResponses = qualityApps.reduce(
      (sum, app) => sum + numberValue(app.responses),
      0
    );

    const weightedQualityTotal = qualityApps.reduce((sum, app) => {
      const responses = numberValue(app.responses);
      const score = numberValue(app.averageQualityScore);

      return sum + responses * score;
    }, 0);

    const averageQualityScore =
      totalResponses > 0
        ? Math.round(weightedQualityTotal / totalResponses)
        : null;

    const placeholderRiskCount = qualityApps.reduce(
      (sum, app) => sum + numberValue(app.placeholderRiskCount),
      0
    );

    const boundaryRiskCount = qualityApps.reduce(
      (sum, app) => sum + numberValue(app.boundaryRiskCount),
      0
    );

    const inventedDataRiskCount = qualityApps.reduce(
      (sum, app) => sum + numberValue(app.inventedDataRiskCount),
      0
    );

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scope: {
        mode: "approved-real-apps-only",
        appIds: PORTFOLIO_APPS.map((app) => app.appId),
        excludedRecordsPreserved: true,
      },
      system,
      apps: {
        appCount: PORTFOLIO_APPS.length,
        registeredAppCount: PORTFOLIO_APPS.length,
        activeAppCount: portfolioApps.filter(
          (app) => numberValue(app.requests) > 0
        ).length,
        totalRequests,
        totalTokens,
        apps: portfolioApps,
      },
      usage: {
        totalRequests,
        productionRequests,
        stagingRequests,
        testRequests,
        totalTokens,
        appCount: PORTFOLIO_APPS.length,
        apps: usageApps,
      },
      quality: {
        totalResponses,
        averageQualityScore,
        placeholderRiskCount,
        boundaryRiskCount,
        inventedDataRiskCount,
        appCount: PORTFOLIO_APPS.length,
        apps: qualityApps,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Operator summary unavailable",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
