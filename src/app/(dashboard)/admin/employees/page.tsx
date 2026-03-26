"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Upload, Download, X, RefreshCw,
  Edit2, ChevronUp, ChevronDown, AlertCircle, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { cn, fmtDate } from "@/lib/utils";
import type { Employee } from "@/lib/types";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeRow extends Omit<Employee, "Password_Hash"> {
  Manager_Name?: string;
}

type SortKey = "Name" | "Employee_ID" | "Department" | "Join_Date" | "Status";
type SortDir = "asc" | "desc";

const ROLES = ["employee", "manager", "hr", "md"] as const;
const EMP_TYPES = ["white_collar", "blue_collar"] as const;
const PAGE_SIZE = 25;

const ROLE_LABELS: Record<string, string> = {
  employee: "Employee", manager: "Manager", hr: "HR", md: "MD",
};
const TYPE_LABELS: Record<string, string> = {
  white_collar: "White Collar", blue_collar: "Blue Collar",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("Name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [modal, setModal] = useState<"add" | "edit" | "import" | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);

  const fetchEmployees = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterDept) params.set("department", filterDept);
      if (filterRole) params.set("role", filterRole);
      if (filterType) params.set("employee_type", filterType);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/employees?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setEmployees(data.employees ?? []);
      setDepartments(data.departments ?? []);
      setTotalActive(data.activeCount ?? 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterDept, filterRole, filterType, filterStatus]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { setPage(1); }, [search, filterDept, filterRole, filterType, filterStatus]);

  // Sort + paginate
  const sorted = [...employees].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function openEdit(emp: EmployeeRow) {
    setEditTarget(emp);
    setModal("edit");
  }

  function handleModalClose() {
    setModal(null);
    setEditTarget(null);
  }

  function handleSaved() {
    handleModalClose();
    fetchEmployees(true);
  }

  const hasFilters = search || filterDept || filterRole || filterType || (filterStatus && filterStatus !== "active");

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeader title="Employee Management" />
          <p className="text-xs text-text-secondary mt-0.5">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} shown
            {totalActive > 0 && ` · ${totalActive} active`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => fetchEmployees(true)}
            disabled={refreshing}
            className="h-8 w-8 flex items-center justify-center border border-border rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin")} />
          </button>
          <button
            onClick={() => downloadTemplate()}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50 transition-colors"
          >
            <Download size={13} /> Template
          </button>
          <button
            onClick={() => setModal("import")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50 transition-colors"
          >
            <Upload size={13} /> Upload Excel
          </button>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-sm transition-colors shadow-sm"
          >
            <Plus size={13} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="enterprise-card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, ID, department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="enterprise-input pl-8 h-8 text-xs w-full"
          />
        </div>
        <FilterSelect value={filterDept} onChange={setFilterDept} placeholder="All Departments">
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </FilterSelect>
        <FilterSelect value={filterRole} onChange={setFilterRole} placeholder="All Roles">
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </FilterSelect>
        <FilterSelect value={filterType} onChange={setFilterType} placeholder="All Types">
          {EMP_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </FilterSelect>
        <FilterSelect value={filterStatus} onChange={setFilterStatus} placeholder="All Statuses">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterDept(""); setFilterRole(""); setFilterType(""); setFilterStatus("active"); }}
            className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 px-2 h-8 border border-danger/30 rounded-sm"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-primary-50">
                <Th label="ID" sortKey="Employee_ID" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th label="Name" sortKey="Name" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Email</th>
                <Th label="Department" sortKey="Department" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Role</th>
                <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Type</th>
                <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Manager</th>
                <Th label="Joined" sortKey="Join_Date" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th label="Status" sortKey="Status" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2.5 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-text-secondary text-xs">
                    No employees found
                  </td>
                </tr>
              ) : (
                pageRows.map(emp => (
                  <tr
                    key={emp.Employee_ID}
                    className="hover:bg-primary-50/50 cursor-pointer transition-colors"
                    onClick={() => openEdit(emp)}
                  >
                    <td className="px-3 py-2.5 font-mono text-[11px] text-text-secondary">{emp.Employee_ID}</td>
                    <td className="px-3 py-2.5 font-semibold text-text-primary whitespace-nowrap">{emp.Name}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{emp.Email}</td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">{emp.Department}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-text-primary">{ROLE_LABELS[emp.Role] ?? emp.Role}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        label={TYPE_LABELS[emp.Employee_Type] ?? emp.Employee_Type}
                        variant={emp.Employee_Type === "white_collar" ? "active" : "pending"}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {emp.Manager_Name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {emp.Join_Date ? fmtDate(emp.Join_Date) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        label={emp.Status === "active" ? "Active" : "Inactive"}
                        variant={emp.Status === "active" ? "complete" : "inactive"}
                      />
                    </td>
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1 rounded-sm text-text-secondary hover:text-primary-600 hover:bg-primary-100 transition-colors"
                        title="Edit employee"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</PagBtn>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const pg = page <= 4 ? i + 1 : page + i - 3;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <PagBtn key={pg} onClick={() => setPage(pg)} active={pg === page}>{pg}</PagBtn>
                );
              })}
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ›</PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "add" && (
        <AddModal
          departments={departments}
          managers={employees.filter(e => ["manager", "hr", "md"].includes(e.Role) && e.Status === "active")}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
      {modal === "edit" && editTarget && (
        <EditModal
          employee={editTarget}
          departments={departments}
          managers={employees.filter(e => ["manager", "hr", "md"].includes(e.Role) && e.Status === "active" && e.Employee_ID !== editTarget.Employee_ID)}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
      {modal === "import" && (
        <ImportModal
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, placeholder, children }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="enterprise-input h-8 text-xs pr-7 min-w-[140px]"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function Th({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px] cursor-pointer select-none hover:text-text-primary whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="flex flex-col -space-y-1">
          <ChevronUp size={9} className={cn(active && dir === "asc" ? "text-primary-600" : "text-border")} />
          <ChevronDown size={9} className={cn(active && dir === "desc" ? "text-primary-600" : "text-border")} />
        </span>
      </span>
    </th>
  );
}

function PagBtn({ onClick, disabled, active, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 min-w-[28px] px-2 text-[11px] rounded-sm border transition-colors",
        active
          ? "bg-primary-600 border-primary-600 text-white font-semibold"
          : "border-border text-text-secondary hover:text-text-primary hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

function AddModal({ departments, managers, onClose, onSaved }: {
  departments: string[];
  managers: EmployeeRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", department: "", role: "employee",
    employee_type: "white_collar", manager_id: "", join_date: "", password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deptInput, setDeptInput] = useState("");

  const dept = deptInput || form.department;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, department: dept }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create employee"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalWrapper title="Add Employee" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *">
            <input className="enterprise-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Ahmed Al Farsi" />
          </Field>
          <Field label="Email Address *">
            <input type="email" className="enterprise-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="ahmed@crystalgroup.com" />
          </Field>
          <Field label="Mobile">
            <input className="enterprise-input" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+968 XXXX XXXX" />
          </Field>
          <Field label="Join Date *">
            <input type="date" className="enterprise-input" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} required />
          </Field>
          <Field label="Department *">
            {departments.length > 0 ? (
              <div className="space-y-1">
                <select
                  className="enterprise-input"
                  value={form.department}
                  onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setDeptInput(""); }}
                >
                  <option value="">Select or type below</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  className="enterprise-input text-xs"
                  placeholder="Or type new department…"
                  value={deptInput}
                  onChange={e => setDeptInput(e.target.value)}
                />
              </div>
            ) : (
              <input className="enterprise-input" value={deptInput} onChange={e => setDeptInput(e.target.value)} required placeholder="Type department name" />
            )}
          </Field>
          <Field label="Role *">
            <select className="enterprise-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Employee Type *">
            <select className="enterprise-input" value={form.employee_type} onChange={e => setForm(f => ({ ...f, employee_type: e.target.value }))} required>
              {EMP_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Reporting Manager">
            <select className="enterprise-input" value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
              <option value="">— No manager —</option>
              {managers.map(m => <option key={m.Employee_ID} value={m.Employee_ID}>{m.Name} ({m.Employee_ID})</option>)}
            </select>
          </Field>
          <Field label="Initial Password *">
            <input type="password" className="enterprise-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="Min. 6 characters" />
          </Field>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="h-8 px-4 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:bg-primary-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm transition-colors shadow-sm flex items-center gap-2">
            {saving && <Spinner size="sm" />} Create Employee
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Edit Employee Modal ──────────────────────────────────────────────────────

function EditModal({ employee, departments, managers, onClose, onSaved }: {
  employee: EmployeeRow;
  departments: string[];
  managers: EmployeeRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: employee.Name ?? "",
    email: employee.Email ?? "",
    mobile: employee.Mobile ?? "",
    department: employee.Department ?? "",
    role: employee.Role ?? "employee",
    employee_type: employee.Employee_Type ?? "white_collar",
    manager_id: employee.Manager_ID ?? "",
    join_date: employee.Join_Date ?? "",
    status: employee.Status ?? "active",
  });
  const [deptInput, setDeptInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetFirstLogin, setResetFirstLogin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [success, setSuccess] = useState("");

  const dept = deptInput || form.department;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee.Employee_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, department: dept }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save changes"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!newPassword || newPassword.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    setPwError(""); setResetting(true);
    try {
      const res = await fetch(`/api/employees/${employee.Employee_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword, reset_first_login: resetFirstLogin }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Failed to reset password"); return; }
      setNewPassword(""); setResetFirstLogin(false);
      setSuccess("Password reset successfully.");
    } finally {
      setResetting(false);
    }
  }

  async function toggleStatus() {
    const newStatus = form.status === "active" ? "inactive" : "active";
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee.Employee_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { setError("Failed to update status"); return; }
      setForm(f => ({ ...f, status: newStatus }));
      setSuccess(`Employee ${newStatus === "active" ? "reactivated" : "deactivated"}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalWrapper title={`Edit Employee — ${employee.Employee_ID}`} onClose={onClose} wide>
      <div className="space-y-5">
        {/* Employee info form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input className="enterprise-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="Email Address *">
              <input type="email" className="enterprise-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </Field>
            <Field label="Mobile">
              <input className="enterprise-input" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
            </Field>
            <Field label="Join Date *">
              <input type="date" className="enterprise-input" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} required />
            </Field>
            <Field label="Department *">
              <div className="space-y-1">
                <select
                  className="enterprise-input"
                  value={form.department}
                  onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setDeptInput(""); }}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="">Type below…</option>
                </select>
                <input
                  className="enterprise-input text-xs"
                  placeholder="Or type new department…"
                  value={deptInput}
                  onChange={e => setDeptInput(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Role *">
              <select className="enterprise-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof f.role }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <Field label="Employee Type *">
              <select className="enterprise-input" value={form.employee_type} onChange={e => setForm(f => ({ ...f, employee_type: e.target.value as typeof f.employee_type }))}>
                {EMP_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Reporting Manager">
              <select className="enterprise-input" value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
                <option value="">— No manager —</option>
                {managers.map(m => <option key={m.Employee_ID} value={m.Employee_ID}>{m.Name} ({m.Employee_ID})</option>)}
              </select>
            </Field>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}
          {success && <SuccessBox>{success}</SuccessBox>}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={toggleStatus}
              disabled={saving}
              className={cn(
                "h-8 px-4 text-xs font-semibold border rounded-sm transition-colors flex items-center gap-1.5",
                form.status === "active"
                  ? "border-danger/40 text-danger hover:bg-danger/5"
                  : "border-success/40 text-success hover:bg-success/5"
              )}
            >
              {form.status === "active" ? "Deactivate Employee" : "Reactivate Employee"}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-8 px-4 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:bg-primary-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm transition-colors shadow-sm flex items-center gap-2">
                {saving && <Spinner size="sm" />} Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Password Reset section */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2.5">Reset Password</p>
          <div className="flex items-end gap-2">
            <Field label="New Password" className="flex-1">
              <input
                type="password"
                className="enterprise-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </Field>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer mb-px pb-px h-9">
              <input
                type="checkbox"
                checked={resetFirstLogin}
                onChange={e => setResetFirstLogin(e.target.checked)}
                className="rounded-sm"
              />
              Force re-welcome
            </label>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetting || !newPassword}
              className="h-9 px-4 text-xs font-semibold border border-warning/40 text-warning hover:bg-warning/5 disabled:opacity-40 rounded-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {resetting && <Spinner size="sm" />} Reset
            </button>
          </div>
          {pwError && <p className="text-xs text-danger mt-1.5">{pwError}</p>}
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

interface ParsedRow {
  row: number;
  name: string;
  email: string;
  mobile: string;
  department: string;
  role: string;
  employee_type: string;
  manager_id: string;
  join_date: string;
  password: string;
  _valid: boolean;
  _errors: string[];
}

function ImportModal({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);
  const [parseError, setParseError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setParsed([]);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (rows.length === 0) { setParseError("Sheet is empty"); return; }
        if (rows.length > 200) { setParseError("Max 200 rows per import"); return; }

        const VALID_ROLES_SET = new Set(["employee", "manager", "hr", "md"]);
        const VALID_TYPES_SET = new Set(["white_collar", "blue_collar"]);

        const parsedRows: ParsedRow[] = rows.map((r, i) => {
          const name = String(r.Name ?? r.name ?? "").trim();
          const email = String(r.Email ?? r.email ?? "").trim().toLowerCase();
          const mobile = String(r.Mobile ?? r.mobile ?? "").trim();
          const department = String(r.Department ?? r.department ?? "").trim();
          const role = String(r.Role ?? r.role ?? "").trim().toLowerCase();
          const employee_type = String(r.Employee_Type ?? r.employee_type ?? "").trim().toLowerCase();
          const manager_id = String(r.Manager_ID ?? r.manager_id ?? "").trim();
          const join_date = String(r.Join_Date ?? r.join_date ?? "").trim();
          const password = String(r.Password ?? r.password ?? "").trim();

          const errors: string[] = [];
          if (!name) errors.push("Name required");
          if (!email) errors.push("Email required");
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email");
          if (!department) errors.push("Department required");
          if (!role) errors.push("Role required");
          else if (!VALID_ROLES_SET.has(role)) errors.push(`Invalid role "${role}"`);
          if (!employee_type) errors.push("Employee_Type required");
          else if (!VALID_TYPES_SET.has(employee_type)) errors.push(`Invalid type "${employee_type}"`);
          if (!join_date) errors.push("Join_Date required");
          if (!password) errors.push("Password required");
          else if (password.length < 6) errors.push("Password min 6 chars");

          return { row: i + 1, name, email, mobile, department, role, employee_type, manager_id, join_date, password, _valid: errors.length === 0, _errors: errors };
        });
        setParsed(parsedRows);
      } catch {
        setParseError("Failed to parse file. Ensure it is a valid .xlsx or .csv file.");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleImport() {
    const valid = parsed.filter(r => r._valid);
    if (valid.length === 0) return;

    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/employees/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: valid.map(r => ({
            name: r.name, email: r.email, mobile: r.mobile,
            department: r.department, role: r.role, employee_type: r.employee_type,
            manager_id: r.manager_id, join_date: r.join_date, password: r.password,
          })),
        }),
      });
      const data = await res.json();
      setResult({ created: data.created, errors: data.errors ?? [] });
      if (data.created > 0) onSaved();
    } finally {
      setImporting(false);
    }
  }

  const validCount = parsed.filter(r => r._valid).length;
  const invalidCount = parsed.filter(r => !r._valid).length;

  return (
    <ModalWrapper title="Bulk Import Employees" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="rounded-sm bg-primary-50 border border-border px-3 py-2.5 text-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">Required columns (exact header names):</p>
          <p className="font-mono text-[11px]">Name · Email · Department · Role · Employee_Type · Join_Date · Password</p>
          <p>Optional: Mobile, Manager_ID</p>
          <p>Role values: <span className="font-mono">employee · manager · hr · md</span></p>
          <p>Employee_Type values: <span className="font-mono">white_collar · blue_collar</span></p>
        </div>

        {/* File input */}
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-9 px-4 text-xs font-semibold border border-dashed border-primary-300 rounded-sm text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Upload size={13} /> Choose Excel / CSV File
          </button>
          {parseError && <p className="text-xs text-danger mt-1.5">{parseError}</p>}
        </div>

        {/* Preview */}
        {parsed.length > 0 && !result && (
          <>
            <div className="flex items-center gap-3 text-xs">
              {validCount > 0 && <span className="text-success flex items-center gap-1"><CheckCircle2 size={12} /> {validCount} valid row{validCount !== 1 ? "s" : ""}</span>}
              {invalidCount > 0 && <span className="text-danger flex items-center gap-1"><AlertCircle size={12} /> {invalidCount} row{invalidCount !== 1 ? "s" : ""} with errors</span>}
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar border border-border rounded-sm">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-primary-50 border-b border-border">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">#</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">Email</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">Dept</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">Role</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.map(r => (
                    <tr key={r.row} className={cn(r._valid ? "" : "bg-danger/5")}>
                      <td className="px-2 py-1.5 text-text-secondary">{r.row}</td>
                      <td className="px-2 py-1.5 font-medium">{r.name || <span className="text-danger italic">missing</span>}</td>
                      <td className="px-2 py-1.5 text-text-secondary">{r.email || <span className="text-danger italic">missing</span>}</td>
                      <td className="px-2 py-1.5 text-text-secondary">{r.department || "—"}</td>
                      <td className="px-2 py-1.5 text-text-secondary">{r.role || "—"}</td>
                      <td className="px-2 py-1.5">
                        {r._valid
                          ? <span className="text-success">✓ OK</span>
                          : <span className="text-danger" title={r._errors.join("; ")}>✗ {r._errors[0]}{r._errors.length > 1 ? ` +${r._errors.length - 1}` : ""}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {validCount > 0 && (
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="h-8 px-4 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:bg-primary-50">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm shadow-sm flex items-center gap-2"
                >
                  {importing && <Spinner size="sm" />} Import {validCount} Employee{validCount !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <SuccessBox>{result.created} employee{result.created !== 1 ? "s" : ""} imported successfully.</SuccessBox>
            {result.errors.length > 0 && (
              <div className="rounded-sm bg-danger/5 border border-danger/20 p-3">
                <p className="text-xs font-semibold text-danger mb-1">{result.errors.length} row{result.errors.length !== 1 ? "s" : ""} failed:</p>
                <ul className="space-y-0.5 text-xs text-danger/80">
                  {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={onClose} className="h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-sm shadow-sm">Done</button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ModalWrapper({ title, onClose, wide, children }: {
  title: string; onClose: () => void; wide?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={cn("enterprise-card enterprise-shadow w-full max-h-[90vh] overflow-y-auto custom-scrollbar", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3 sticky top-0 bg-[var(--color-surface,white)] z-10">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: {
  label: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger flex items-start gap-1.5">
      <AlertCircle size={12} className="flex-shrink-0 mt-px" /> {children}
    </div>
  );
}

function SuccessBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-success/10 border border-success/30 px-3 py-2 text-xs text-success flex items-start gap-1.5">
      <CheckCircle2 size={12} className="flex-shrink-0 mt-px" /> {children}
    </div>
  );
}

// ─── Template download ────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = ["Name", "Email", "Mobile", "Department", "Role", "Employee_Type", "Manager_ID", "Join_Date", "Password"];
  const sample = [
    ["Ahmed Al Farsi", "ahmed@crystalgroup.com", "+968 9123 4567", "Operations", "employee", "white_collar", "", "2026-01-15", "Welcome@2026"],
    ["Sara Al Balushi", "sara@crystalgroup.com", "+968 9876 5432", "Finance", "manager", "white_collar", "", "2025-06-01", "Welcome@2025"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, "Crystal_People_Import_Template.xlsx");
}
