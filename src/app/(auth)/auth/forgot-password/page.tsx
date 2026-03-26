"use client";

import { useState, FormEvent } from "react";
import { Loader2, AlertTriangle, ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [devLink, setDevLink] = useState("");
  const [error, setError]     = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSent(true);
      if (data.dev_reset_link) setDevLink(data.dev_reset_link);
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
          <p className="text-base font-semibold text-white">Password Recovery</p>
          <p className="text-xs text-primary-300 mt-0.5">We&apos;ll send a secure reset link to your email.</p>
        </div>

        <div className="px-8 py-6">
          {sent ? (
            /* ── Success state ── */
            <div className="space-y-4 text-center">
              <MailCheck className="w-12 h-12 text-success mx-auto" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Reset link sent</p>
                <p className="text-xs text-text-secondary mt-1">
                  If <span className="font-mono text-primary-700">{email}</span> exists in our system,
                  a reset link valid for <strong>1 hour</strong> has been sent.
                </p>
              </div>

              {/* Dev mode: show link directly */}
              {devLink && (
                <div className="bg-warning/10 border border-warning/30 rounded-sm p-3 text-left">
                  <p className="text-[10px] font-bold text-warning uppercase tracking-wide mb-1">
                    Dev mode — reset link:
                  </p>
                  <a
                    href={devLink}
                    className="text-xs font-mono text-primary-700 break-all hover:underline"
                  >
                    {devLink}
                  </a>
                </div>
              )}

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:underline"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-sm px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  className="enterprise-input"
                  placeholder="you@crystalgroup.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-sm transition-colors shadow-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send Reset Link"}
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
