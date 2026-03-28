"use client";

import { useState, FormEvent } from "react";
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] ${met ? "text-success" : "text-text-secondary"}`}>
      {met ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
      {label}
    </li>
  );
}

export default function SettingsPage() {
  const [current, setCurrent]     = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  const rules = {
    length: newPw.length >= 8,
    upper:  /[A-Z]/.test(newPw),
    digit:  /[0-9]/.test(newPw),
    match:  newPw === confirm && newPw.length > 0,
  };
  const allRulesMet = Object.values(rules).every(Boolean);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!current) { setError("Please enter your current password."); return; }
    if (!allRulesMet) { setError("Please satisfy all password requirements."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update password."); return; }
      setSuccess(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <PageHeader title="Settings" />

      <div className="enterprise-card p-6">
        <h2 className="font-semibold text-sm text-primary-900 mb-4">Change Password</h2>

        {success && (
          <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/30 rounded-sm px-3 py-2.5 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Password updated successfully.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-sm px-3 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className="enterprise-input pr-10"
                placeholder="••••••••"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="enterprise-input pr-10"
                placeholder="••••••••"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Confirm New Password
            </label>
            <input
              type={showNew ? "text" : "password"}
              className={`enterprise-input ${confirm && !rules.match ? "border-danger" : ""}`}
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* Strength checklist */}
          {newPw.length > 0 && (
            <ul className="bg-primary-50/50 border border-border rounded-sm px-3 py-2.5 space-y-1">
              <PasswordRule met={rules.length} label="At least 8 characters" />
              <PasswordRule met={rules.upper}  label="At least 1 uppercase letter" />
              <PasswordRule met={rules.digit}  label="At least 1 number" />
              <PasswordRule met={rules.match}  label="Passwords match" />
            </ul>
          )}

          <button
            type="submit"
            disabled={loading || !current || !allRulesMet}
            className="w-full flex items-center justify-center gap-2 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-sm transition-colors shadow-sm"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
