import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAccountByToken, getPublicAccount } from "@/lib/embrClientAccess";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("embr_client_session")?.value;
  const account = getAccountByToken(token);

  if (!account) {
    return NextResponse.json({ ok: false, account: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    account: getPublicAccount(account),
  });
}
