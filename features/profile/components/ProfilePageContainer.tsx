"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PencilLine, User } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/shared";
import ProfileView from "@/features/profile/components/ProfileView";
import ProfileForm from "@/features/profile/components/ProfileForm";

export default function ProfilePageContainer() {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id ?? null;
  const accountType = session?.user?.accountType;
  const isOrganizationAccount = accountType === "organization";
  const isApprovedKnown = session?.user?.isApprovedOrganization !== undefined;
  const isApprovedOrganization = session?.user?.isApprovedOrganization === true;
  const router = useRouter();
  const routerRef = useRef(router);
  const localePath = useLocalizedPath();
  const signInPath = localePath("/auth/signin");
  const homePath = localePath("/");
  const [organizationProfile, setOrganizationProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.debug("[profile-page] mount", { userId: sessionUserId });
    return () => {
      console.debug("[profile-page] unmount", { userId: sessionUserId });
    };
    // Mount-only lifecycle debug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      console.debug("[profile-page] fetch trigger", { reason: "guard-ready" });
      setLoading(true);
      const profileRes = await fetch("/api/organization/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setOrganizationProfile(profileData.organization || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      console.debug("[auth-guard][profile] redirect -> signin", { status });
      routerRef.current.replace(signInPath);
      return;
    }

    if (status === "authenticated" && !sessionUserId) {
      console.debug("[auth-guard][profile] authenticated but userId not ready");
      return;
    }

    if (status === "authenticated" && accountType === undefined) {
      console.debug("[auth-guard][profile] authenticated but accountType not ready", {
        userId: sessionUserId,
      });
      return;
    }

    if (status === "authenticated" && !isOrganizationAccount) {
      console.debug("[auth-guard][profile] redirect -> home (non-organization account)", {
        userId: sessionUserId,
        accountType,
      });
      routerRef.current.replace(homePath);
      return;
    }

    if (status === "authenticated" && !isApprovedKnown) {
      console.debug("[auth-guard][profile] authenticated but approval state not ready", {
        userId: sessionUserId,
      });
      return;
    }

    if (status === "authenticated" && isApprovedOrganization === false) {
      console.debug("[auth-guard][profile] redirect -> home (not approved org)", {
        userId: sessionUserId,
      });
      routerRef.current.replace(homePath);
      return;
    }

    console.debug("[auth-guard][profile] ready", {
      userId: sessionUserId,
      status,
      accountType,
      isApprovedOrganization,
    });
    fetchProfile();
  }, [accountType, fetchProfile, homePath, isApprovedKnown, isApprovedOrganization, isOrganizationAccount, sessionUserId, signInPath, status, mounted]);

  if (status === "loading" || loading) {
    return <LoadingState text={"Yüklənir"} />;
  }

  if (
    status === "authenticated" &&
    accountType !== undefined &&
    !isOrganizationAccount
  ) {
    return (
      <ErrorState
        title={"Giriş Qadağandır"}
        message={"Bu səhifəyə daxil olmaq üçün təşkilat hesabı tələb olunur."}
        onRetry={() => routerRef.current.replace(homePath)}
        retryText={"Ana səhifəyə qayıt"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  if (
    status === "authenticated" &&
    isApprovedKnown &&
    isApprovedOrganization === false
  ) {
    return (
      <ErrorState
        title={"Giriş Qadağandır"}
        message={"Bu səhifəyə daxil olmaq üçün təsdiqlənmiş təşkilat olmalısınız."}
        onRetry={() => routerRef.current.replace(homePath)}
        retryText={"Ana səhifəyə qayıt"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-100 text-indigo-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Organization Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              {showProfileEdit
                ? "Edit your public organization details in a focused form."
                : "Review and keep your organization profile up to date."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowProfileEdit(!showProfileEdit)}
          variant="primary"
          size="sm"
          className="rounded-xl"
        >
          {showProfileEdit ? <ArrowLeft className="mr-1 h-4 w-4" /> : <PencilLine className="mr-1 h-4 w-4" />}
          {showProfileEdit ? "Back to Profile" : "Edit Profile"}
        </Button>
      </header>

      {showProfileEdit ? (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md" className="bg-white">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit Organization Details</h2>
              <p className="mt-1 text-sm text-slate-600">
                Update key information and save changes when you are done.
              </p>
            </div>
            <ProfileForm
              organizationProfile={organizationProfile}
              onSave={(updatedProfile) => {
                setOrganizationProfile(updatedProfile);
                setShowProfileEdit(false);
              }}
              onCancel={() => setShowProfileEdit(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md" className="bg-white">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Profile Overview</h2>
              <p className="mt-1 text-sm text-slate-600">
                This is how your organization profile appears within the platform.
              </p>
            </div>
            <ProfileView organizationProfile={organizationProfile} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
