"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function EmbrClientShellActions() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const shouldShow =
    pathname.startsWith("/control-center") || pathname.startsWith("/operator");

  if (!shouldShow) {
    return null;
  }

  async function signOut() {
    setSigningOut(true);

    try {
      await fetch("/api/client-logout", {
        method: "POST",
      });
    } finally {
      router.replace("/client-login");
      router.refresh();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <Link
        href="/client"
        className="rounded-full border border-white/15 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur hover:bg-slate-900"
      >
        Client Home
      </Link>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="rounded-full border border-red-300/20 bg-red-500/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur hover:bg-red-400 disabled:opacity-60"
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
