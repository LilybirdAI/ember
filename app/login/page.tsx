"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      alert("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
       const { error } = await supabaseBrowser.auth.signUp({
  email: email.trim(),
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

        if (error) throw error;

        alert("Account created. Check your email if confirmation is required, then log in.");
        setMode("login");
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.push("/");
      }
    } catch (error) {
      console.error("AUTH ERROR:", error);
      alert(error instanceof Error ? error.message : "Auth failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          Embr
        </h1>

        <p className="text-slate-400 mb-6">
          {mode === "login"
            ? "Log in to your Embr Intelligence workspace."
            : "Create your Embr account."}
        </p>

        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
            placeholder="Email"
            type="email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
            placeholder="Password"
            type="password"
          />

          <button
            type="button"
            onClick={handleAuth}
            disabled={loading}
            className="w-full rounded-lg bg-yellow-500 text-black p-3 font-bold disabled:opacity-50"
          >
            {loading ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 text-sm text-yellow-400 hover:text-yellow-300"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}
