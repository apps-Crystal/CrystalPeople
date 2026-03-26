"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, fmtDateTime } from "@/lib/utils";
import type { GrievanceCategory } from "@/lib/types";

async function safeJson(res: Response): Promise<Record<string, string>> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-700 border-yellow-300",
  in_review: "bg-blue-100 text-blue-700 border-blue-300",
  resolved: "bg-green-100 text-green-700 border-green-300",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<GrievanceCategory, string> = {
  workplace: "Workplace",
  harassment: "Harassment",
  policy: "Policy",
  compensation: "Compensation",
  other: "Other",
};

interface EnrichedGrievance {
  Grievance_ID: string;
  Employee_ID: string;
  Subject: string;
  Description: string;
  Category: GrievanceCategory;
  Status: string;
  Filed_At: string;
  Reviewed_By: string;
  Resolution_Notes: string;
  Resolved_At: string;
  employeeName: string;
  department: string;
}

export default function AdminGrievancesPage() {
  const [grievances, setGrievances] = useState<EnrichedGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<EnrichedGrievance | null>(null);

  // Review form
  const [reviewStatus, setReviewStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/grievances?status=${statusFilter}`
        : "/api/grievances";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchGrievances(); }, [fetchGrievances]);

  function openReview(g: EnrichedGrievance) {
    setSelected(g);
    setReviewStatus(g.Status === "submitted" ? "in_review" : g.Status);
    setResolutionNotes(g.Resolution_Notes);
    setReviewError("");
    setReviewSuccess(false);
  }

  async function handleReview() {
    if (!selected) return;
    setReviewError("");
    if (!reviewStatus) { setReviewError("Please select a status"); return; }
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/grievances/${selected.Grievance_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          resolution_notes: resolutionNotes,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setReviewError(data.error ?? "Failed to update"); return; }
      setReviewSuccess(true);
      await fetchGrievances();
      setTimeout(() => { setSelected(null); setReviewSuccess(false); }, 1200);
    } finally {
      setReviewLoading(false);
    }
  }

  const filtered = categoryFilter
    ? grievances.filter(g => g.Category === categoryFilter)
    : grievances;

  if (loading) return <PageLoader />;

  const counts = {
    submitted: grievances.filter(g => g.Status === "submitted").length,
    in_review: grievances.filter(g => g.Status === "in_review").length,
    resolved: grievances.filter(g => g.Status === "resolved").length,
    closed: grievances.filter(g => g.Status === "closed").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Grievance Management"
        subtitle={`${grievances.length} total · ${counts.submitted} pending review`}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
            className={cn(
              "enterprise-card p-3 text-left transition-colors",
              statusFilter === status ? "ring-2 ring-primary-600" : "hover:bg-primary-50/50"
            )}
          >
            <p className="text-xl font-bold text-text-primary">{count}</p>
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mt-0.5">
              {STATUS_LABELS[status]}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="w-48">
          <Select
            label="Filter by Category"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "All categories" },
              ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
        </div>
        {(statusFilter || categoryFilter) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setStatusFilter(""); setCategoryFilter(""); }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-secondary px-4 py-8 text-center">No grievances found.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-primary-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Employee</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Subject</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Category</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Status</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Filed</th>
                  <th className="px-3 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(g => (
                  <tr key={g.Grievance_ID} className="hover:bg-primary-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{g.employeeName}</p>
                      <p className="text-[11px] text-text-secondary">{g.department}</p>
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="truncate text-text-primary font-medium">{g.Subject}</p>
                    </td>
                    <td className="px-3 py-3 text-text-secondary capitalize">
                      {CATEGORY_LABELS[g.Category as GrievanceCategory] ?? g.Category}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border",
                        STATUS_COLORS[g.Status]
                      )}>
                        {STATUS_LABELS[g.Status] ?? g.Status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                      {fmtDateTime(g.Filed_At)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => openReview(g)}
                        className="h-7 px-3 text-[11px] font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-sm transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="enterprise-card enterprise-shadow w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-border px-5 py-3 sticky top-0 bg-white z-10">
              <h3 className="text-sm font-semibold text-text-primary">Review Grievance</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Employee info */}
              <div className="flex items-center gap-3 bg-primary-50 rounded-sm px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                  {selected.employeeName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{selected.employeeName}</p>
                  <p className="text-[11px] text-text-secondary">{selected.department} · Filed {fmtDateTime(selected.Filed_At)}</p>
                </div>
                <span className={cn(
                  "ml-auto inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border",
                  STATUS_COLORS[selected.Status]
                )}>
                  {STATUS_LABELS[selected.Status]}
                </span>
              </div>

              {/* Grievance details */}
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Subject</p>
                <p className="text-sm font-medium text-text-primary">{selected.Subject}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Category</p>
                <p className="text-sm text-text-primary capitalize">{CATEGORY_LABELS[selected.Category] ?? selected.Category}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed bg-primary-50 rounded-sm p-3">{selected.Description}</p>
              </div>

              {/* Review form */}
              <div className="border-t border-border pt-4 space-y-3">
                <Select
                  label="Update Status"
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
                  options={[
                    { value: "in_review", label: "In Review" },
                    { value: "resolved", label: "Resolved" },
                    { value: "closed", label: "Closed" },
                  ]}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Resolution Notes
                    {reviewStatus === "resolved" && <span className="text-danger ml-1">*</span>}
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe the steps taken and outcome..."
                    className="enterprise-input w-full resize-none text-sm py-2"
                  />
                </div>

                {reviewError && (
                  <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
                    <AlertCircle size={12} /> {reviewError}
                  </div>
                )}
                {selected.Resolved_At && (
                  <p className="text-[11px] text-text-secondary">
                    Resolved · {fmtDateTime(selected.Resolved_At)}
                  </p>
                )}
                {reviewSuccess && (
                  <div className="text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
                    Grievance updated. Notifying employee…
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
                <Button size="sm" loading={reviewLoading} onClick={handleReview}>
                  Save & Notify Employee
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
