"use client";

import { type ReactNode } from "react";
import DashboardShell from "@/features/dashboard/components/DashboardShell";
import { DashboardVacancyDataContainer } from "@/components/containers/DashboardVacancyDataContainer";
import { ErrorBoundary } from "@/components/shared";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ErrorBoundary title="Something went wrong in dashboard" message="Try again or reload the dashboard page.">
      <DashboardVacancyDataContainer>
        <DashboardShell>{children}</DashboardShell>
      </DashboardVacancyDataContainer>
    </ErrorBoundary>
  );
}
