"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Loading } from "@/components/ui/Loading";
import { DashboardDataProvider } from "@/features/dashboard/context/DashboardDataProvider";
import { useSession } from "@/lib/auth/client";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const accountType = session?.user?.accountType;
  const isOrganizationAccount = accountType === "organization";
  const isApprovedKnown = session?.user?.isApprovedOrganization !== undefined;
  const isApprovedOrganization = session?.user?.isApprovedOrganization === true;
  const router = useRouter();
  const routerRef = useRef(router);
  const [mounted, setMounted] = useState(false);
  const localePath = useLocalizedPath();
  const signInPath = localePath("/auth/signin?callbackUrl=/dashboard/profile");
  const homePath = localePath("/");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      routerRef.current.replace(signInPath);
      return;
    }

    if (status === "authenticated" && accountType === undefined) {
      return;
    }

    if (status === "authenticated" && !isOrganizationAccount) {
      routerRef.current.replace(homePath);
      return;
    }

    if (status === "authenticated" && !isApprovedKnown) {
      return;
    }

    if (status === "authenticated" && isApprovedOrganization === false) {
      routerRef.current.replace(homePath);
    }
  }, [accountType, homePath, isApprovedKnown, isApprovedOrganization, isOrganizationAccount, signInPath, status, mounted]);

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <DashboardDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardDataProvider>
  );
}
