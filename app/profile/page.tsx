"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Shield,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
  Edit3,
  Mail,
  AlertCircle,
} from "lucide-react";
import Stats from "@/components/Profile/Stats";
import TabNavigation from "@/components/Profile/TabNavigation";
import Profile from "@/components/Profile/Profile";
import Blogs from "@/components/Profile/Blogs";
import Notifications from "@/components/Profile/Notifications";
import SettingsTab from "@/components/Profile/SettingsTab";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, StatusBadge } from "@/components/shared";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { Alert } from "@/components/feedback";
import { useNotificationContext } from "@/components/NotificationContext";
import { isAdmin, isApprovedOrganization, isOrganization } from "@/lib/auth/permissions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { blogQueryKeys, deleteBlog as deleteBlogRequest, fetchUserBlogs } from "@/lib/blogQueries";
import { ApiError } from "@/lib/apiClient";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { useGlobalFeedback } from "@/lib/useGlobalFeedback";

interface NotificationItem {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface UserProfile {
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
    role: string;
    emailVerified: string;
    createdAt: string;
  };
  profile: {
    bio: string;
    location: string;
    website: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    organization: string;
    interests?: string;
    avatar?: string;
    avatarUrl?: string; // Virtual field from UserProfile model
    socialLinks?: string;
    socialMedia?: {
      facebook: string;
      twitter: string;
      instagram: string;
      linkedin: string;
      youtube: string;
      website: string;
    };
    // Organization-specific fields
    registrationNumber?: string;
    focusAreas?: string[];
    status?: string;
    contactPerson?: string;
  } | null;
  isOrganization?: boolean;
}

function ProfilePageContent() {
  const localePath = useLocalizedPath();
  const { showSuccess, showError } = useGlobalFeedback();
  const logApiError = (label: string, error: unknown) => {
    if (error instanceof ApiError && error.code) {
      console.error(`${label} code:`, error.code, error.details);
      return;
    }
    console.error(label, error);
  };

  // Notification modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNotification, setModalNotification] =
    useState<NotificationItem | null>(null);
  // Email verification resend state (must be at the very top, before any conditional returns)
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendError, setResendError] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshNotifications } = useNotificationContext();

  // Get active tab from URL, default to 'profile'
  const getActiveTabFromUrl = useCallback(() => {
    const tab = searchParams?.get("tab");
    if (
      tab &&
      ["profile", "blogs", "notifications", "settings"].includes(tab)
    ) {
      return tab;
    }
    return "profile";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState({
    totalBlogs: 0,
    joinedDate: "",
    lastActive: "",
    writingStreak: 0,
  });

  const [achievements, setAchievements] = useState<any[]>([]);

  // Main loading state
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [statsLoadError, setStatsLoadError] = useState("");

  // Tab switching state - track which tab is being loaded
  const [loadingTab, setLoadingTab] = useState<string | null>(null);

  // State for tab content
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const queryClient = useQueryClient();

  const normalizeNotificationsPayload = useCallback((responseJson: any) => {
    const payload = responseJson?.data || {};
    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.notifications)
        ? payload.notifications
        : [];
    const metaFromPayload =
      payload.meta && typeof payload.meta === "object" ? payload.meta : {};
    const meta =
      typeof metaFromPayload.unreadCount === "number"
        ? metaFromPayload
        : {
            ...metaFromPayload,
            unreadCount:
              typeof payload.unreadCount === "number"
                ? payload.unreadCount
                : undefined,
          };

    return { items, meta };
  }, []);

  const userBlogsQuery = useQuery({
    queryKey: blogQueryKeys.user,
    queryFn: fetchUserBlogs,
    enabled: status === "authenticated" && activeTab === "blogs",
  });

  const blogs = userBlogsQuery.data?.items || [];

  // Load functions
  const loadProfileStats = useCallback(async () => {
    try {
      setStatsLoadError("");
      const response = await fetch("/api/users/profile/stats");
      if (response.ok) {
        const responseJson = await response.json();
        const stats = responseJson?.data?.stats;
        if (!stats) {
          throw new Error("Stats payload is empty");
        }
        setProfileStats(stats);
        setAchievements(stats.achievements || []);
      } else {
        // Fallback to calculated stats

        setProfileStats({
          totalBlogs: blogs.length,
          joinedDate: profile?.user?.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          writingStreak: Math.floor(Math.random() * 30) + 1,
        });
        setStatsLoadError(getUserErrorMessage(null));
      }
    } catch (error) {
      logApiError("Error loading profile stats:", error);
      setStatsLoadError(getUserErrorMessage(error));
    }
  }, [blogs.length, profile?.user?.createdAt]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const responseJson = await response.json();
        const normalized = normalizeNotificationsPayload(responseJson);
        setNotifications(normalized.items);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [normalizeNotificationsPayload]);

  const toggleNotificationRead = useCallback(async (notificationId: string, isRead: boolean) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead }),
      });

      if (response.ok) {
        await loadNotifications();
        refreshNotifications();
      }
    } catch (error) {
      console.error("Error toggling notification state:", error);
    }
  }, [loadNotifications, refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        await loadNotifications();
        refreshNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [loadNotifications, refreshNotifications]);

  const loadTabData = useCallback(
    async (tab: string) => {
      switch (tab) {
        case "notifications":
          await loadNotifications();
          break;
        default:
          break;
      }
    },
    [loadNotifications],
  );

  // Handle tab change - just update URL, let effect handle loading
  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === activeTab || loadingTab) return;
      const newUrl = tab === "profile" ? "/profile" : `/profile?tab=${tab}`;
      router.push(newUrl);
    },
    [activeTab, loadingTab, router],
  );

  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "blog";
    id: string;
    title: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    organization: "",
    interests: "",
    avatar: "",
    socialLinks: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      website: "",
    },
    // Organization-specific fields
    registrationNumber: "",
    focusAreas: [] as string[],
    status: "",
    contactPerson: "",
  });

  const loadedTabsRef = useRef(new Set<string>());

  // Sync activeTab with URL and load data
  useEffect(() => {
    const newTab = getActiveTabFromUrl();

    // If tab changed via URL (or initial load), update state
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }

    // Load data if not already loaded based on our ref tracking
    if (status === "authenticated") {
      const shouldLoad =
        newTab === "notifications" &&
        !loadedTabsRef.current.has(newTab);

      if (shouldLoad && !loadingTab) {
        setLoadingTab(newTab);
        loadTabData(newTab).finally(() => {
          // Mark as loaded regardless of success/empty result to prevent loops
          loadedTabsRef.current.add(newTab);
          setLoadingTab(null);
        });
      }
    }
  }, [getActiveTabFromUrl, activeTab, status, loadTabData, loadingTab]); // Removed data lengths from dependencies

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => deleteBlogRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.user });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      logApiError("Delete blog error:", error);
      showError(getUserErrorMessage(error));
    },
  });

  const deleteBlog = (id: string) => {
    deleteBlogMutation.mutate(id);
  };

  // Handle notification parameter from URL (when coming from header dropdown)
  useEffect(() => {
    const notificationId = searchParams?.get("notification");
    if (notificationId && notifications.length > 0) {
      const notification = notifications.find(
        (n) => (n.id || n._id) === notificationId,
      );
      if (notification) {
        setModalNotification(notification);
        setModalOpen(true);
        // Remove notification parameter from URL without page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("notification");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams, notifications]);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoadError("");
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        const responseJson = await response.json();
        const payload = responseJson?.data;
        if (!payload?.user) {
          throw new Error("Profile payload is empty");
        }
        setProfile(payload);
        setFormData({
          name: payload.user.name || "",
          bio: payload.profile?.bio || "",
          location: payload.profile?.location || "",
          website: payload.profile?.website || "",
          phone: payload.profile?.phone || "",
          dateOfBirth: payload.profile?.dateOfBirth || "",
          gender: payload.profile?.gender || "",
          occupation: payload.profile?.occupation || "",
          organization: payload.profile?.organization || "",
          interests: payload.profile?.interests || "",
          avatar: payload.profile?.avatarUrl || payload.profile?.avatar || "",
          socialMedia: {
            facebook: payload.profile?.socialMedia?.facebook || "",
            twitter: payload.profile?.socialMedia?.twitter || "",
            instagram: payload.profile?.socialMedia?.instagram || "",
            linkedin: payload.profile?.socialMedia?.linkedin || "",
            youtube: payload.profile?.socialMedia?.youtube || "",
            website: payload.profile?.socialMedia?.website || "",
          },
          socialLinks: payload.profile?.socialLinks || "",
          // Organization-specific fields
          registrationNumber: payload.profile?.registrationNumber || "",
          focusAreas: payload.profile?.focusAreas || [],
          status: payload.profile?.status || "",
          contactPerson: payload.profile?.contactPerson || "",
        });
      } else {
        setProfileLoadError(getUserErrorMessage(null));
      }
    } catch (error) {
      logApiError("Error loading profile:", error);
      setProfileLoadError(getUserErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const loadEssentialData = async () => {
      if (!profile) {
        await loadProfile();
      }
      await loadProfileStats();
    };

    loadEssentialData();
  }, [
    status,
    session?.user?.email,
    router,
    localePath,
    profile,
    loadProfile,
    loadProfileStats,
  ]);

  const handleSaveProfile = async () => {
    try {
      console.log("Saving profile with data:", formData);
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok) {
        setEditing(false);
        await loadProfile();
        // Show success message
        showSuccess("Profil uğurla yeniləndi!");
      } else {
        console.error("Save failed:", result);
        if (result?.error?.code) {
          console.error("Save profile API error code:", result.error.code, result.error.details);
        }
        showError(`${"Profil yadda saxlanmadı"}: ${getUserErrorMessage(result?.error)}`);
      }
    } catch (error) {
      logApiError("Error saving profile:", error);
      showError(getUserErrorMessage(error));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  if (loading) {
    return <LoadingState text={"Yüklənir"} />;
  }

  if (!profile) {
    return (
      <ErrorState
        title={"Something went wrong"}
        message={profileLoadError || "Failed to load data. Please try again."}
        onRetry={() => router.push(localePath("/"))}
        retryText={"Ana səhifəyə qayıt"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess("");
    setResendError("");
    try {
      const targetEmail = profile?.user?.email || session?.user?.email;
      if (!targetEmail) {
        setResendError("E-poçt ünvanı tapılmadı");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const appUrl = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/auth/verify-email?verified=1")}`,
        },
      });
      if (error) {
        setResendError(getUserErrorMessage(error));
        return;
      }
      setResendSuccess("Təsdiq e-poçtu göndərildi! Gələnlər qutunu yoxla.");
    } catch (e) {
      logApiError("Resend verification error:", e);
      setResendError(getUserErrorMessage(e));
    } finally {
      setResendLoading(false);
    }
  };

  // Block submit if not verified
  const isUnverified = Boolean(profile?.user) && !profile?.user?.emailVerified;

  // Only one main return at the end of the component
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group animate-fade-in">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary flex items-center justify-center text-white text-3xl sm:text-5xl font-black shadow-md ring-4 ring-white">
                {profile.user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {isAdmin(session) && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shadow-sm ring-4 ring-white">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 animate-fade-in animation-delay-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                    {profile.user.name}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {profile.user.email}
                  </p>
                </div>
              </div>

              {profile.profile?.bio && (
                <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-2xl leading-relaxed">
                  {profile.profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {"Aktiv"}
                </span>
                {isAdmin(session) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-blue-100 text-blue-800">
                    <Shield className="w-4 h-4" />
                    {"Admin"}
                  </span>
                )}
                {isApprovedOrganization(session) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-blue-100 text-blue-800">
                    <Award className="w-4 h-4" />
                    {"Təşkilat Hesabı"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border border-gray-200 bg-white text-gray-700">
                  {"Qoşuldu"}{" "}
                  {new Date(
                    profileStats.joinedDate || Date.now(),
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6">
        {statsLoadError && (
          <div className="mb-4">
            <Alert variant="error">{statsLoadError}</Alert>
          </div>
        )}
        <div className="pb-6 sm:pb-12">
          {/* Email Verification Banner */}
          {isUnverified && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base text-yellow-900">
                    <strong className="font-bold">
                      {"E-poçtun təsdiqlənməyib."}
                    </strong>
                    <span className="block mt-1">
                      {
                        "E-poçtunu təsdiqləyənə qədər bloq təqdim edə bilməzsən."
                      }
                    </span>
                    <span className="block mt-1 text-yellow-800">
                      {
                        "Təsdiq e-poçtu üçün gələnlər qutusunu (və spam qovluğunu) yoxla."
                      }
                    </span>
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    variant="primary"
                    size="sm"
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600"
                  >
                    {resendLoading
                      ? "Göndərilir..."
                      : "Təsdiq E-poçtunu Yenidən Göndər"}
                  </Button>
                  {resendSuccess && (
                    <div className="mt-2 text-sm text-green-700 font-medium">
                      {resendSuccess}
                    </div>
                  )}
                  {resendError && (
                    <div className="mt-2 text-sm text-blue-700 font-medium">
                      {resendError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation
            handleTabChange={handleTabChange}
            loadingTab={loadingTab}
            activeTab={activeTab}
            notifications={notifications}
            userRole={profile?.user?.role}
            isOrganization={isApprovedOrganization(session)}
          />

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Profile
              loading={loading}
              setEditing={setEditing}
              editing={editing}
              formData={formData}
              profile={profile}
              setFormData={setFormData}
              handleSaveProfile={handleSaveProfile}
            />
          )}

          {/* Blogs Tab */}
          {activeTab === "blogs" && isOrganization(session) && !isApprovedOrganization(session) && (
            <Blogs
              loadingTab={loadingTab || (userBlogsQuery.isLoading ? "blogs" : null)}
              blogs={blogs}
              isLoading={userBlogsQuery.isLoading}
              isError={userBlogsQuery.isError}
              onRetry={() => userBlogsQuery.refetch()}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              setDeleteConfirm={setDeleteConfirm}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Notifications
              notifications={notifications}
              setModalNotification={setModalNotification}
              setModalOpen={setModalOpen}
              modalNotification={modalNotification}
              modalOpen={modalOpen}
              toggleNotificationRead={toggleNotificationRead}
              markAllAsRead={markAllAsRead}
              loadingTab={loadingTab}
            />
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && <SettingsTab loadingTab={loadingTab} />}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog.Root
          open={!!deleteConfirm}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
              <div className="relative w-full mx-auto animate-scale-in">
                {/* Enhanced modal with gradient border effect */}
                <div className="relative bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
                  {/* Gradient header */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-500 overflow-hidden">
                    {/* Animated background blobs */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>

                    {/* Icon container */}
                    <div className="relative h-full flex items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md">
                        <Trash2 className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-4">
                    <div className="text-center space-y-2">
                      <Dialog.Title className="text-2xl font-black text-gray-900">
                        {"Bloqu Sil"}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-gray-600 leading-relaxed px-2">
                        {`"${deleteConfirm.title}" bloqu silmək istədiyinə əminsən? Bu əməliyyatı geri qaytarmaq mümkün deyil.`}
                      </Dialog.Description>
                    </div>

                    {/* Warning badge */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-xs text-amber-800 font-medium">
                        {
                          "Bu əməliyyatı geri qaytarmaq mümkün deyil. Bütün məlumatlar daimi silinəcək."
                        }
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                      <Dialog.Close asChild>
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto order-2 sm:order-1"
                        >
                          {"Ləğv et"}
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={() => deleteBlog(deleteConfirm.id)}
                        disabled={deleteBlogMutation.isPending}
                        variant="danger"
                        className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500"
                      >
                        {deleteBlogMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            {"Silinir..."}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {"Sil"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const localePath = useLocalizedPath();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
