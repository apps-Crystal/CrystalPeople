"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      const dest = data.firstLoginDone === false ? "/welcome" : (from.startsWith("/") ? from : "/dashboard");
      window.location.href = dest;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="enterprise-card enterprise-shadow p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-sm bg-accent-500">
            <span className="text-primary-900 font-black text-xs">CP</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary leading-tight">Crystal People</h1>
            <p className="text-[11px] text-text-secondary">Performance Management Platform</p>
          </div>
        </div>

        <h2 className="text-base font-semibold text-text-primary mb-0.5">Sign in</h2>
        <p className="text-xs text-text-secondary mb-5">Use your Crystal Group account credentials</p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="enterprise-input"
              placeholder="you@crystalgroup.com"
              required autoComplete="email" autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Password</label>
              <Link href="/auth/forgot-password" className="text-[11px] text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="enterprise-input pr-9"
                placeholder="••••••••"
                required autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-sm bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-sm transition-colors shadow-sm h-9"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>
      </div>
      <p className="text-center text-[11px] text-primary-300 mt-4">
        Crystal Group — Confidential. For internal use only.
      </p>
    </div>
  );
}

