"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { PageLoader } from "@/components/ui/Spinner";
import { MDDashboard } from "@/components/dashboard/MDDashboard";
import { HRDashboard } from "@/components/dashboard/HRDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import type { MDDashboardData } from "@/components/dashboard/MDDashboard";
import type { HRDashboardData } from "@/components/dashboard/HRDashboard";
import type { ManagerDashboardData } from "@/components/dashboard/ManagerDashboard";
import type { EmployeeDashboardData } from "@/components/dashboard/EmployeeDashboard";

export default function OverviewPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard");
        setLoading(false);
      });
  }, [user]);

  if (!user || loading) return <PageLoader />;
  if (error) return <p className="text-sm text-danger p-4">{error}</p>;
  if (!data) return null;

  if (user.role === "md") return <MDDashboard data={data as unknown as MDDashboardData} />;
  if (user.role === "hr") return <HRDashboard data={data as unknown as HRDashboardData} />;
  if (user.role === "manager") return <ManagerDashboard data={data as unknown as ManagerDashboardData} />;
  return <EmployeeDashboard data={data as unknown as EmployeeDashboardData} />;
}
