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
