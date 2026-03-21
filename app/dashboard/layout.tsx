"use client";

import { type ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { UnauthorizedState } from "@/components/shared";
import { DashboardDataProvider } from "@/features/dashboard/context/DashboardDataProvider";
import { useSession } from "@/lib/auth/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();

if (!session) return null;

const accountType = session.user?.accountType;
const organizationStatus = session.user?.organizationStatus;

const isAuthorized =
  accountType === "organization" &&
  organizationStatus === "approved";

if (!isAuthorized) {
  return (
    <UnauthorizedState
      message={"Bu bölməyə daxil olmaq üçün təsdiqlənmiş təşkilat hesabı tələb olunur."}
    />
  );
}

  return (
    <DashboardDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardDataProvider>
  );
}
