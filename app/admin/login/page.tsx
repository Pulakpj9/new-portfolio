"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* Forced-light login in the portfolio's light language: steel-slate washed
   backdrop (About Slate) + Bold Ink card (Contact Ink) + mono labels. */

const PAGE_BG =
  "radial-gradient(circle at 50% -10%, rgba(100,116,139,0.16), transparent 50%), radial-gradient(circle at 90% 10%, rgba(148,163,184,0.12), transparent 40%), linear-gradient(180deg, #ffffff 0%, hsl(0 0% 93%) 100%)";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sb = createClient();
      const { error: signInError } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Wrong email or password."
            : signInError.message,
        );
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ backgroundImage: PAGE_BG, backgroundColor: "#ffffff" }}
    >
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.5)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl">
            🤖
          </span>
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Pulak Mini · Admin
            </p>
            <h1 className="text-lg font-semibold text-white">
              Portfolio analytics
            </h1>
          </div>
        </div>
        <p className="mt-3 font-mono text-xs text-slate-400">
          Restricted area — sign in to continue.
        </p>

        <label className="mt-6 block font-mono text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white outline-none transition-colors placeholder:text-slate-500 focus:border-white/40"
            placeholder="you@example.com"
          />
        </label>

        <label className="mt-4 block font-mono text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 font-sans text-sm normal-case tracking-normal text-white outline-none transition-colors placeholder:text-slate-500 focus:border-white/40"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 font-mono text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 h-11 w-full rounded-xl bg-white font-mono text-sm font-semibold text-slate-900 transition-all hover:bg-slate-200 hover:shadow-lg hover:shadow-white/10 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in →"}
        </button>

        <p className="mt-4 text-center font-mono text-[11px] text-slate-500">
          Accounts are created in Supabase → Authentication → Users.
        </p>
      </form>
    </div>
  );
}
