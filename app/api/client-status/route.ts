import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAccountByToken,
  getVisibleApps,
} from "@/lib/embrClientAccess";

export const dynamic = "force-dynamic";

type ControlCenterPayload = {
  payments?: string;
  lastChecked?: string;
  appDetails?: {
    lastChecked?: string;
  };
  business?: {
    totalUsers?: number | string;
    trialUsers?: number | string;
    payingUsers?: number | string;
    conversion?: string;
    estimatedRevenue?: string;
    dataMode?: string;
  };
};

function isFresh(timestamp?: string | null) {
  if (!timestamp) return false;

  const parsed = new Date(timestamp).getTime();

  if (Number.isNaN(parsed)) return false;

  const ageMs = Date.now() - parsed;
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return ageMs <= twentyFourHours;
}


async function summarizeBagFreeStatus(app: { appId: string; name: string; path: string }) {
  const url = process.env.BAGFREE_STATUS_URL || "https://bagfree.app/api/embr-status";
  const key = process.env.BAGFREE_STATUS_KEY;

  if (!key) {
    return {
      appId: app.appId,
      name: app.name,
      path: app.path,
      statusLabel: "Setup Needed",
      statusTone: "yellow",
      dataFreshness: "Not Connected",
      lastChecked: new Date().toISOString(),
      liveSources: [],
      pendingSources: ["BagFree status key"],
      message: "BagFree status feed is not configured in Embr yet.",
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "x-embr-status-key": key,
      },
    });

    if (!response.ok) {
      return {
        appId: app.appId,
        name: app.name,
        path: app.path,
        statusLabel: "Error",
        statusTone: "red",
        dataFreshness: "Error",
        lastChecked: new Date().toISOString(),
        liveSources: [],
        pendingSources: ["BagFree status feed"],
        message: `BagFree status feed returned ${response.status}.`,
      };
    }

    const data = await response.json();

    const lastChecked = data.generatedAt || new Date().toISOString();
    const fresh = isFresh(lastChecked);
    const connections = data.connections || {};

    const liveSources = [
      connections.site === "live" ? "BagFree site" : null,
      connections.netlifyFunctions === "live" ? "Netlify Functions" : null,
      data.intelligence?.travelBrainConnected ? "Travel Brain" : null,
      data.intelligence?.embrConnected ? "Embr API" : null,
      connections.stripe === "configured" ? "Stripe configured" : null,
    ].filter(Boolean);

    const pendingSources =
      Array.isArray(data.needsSetup) && data.needsSetup.length
        ? data.needsSetup
        : ["Users", "Payments", "Revenue", "Active-user tracking"];

    return {
      appId: app.appId,
      name: app.name,
      path: app.path,
      statusLabel: "Partial Live",
      statusTone: "yellow",
      dataFreshness: fresh ? "Current" : "Stale",
      lastChecked,
      liveSources,
      pendingSources,
      message:
        "BagFree is connected through Embr Travel Brain and has an operational status feed. Business reporting still needs final data sources.",
    };
  } catch {
    return {
      appId: app.appId,
      name: app.name,
      path: app.path,
      statusLabel: "Error",
      statusTone: "red",
      dataFreshness: "Error",
      lastChecked: new Date().toISOString(),
      liveSources: [],
      pendingSources: ["BagFree status feed"],
      message: "Could not reach the BagFree operational status feed.",
    };
  }
}


function summarizeLiveApp(app: { appId: string; name: string; path: string }, data: ControlCenterPayload) {
  const business = data.business || {};
  const payments = String(data.payments || "").toLowerCase();
  const dataMode = String(business.dataMode || "").toLowerCase();

  const hasUserCounts =
    typeof business.totalUsers === "number" ||
    typeof business.trialUsers === "number" ||
    typeof business.payingUsers === "number" ||
    dataMode.includes("live");

  const paymentsConnected =
    payments &&
    !payments.includes("pending") &&
    !payments.includes("not connected") &&
    !payments.includes("data pending");

  const lastChecked =
    data.appDetails?.lastChecked ||
    data.lastChecked ||
    new Date().toISOString();

  const fresh = isFresh(lastChecked);

  const liveSources = ["Embr health", "Embr usage", "Quality score"];

  if (hasUserCounts) {
    liveSources.push("User counts");
  }

  const pendingSources: string[] = [];

  if (!paymentsConnected) {
    pendingSources.push("Payments");
    pendingSources.push("Revenue");
  }

  pendingSources.push("Active-user tracking");

  return {
    appId: app.appId,
    name: app.name,
    path: app.path,
    statusLabel: paymentsConnected ? "Live" : "Partial Live",
    statusTone: paymentsConnected ? "green" : "yellow",
    dataFreshness: fresh ? "Current" : "Stale",
    lastChecked,
    liveSources,
    pendingSources,
    message: paymentsConnected
      ? "Operational data is connected and current."
      : "Core Embr data is live. Business reporting is partially connected.",
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("embr_client_session")?.value;
  const account = getAccountByToken(token);

  if (!account) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const apps = getVisibleApps(account);
  const cookieHeader = `embr_client_session=${token}`;
  const internalBase = process.env.EMBR_INTERNAL_APP_URL || "http://127.0.0.1:3000";

  const statuses = await Promise.all(
    apps.map(async (app) => {
      if (app.appId === "bagfree") {
        return summarizeBagFreeStatus(app);
      }

      if (app.status !== "live") {
        return {
          appId: app.appId,
          name: app.name,
          path: app.path,
          statusLabel: "Coming Soon",
          statusTone: "gray",
          dataFreshness: "Not Connected",
          lastChecked: null,
          liveSources: [],
          pendingSources: ["Embr connection", "Usage", "Quality", "Users", "Payments"],
          message: "This Command Center is reserved and will activate when the app is connected to Embr.",
        };
      }

      try {
        const response = await fetch(`${internalBase}/api/control-center/${app.appId}`, {
          cache: "no-store",
          headers: {
            cookie: cookieHeader,
          },
        });

        if (!response.ok) {
          return {
            appId: app.appId,
            name: app.name,
            path: app.path,
            statusLabel: "Error",
            statusTone: "red",
            dataFreshness: "Error",
            lastChecked: new Date().toISOString(),
            liveSources: [],
            pendingSources: ["Control Center API"],
            message: `Could not load operational data. API returned ${response.status}.`,
          };
        }

        const data = (await response.json()) as ControlCenterPayload;

        return summarizeLiveApp(app, data);
      } catch {
        return {
          appId: app.appId,
          name: app.name,
          path: app.path,
          statusLabel: "Error",
          statusTone: "red",
          dataFreshness: "Error",
          lastChecked: new Date().toISOString(),
          liveSources: [],
          pendingSources: ["Control Center API"],
          message: "Could not load operational data.",
        };
      }
    })
  );

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    account: {
      username: account.username,
      role: account.role,
    },
    statuses,
  });
}
