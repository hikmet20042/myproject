"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import DashboardShell from "@/features/dashboard/components/DashboardShell";
import { DashboardVacancyDataContainer } from "@/components/containers/DashboardVacancyDataContainer";
import { ErrorBoundary, LoadingState } from "@/components/shared";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    // Block regular users from accessing dashboard
    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.replace(localePath('/auth/signin'));
      return;
    }

    // Regular users cannot access dashboard
    if (session?.user?.accountType === 'user') {
      setIsRedirecting(true);
      router.replace(localePath('/'));
      return;
    }

    // Pending organizations should be on /organization/pending
    if (session?.user?.accountType === 'organization' && session?.user?.organizationStatus === 'pending') {
      setIsRedirecting(true);
      router.replace(localePath('/organization/pending'));
      return;
    }

    setIsRedirecting(false);
  }, [status, session?.user?.accountType, session?.user?.organizationStatus, router, localePath]);

  if (isRedirecting || status === 'loading') {
    return <LoadingState text="Dashboard yüklənir..." />;
  }

  return (
    <ErrorBoundary title="Something went wrong in dashboard" message="Try again or reload the dashboard page.">
      <DashboardVacancyDataContainer>
        <DashboardShell>{children}</DashboardShell>
      </DashboardVacancyDataContainer>
    </ErrorBoundary>
  );
}
