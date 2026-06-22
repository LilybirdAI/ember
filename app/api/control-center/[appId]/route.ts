import { NextResponse } from "next/server";

const demoBusinessData = {
  "mindshot-golf": {
    appName: "MindShot Golf",
    business: {
      totalUsers: 124,
      activeUsers: 48,
      trialUsers: 12,
      payingUsers: 9,
      conversion: "18%",
      estimatedRevenue: "$250/mo",
      dataMode: "demo",
    },
    embr: {
      interactions: 86,
      topQuestion: "How do I get more value from my journal?",
      escalations: 0,
      aiUsage: "Normal",
      dataMode: "demo",
    },
    attention: [
      "Users are asking how to get more value from journaling.",
      "Premium value may need clearer explanation.",
      "No urgent app health issues detected.",
    ],
    monthlySummary:
      "MindShot is healthy. Embr backend health is live. User, revenue, and insight metrics are currently demo placeholders until MindShot data sources are connected.",
  },
};

async function getSystemStatus() {
  try {
    const baseUrl =
      process.env.EMBR_API_BASE_URL || "https://api.embrintelligence.ai";

    const res = await fetch(`${baseUrl}/system/status`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        ok: false,
        service: "embr-server",
        status: "offline",
        error: `System status failed with ${res.status}`,
      };
    }

    return await res.json();
  } catch (error) {
    return {
      ok: false,
      service: "embr-server",
      status: "offline",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ appId: string }> }
) {
  const { appId } = await context.params;

  const demo = demoBusinessData[appId as keyof typeof demoBusinessData];

  if (!demo) {
    return NextResponse.json(
      {
        error: "Dashboard not found",
        receivedAppId: appId,
        availableAppIds: Object.keys(demoBusinessData),
      },
      { status: 404 }
    );
  }

  const system = await getSystemStatus();
  const isHealthy = Boolean(system.ok);

  return NextResponse.json({
    app: {
      id: appId,
      name: demo.appName,
      status: isHealthy ? "Healthy" : "Needs Attention",
      backend: isHealthy ? "Online" : "Offline",
      payments: "Connected",
      embr: isHealthy ? "Active" : "Needs Attention",
      lastChecked: system.time || new Date().toISOString(),
      dataMode: "live-system-status",
    },
    system,
    business: demo.business,
    embr: demo.embr,
    attention: isHealthy
      ? demo.attention
      : [
          "Embr backend needs attention.",
          system.error || "System status check failed.",
          "User and revenue metrics are still demo placeholders.",
        ],
    monthlySummary: demo.monthlySummary,
  });
}
