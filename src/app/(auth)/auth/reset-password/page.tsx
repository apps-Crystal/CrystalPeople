"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, Eye, EyeOff, CheckCircle2, ArrowLeft, X, Check } from "lucide-react";
import Link from "next/link";

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] ${met ? "text-success" : "text-text-secondary"}`}>
      {met ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
      {label}
    </li>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-96 enterprise-card animate-pulse" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const rules = {
    length: password.length >= 8,
    upper:  /[A-Z]/.test(password),
    digit:  /[0-9]/.test(password),
    match:  password === confirm && password.length > 0,
  };
  const allRulesMet = Object.values(rules).every(Boolean);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) { setError("Missing reset token. Please use the link from your email."); return; }
    if (!allRulesMet) { setError("Please satisfy all password requirements."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Reset failed."); return; }
      setSuccess(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="enterprise-card enterprise-shadow overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 bg-primary-900">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-sm bg-accent-500">
              <span className="text-primary-900 font-black text-xs">CP</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Crystal People</h1>
              <p className="text-[11px] text-primary-300">Performance Management Platform</p>
            </div>
          </div>
          <p className="text-base font-semibold text-white">Set New Password</p>
          <p className="text-xs text-primary-300 mt-0.5">Choose a strong password for your account.</p>
        </div>

        <div className="px-8 py-6">
          {/* No token in URL */}
          {!token ? (
            <div className="text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-danger mx-auto" />
              <p className="text-sm text-danger font-medium">Invalid reset link.</p>
              <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
                Request a new link
              </Link>
            </div>

          /* Success state */
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Password updated</p>
                <p className="text-xs text-text-secondary mt-1">You can now sign in with your new password.</p>
              </div>
              <Link
                href="/auth/login"
                className="flex items-center justify-center w-full h-9 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-sm transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </div>

          /* Form */
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-sm px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className="enterprise-input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  className={`enterprise-input ${confirm && !rules.match ? "border-danger" : ""}`}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password rules checklist */}
              {password.length > 0 && (
                <ul className="bg-primary-50/50 border border-border rounded-sm px-3 py-2.5 space-y-1">
                  <PasswordRule met={rules.length} label="At least 8 characters" />
                  <PasswordRule met={rules.upper}  label="At least 1 uppercase letter" />
                  <PasswordRule met={rules.digit}  label="At least 1 number" />
                  <PasswordRule met={rules.match}  label="Passwords match" />
                </ul>
              )}

              <button
                type="submit"
                disabled={loading || !allRulesMet}
                className="w-full flex items-center justify-center gap-2 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-sm transition-colors shadow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update Password"}
              </button>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-primary-300 mt-4">
        Crystal Group — Confidential. For internal use only.
      </p>
    </div>
  );
}
