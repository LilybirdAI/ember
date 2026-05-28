import { NextRequest, NextResponse } from "next/server";

const PUBLIC_EMBR_HOSTS = new Set([
  "embrintelligence.ai",
  "www.embrintelligence.ai",
  "embrintelligence.com",
  "www.embrintelligence.com",
]);

export function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] || "";
  const pathname = req.nextUrl.pathname;

  if (!PUBLIC_EMBR_HOSTS.has(host)) {
    return NextResponse.next();
  }

  // Public Embr Intelligence domains should show the marketing site,
  // not the internal workspace/login app.
  if (pathname === "/" || pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/embr-intelligence";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
