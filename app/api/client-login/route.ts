import { NextResponse } from "next/server";
import {
  getAccountByUsername,
  getAccountPassword,
  getAccountToken,
  getPublicAccount,
} from "@/lib/embrClientAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const username = String(body?.username || "");
  const password = String(body?.password || "");

  const account = getAccountByUsername(username);

  if (!account) {
    return NextResponse.json({ ok: false, error: "Invalid login." }, { status: 401 });
  }

  const expectedPassword = getAccountPassword(account);
  const sessionToken = getAccountToken(account);

  if (!expectedPassword || !sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Client login is not configured." },
      { status: 500 }
    );
  }

  if (password !== expectedPassword) {
    return NextResponse.json({ ok: false, error: "Invalid login." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    account: getPublicAccount(account),
    landingPath: account.landingPath,
  });

  response.cookies.set("embr_client_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
