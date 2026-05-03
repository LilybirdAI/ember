"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your Embr account...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage(`Confirmation error: ${error.message}`);
            return;
          }
        }

        const { data } = await supabaseBrowser.auth.getSession();

        if (data.session) {
          router.replace("/");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error("AUTH CALLBACK ERROR:", error);
        setMessage("Something went wrong confirming your account.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-3">Embr</h1>
        <p className="text-slate-300">{message}</p>
      </div>
    </main>
  );
}
