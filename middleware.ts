import { NextRequest, NextResponse } from "next/server";
import { accountCanAccessApp, getAccountByToken } from "@/lib/embrClientAccess";

function getRequestedAppId(pathname: string) {
  const pageMatch = pathname.match(/^\/control-center\/([^/]+)/);
  if (pageMatch?.[1]) return pageMatch[1];

  const apiMatch = pathname.match(/^\/api\/control-center\/([^/]+)/);
  if (apiMatch?.[1]) return apiMatch[1];

  return null;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/client-login", request.url);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApi = pathname.startsWith("/api/");
  const isClientArea =
    pathname === "/client" ||
    pathname.startsWith("/client/") ||
    pathname === "/api/client-status";
  const isControlCenter =
    pathname === "/control-center" ||
    pathname.startsWith("/control-center/") ||
    pathname.startsWith("/api/control-center/");
  const isOperator =
    pathname === "/operator" ||
    pathname.startsWith("/operator/") ||
    pathname.startsWith("/api/operator/");

  const protectedRoute = isClientArea || isControlCenter || isOperator;

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("embr_client_session")?.value;
  const account = getAccountByToken(token);

  if (!account) {
    if (isApi) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  if (isOperator && account.role !== "admin") {
    if (isApi) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.redirect(new URL(account.landingPath || "/client", request.url));
  }

  const appId = getRequestedAppId(pathname);

  if (appId && !accountCanAccessApp(account, appId)) {
    if (isApi) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/client", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client/:path*",
    "/control-center/:path*",
    "/api/control-center/:path*",
    "/api/client-status",
    "/operator/:path*",
    "/api/operator/:path*",
  ],
};
