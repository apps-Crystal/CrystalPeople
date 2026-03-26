"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, BarChart3, Target, CheckCircle, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/components/auth/AuthProvider";

const FEATURES = [
  { icon: Calendar, title: "Weekly Reflections", description: "Every Friday, spend 5 minutes sharing what you accomplished, what you're working on next, and how you're feeling." },
  { icon: Target, title: "Goals & Tasks", description: "Your manager will set your goals (white-collar) or task scorecard (blue-collar) before your first review cycle." },
  { icon: BarChart3, title: "Monthly Reviews", description: "Self-score on the 1st of each month. Your manager scores independently. Final score = simple average, no weighting." },
  { icon: CheckCircle, title: "Annual Increments", description: "Your 12 monthly scores average into your annual performance band, which determines your salary increment." },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user, refresh } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  async function handleGetStarted() {
    setLoading(true);
    try {
      await fetch("/api/auth/first-login", { method: "POST" });
      await refresh();
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="enterprise-card enterprise-shadow overflow-hidden">
          {/* Header bar */}
          <div className="bg-primary-900 px-6 pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-sm bg-accent-500">
                <span className="text-primary-900 font-black text-xs">CP</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Crystal People</h1>
                <p className="text-[11px] text-primary-300">Performance Management Platform</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome, {user?.name?.split(" ")[0] ?? "there"}!
            </h2>
            <p className="text-sm text-primary-300">
              Here&apos;s a quick overview of how Crystal People works before you get started.
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-xs text-text-secondary mb-5">
              Crystal People replaces informal performance conversations with a structured, transparent system — the same for everyone, from operations to the executive team.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {FEATURES.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-sm border border-border p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-sm bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className="text-primary-600" />
                      </div>
                      <h3 className="text-xs font-semibold text-text-primary">{f.title}</h3>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-sm bg-warning/10 border border-warning/30 px-3.5 py-2.5 text-xs text-warning mb-5">
              <strong>What happens next:</strong> Your manager will set up your goals or task scorecard before the first review cycle opens. You&apos;ll get a notification when everything is ready.
            </div>

            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-4 rounded-sm transition-colors shadow-sm"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Getting started…</> : "Get Started →"}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-primary-400 mt-4">
          Crystal Group — Confidential. For internal use only.
        </p>
      </div>
    </div>
  );
}
