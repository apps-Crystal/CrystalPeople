"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { RatingBadge } from "@/components/ui/RatingBadge";

export interface EmployeeDashboardData {
  role: string;
  reviewStatus: {
    month: string;
    status: string | null;
    selfScore: number | null;
    managerScore: number | null;
    average: number | null;
    ratingBand: string | null;
  } | null;
  myAssignments: {
    active: number;
    completed: number;
    total: number;
    recentActive: { assignmentId: string; title: string; target: string; type: string }[];
  };
  weeklyReflection: {
    thisWeekSubmitted: boolean;
    lastSubmittedAt: string | null;
  };
  pastReviews: {
    month: string;
    selfScore: number | null;
    managerScore: number | null;
    average: number | null;
    ratingBand: string | null;
  }[];
  openGrievances: number;
}

function statusToBadgeVariant(
  status: string | null
): "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked" | "default" {
  if (!status) return "pending";
  const map: Record<string, "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked" | "default"> = {
    pending: "pending",
    self_scored: "self_scored",
    manager_scored: "manager_scored",
    acknowledged: "acknowledged",
    locked: "locked",
  };
  return map[status] ?? "default";
}

function ratingBandColor(band: string | null): string {
  if (!band) return "text-text-secondary";
  if (band === "Outstanding") return "text-green-600";
  if (band === "Exceeds Expectation") return "text-teal-600";
  if (band === "Meets Expectation") return "text-blue-600";
  if (band === "Below Expectation") return "text-orange-600";
  return "text-red-600";
}

export function EmployeeDashboard({ data }: { data: EmployeeDashboardData }) {
  const { reviewStatus, myAssignments, weeklyReflection, pastReviews, openGrievances } = data;

  function getReviewCTA() {
    const status = reviewStatus?.status;
    if (!status) {
      return (
        <Link
          href="/monthly/self-score"
          className="inline-flex items-center text-xs font-medium text-primary-600 hover:underline"
        >
          Score Yourself →
        </Link>
      );
    }
    if (status === "self_scored") {
      return (
        <span className="text-xs text-text-secondary">Waiting for manager review</span>
      );
    }
    if (status === "manager_scored") {
      return (
        <Link
          href="/monthly/self-score"
          className="inline-flex items-center text-xs font-medium text-accent-600 hover:underline"
        >
          View &amp; Acknowledge →
        </Link>
      );
    }
    return (
      <Link
        href="/monthly/self-score"
        className="inline-flex items-center text-xs font-medium text-primary-600 hover:underline"
      >
        View Review →
      </Link>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My Dashboard" />

      {/* Section 1: Monthly Review */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-primary-900">
            My Monthly Review — {reviewStatus?.month ?? "—"}
          </h2>
          <Badge variant={statusToBadgeVariant(reviewStatus?.status ?? null)} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-sm bg-primary-50 p-3 text-center">
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">Self Score</p>
            {reviewStatus?.selfScore != null ? (
              <RatingBadge score={reviewStatus.selfScore} size="lg" />
            ) : (
              <p className="text-xl font-bold text-text-secondary">—</p>
            )}
          </div>
          <div className="rounded-sm bg-primary-50 p-3 text-center">
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">Manager Score</p>
            {reviewStatus?.managerScore != null ? (
              <RatingBadge score={reviewStatus.managerScore} size="lg" />
            ) : (
              <p className="text-xl font-bold text-text-secondary">—</p>
            )}
          </div>
          <div className="rounded-sm bg-primary-50 p-3 text-center">
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">Average</p>
            {reviewStatus?.average != null ? (
              <RatingBadge score={reviewStatus.average} size="lg" showLabel />
            ) : (
              <p className="text-xl font-bold text-text-secondary">—</p>
            )}
          </div>
        </div>
        {getReviewCTA()}
      </div>

      {/* Section 2: My Assigned Tasks */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-primary-900">My Assigned Tasks</h2>
          <Link href="/assignments" className="text-xs text-primary-600 hover:underline">
            View All Tasks →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-900">{myAssignments.active}</p>
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Active</p>
          </div>
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-900">{myAssignments.completed}</p>
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Completed</p>
          </div>
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-primary-900">{myAssignments.total}</p>
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Total</p>
          </div>
        </div>
        {myAssignments.recentActive.length > 0 ? (
          <div className="space-y-2">
            {myAssignments.recentActive.map((a) => (
              <div key={a.assignmentId} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                  <p className="text-xs text-text-secondary truncate">{a.target}</p>
                </div>
                <span className="text-[10px] text-text-secondary capitalize flex-shrink-0">{a.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
        )}
      </div>

      {/* Section 3: Weekly Reflection */}
      <div className="enterprise-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-primary-900 mb-1">Weekly Reflection</h2>
            {weeklyReflection.thisWeekSubmitted ? (
              <p className="text-xs text-success">Submitted this week</p>
            ) : (
              <p className="text-xs text-text-secondary">Not submitted yet</p>
            )}
          </div>
          <Link href="/weekly/reflection" className="text-xs text-primary-600 hover:underline">
            {weeklyReflection.thisWeekSubmitted ? "View →" : "Submit →"}
          </Link>
        </div>
      </div>

      {/* Section 4: Past Reviews */}
      {pastReviews.length > 0 && (
        <div className="enterprise-card p-5">
          <h2 className="font-semibold text-sm text-primary-900 mb-3">Past Reviews</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Month</th>
                <th className="text-center pb-2">Self</th>
                <th className="text-center pb-2">Manager</th>
                <th className="text-center pb-2">Average</th>
                <th className="text-left pb-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {pastReviews.map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-2 text-text-primary">{r.month}</td>
                  <td className="py-2 text-center">
                    {r.selfScore != null ? <RatingBadge score={r.selfScore} /> : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="py-2 text-center">
                    {r.managerScore != null ? <RatingBadge score={r.managerScore} /> : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="py-2 text-center">
                    {r.average != null ? <RatingBadge score={r.average} /> : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className={`py-2 text-xs font-medium ${ratingBandColor(r.ratingBand)}`}>
                    {r.ratingBand ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 5: Open Grievances */}
      {openGrievances > 0 && (
        <div className="enterprise-card p-4 flex items-center justify-between border-l-4 border-l-warning">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{openGrievances}</span> open grievance{openGrievances !== 1 ? "s" : ""}
          </p>
          <Link href="/grievances" className="text-xs text-primary-600 hover:underline">
            View →
          </Link>
        </div>
      )}
    </div>
  );
}
