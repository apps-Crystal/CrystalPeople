"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, AlertCircle, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, fmtDateTime } from "@/lib/utils";
import type { Grievance, GrievanceCategory } from "@/lib/types";

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

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  // File grievance modal
  const [fileOpen, setFileOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GrievanceCategory>("workplace");
  const [fileError, setFileError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSuccess, setFileSuccess] = useState(false);

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grievances");
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrievances(); }, [fetchGrievances]);

  async function handleFile() {
    setFileError("");
    if (subject.trim().length < 10) { setFileError("Subject must be at least 10 characters"); return; }
    if (description.trim().length < 20) { setFileError("Description must be at least 20 characters"); return; }
    setFileLoading(true);
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, category }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setFileError(data.error ?? "Failed to submit grievance"); return; }
      setFileSuccess(true);
      setSubject(""); setDescription(""); setCategory("workplace");
      setFileOpen(false);
      await fetchGrievances();
    } finally {
      setFileLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="My Grievances"
        subtitle="File and track your workplace grievances"
        action={
          <Button size="sm" icon={<Plus size={13} />} onClick={() => { setFileOpen(true); setFileError(""); setFileSuccess(false); }}>
            File Grievance
          </Button>
        }
      />

      {fileSuccess && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
          Your grievance has been submitted. HR will review it shortly.
        </div>
      )}

      {grievances.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert size={20} />}
          title="No grievances filed"
          description="If you have a workplace concern, use the File Grievance button to submit it confidentially."
          action={{ label: "File Grievance", onClick: () => setFileOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {grievances.map(g => (
            <GrievanceCard key={g.Grievance_ID} grievance={g} />
          ))}
        </div>
      )}

      {/* File Grievance Modal */}
      <Modal
        open={fileOpen}
        onClose={() => setFileOpen(false)}
        title="File a Grievance"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFileOpen(false)}>Cancel</Button>
            <Button size="sm" loading={fileLoading} onClick={handleFile}>Submit Grievance</Button>
          </>
        }
      >
        <div className="space-y-4">
          {fileError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {fileError}
            </div>
          )}
          <Input
            label="Subject *"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief description of the issue (min 10 characters)"
          />
          {subject.length > 0 && subject.trim().length < 10 && (
            <p className="text-[11px] text-warning -mt-3">Minimum 10 characters</p>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail, including dates, parties involved, and any relevant context... (min 20 characters)"
              className="enterprise-input w-full resize-y min-h-[100px] text-sm py-2"
            />
            {description.length > 0 && description.trim().length < 20 && (
              <p className="text-[11px] text-warning">Minimum 20 characters</p>
            )}
          </div>
          <Select
            label="Category"
            value={category}
            onChange={e => setCategory(e.target.value as GrievanceCategory)}
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <p className="text-[11px] text-text-secondary bg-primary-50 border border-border rounded-sm px-3 py-2">
            Your grievance will be reviewed confidentially by HR. You will be notified when the status changes.
          </p>
        </div>
      </Modal>
    </div>
  );
}

// ─── Grievance Card ───────────────────────────────────────────────────────────

function GrievanceCard({ grievance: g }: { grievance: Grievance }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="enterprise-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-primary-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border",
              STATUS_COLORS[g.Status]
            )}>
              {STATUS_LABELS[g.Status] ?? g.Status}
            </span>
            <span className="text-[10px] text-text-secondary border border-border rounded-sm px-1.5 py-0.5 capitalize">
              {CATEGORY_LABELS[g.Category as GrievanceCategory] ?? g.Category}
            </span>
            <p className="text-sm font-semibold text-text-primary truncate">{g.Subject}</p>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Filed · {fmtDateTime(g.Filed_At)}</p>
        </div>
        {open ? <ChevronDown size={13} className="text-text-secondary mt-1 flex-shrink-0" /> : <ChevronRight size={13} className="text-text-secondary mt-1 flex-shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{g.Description}</p>
          </div>
          {g.Resolution_Notes && (
            <div className="rounded-sm bg-success/5 border border-success/20 p-3">
              <p className="text-[11px] font-semibold text-success uppercase tracking-wide mb-1">Resolution</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{g.Resolution_Notes}</p>
              {g.Resolved_At && (
                <p className="text-[11px] text-text-secondary mt-2">Resolved · {fmtDateTime(g.Resolved_At)}</p>
              )}
            </div>
          )}
          {g.Status === "in_review" && !g.Resolution_Notes && (
            <p className="text-[11px] text-text-secondary">HR is currently reviewing this grievance.</p>
          )}
        </div>
      )}
    </div>
  );
}

