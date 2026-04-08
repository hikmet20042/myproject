"use client";

import { type ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardDataProvider } from "@/components/dashboard/DashboardDataProvider";
import { ErrorBoundary } from "@/components/shared";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ErrorBoundary title="Something went wrong in dashboard" message="Try again or reload the dashboard page.">
      <DashboardDataProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardDataProvider>
    </ErrorBoundary>
  );
}
