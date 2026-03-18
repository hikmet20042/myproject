"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  ChevronDown,
  Calendar,
  GraduationCap,
  Briefcase,
  Tag,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Bell,
  Send,
  AlertCircle,
  Settings,
  Save,
  RotateCcw,
  History,
  BookOpen,
  Building,
  FileText,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { Tabs } from "@/components/ui/Tabs";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { LoadingState, ImageUpload } from "@/components/shared";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationTypes";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableMaterialRow from "@/components/admin/DraggableMaterialRow";
import Image from "next/image";
const BlocknoteReadOnly = dynamic(
  () => import("@/components/BlocknoteReadOnly"),
  { ssr: false },
);

type Blog = {
  _id: string;
  title: string;
  content: string;
  contentHtml: string;
  abstract?: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  author?: string;
  isAnonymous?: boolean;
  createdAt: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
  createdAt: string;

  profile?: { bio?: string; location?: string; occupation?: string };
  stats?: { blogs: number };
};

type Organization = {
  _id: string;
  organizationName: string;
  organizationType?: string;
  email: string;
  description: string;
  website?: string;
  contactPhone?: string;
  address?: string;
  registrationNumber?: string;
  focusAreas?: string[];
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: { _id: string; name: string; email: string };
  adminComment?: string;
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Notification = {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
};

type Material = {
  _id: string;
  title: string;
  description: string;
  category:
    | "toolkit"
    | "course"
    | "video"
    | "guide"
    | "document"
    | "emergency"
    | "other";
  type: string;
  url: string;
  imageUrl?: string;
  provider?: string;
  duration?: string;
  language: string[];
  tags: string[];
  featured: boolean;
  isPublished: boolean;
  order: number;
  views: number;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

type SiteSettings = {
  _id: string;
  siteInfo: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logoUrl?: string;
    faviconUrl?: string;
    contactEmail: string;
    supportEmail: string;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  contentPolicies: {
    requireApproval: boolean;
    autoApproveVerifiedUsers: boolean;
    maxArticleLength: number;
    maxBlogLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
    moderationKeywords: string[];
    bannedWords: string[];
    enableProfanityFilter: boolean;
    enableSpamDetection: boolean;
  };
  userManagement: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: "user" | "contributor";
    maxUsersPerDay: number;
    enableUserSuspension: boolean;
    suspensionReasons: string[];
    enableUserDeletion: boolean;
    dataRetentionDays: number;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    emailProvider: "smtp" | "sendgrid" | "mailgun";
    emailConfig: {
      host?: string;
      port?: number;
      secure?: boolean;
      username?: string;
      password?: string;
      apiKey?: string;
    };
    defaultNotificationSettings: {
      articleApproved: boolean;
      articleRejected: boolean;
      newFollower: boolean;
      systemUpdates: boolean;
    };
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableCaptcha: boolean;
    captchaProvider: "recaptcha" | "hcaptcha";
    captchaConfig: { siteKey?: string; secretKey?: string };
    enableRateLimit: boolean;
    rateLimitConfig: { windowMs: number; maxRequests: number };
  };
  features: {
    enableComments: boolean;
    enableLikes: boolean;
    enableSharing: boolean;
    enableBookmarks: boolean;
    enableFollowing: boolean;

    enableCollaboration: boolean;
    enableVersioning: boolean;
    enableAI: boolean;
    enableTranslation: boolean;
  };
  lastUpdated: string;
  updatedBy: { _id: string; name: string; email: string };
  version: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const accountType = session?.user?.accountType;
  const role = session?.user?.role;
  const isAdmin = role === "admin";
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || null;
  const [activeTab, setActiveTab] = useState("blogs");
  const [blogs, setBlogs] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Blog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const localePath = useLocalizedPath();
  const [adminComment, setAdminComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // User management states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userPagination, setUserPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    verified: 0,
    admin: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userAction, setUserAction] = useState<"role" | "delete" | null>(null);

  // Content management states
  const [contentSearch, setContentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("");

  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "approve" | "reject" | "delete" | null
  >(null);
  const [bulkComment, setBulkComment] = useState("");
  const [availableFilters, setAvailableFilters] = useState<{
    tags: string[];
    authors: Array<{ id: string; name: string }>;
  }>({ tags: [], authors: [] });
  const [showFilters, setShowFilters] = useState(false);

  // Notification management states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<{
    total: number;
    unread: number;
    read: number;
    today: number;
  }>({ total: 0, unread: 0, read: 0, today: 0 });
  const [organizationStats, setOrganizationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [organizationPagination, setOrganizationPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showOrganizationDetailModal, setShowOrganizationDetailModal] =
    useState(false);
  const [organizationAction, setOrganizationAction] = useState<
    "approve" | "reject" | null
  >(null);

  // Event management states (unified for all event types)
  const [events, setEvents] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [eventPagination, setEventPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventAction, setEventAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [eventRejectionReason, setEventRejectionReason] = useState("");

  // Material management states
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialStats, setMaterialStats] = useState({
    total: 0,
    published: 0,
    unpublished: 0,
    featured: 0,
  });
  const [materialPagination, setMaterialPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showMaterialFormModal, setShowMaterialFormModal] = useState(false);
  const [materialAction, setMaterialAction] = useState<
    "edit" | "delete" | null
  >(null);
  const [materialFormData, setMaterialFormData] = useState<Partial<Material>>({
    title: "",
    description: "",
    category: "other",
    type: "",
    url: "",
    imageUrl: "",
    provider: "",
    duration: "",
    language: ["en"],
    tags: [],
    featured: false,
    isPublished: true,
    order: 0,
  });
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");

  // Vacancy management states
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [vacancyStats, setVacancyStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [vacancyPagination, setVacancyPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [selectedVacancy, setSelectedVacancy] = useState<any | null>(null);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [vacancyAction, setVacancyAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [vacancyRejectionReason, setVacancyRejectionReason] = useState("");

  const [notificationPagination, setNotificationPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [notificationFilters, setNotificationFilters] = useState({
    type: "all",
    userId: "",
    isRead: "all",
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    type: "announcement",
    title: "",
    message: "",
    targetUsers: "all",
    target: "all",
    userIds: "",
  });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<
    string | null
  >(null);

  // Settings management states
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] =
    useState("siteInfo");
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsHistory, setSettingsHistory] = useState<any[]>([]);
  const [showSettingsHistory, setShowSettingsHistory] = useState(false);

  useEffect(() => {
    console.debug("[admin-page] mount");
    return () => {
      console.debug("[admin-page] unmount");
    };
  }, []);

  // Load functions - defined before useEffect hooks
  const loadSubmissions = async () => {
    setTabLoading(true);
    try {
      if (activeTab === "blogs") {
        await loadBlogs();
      } else if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "organizations") {
        await loadOrganizations();
      } else if (activeTab === "events") {
        await loadEvents();
      } else if (activeTab === "vacancies") {
        await loadVacancies();
      } else if (activeTab === "notifications") {
        await loadNotifications();
      } else if (activeTab === "materials") {
        await loadMaterials();
      } else if (activeTab === "settings") {
        await loadSettings();
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  };

  // Ensure we load data when the user session is ready and when the active tab changes.
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "authenticated" && !userId) {
      console.debug("[auth-guard][admin-page] authenticated but userId not ready");
      return;
    }

    if (status === "authenticated" && accountType === undefined) {
      console.debug("[auth-guard][admin-page] authenticated but accountType not ready", {
        userId,
      });
      return;
    }

    if (status === "authenticated" && role === undefined) {
      console.debug("[auth-guard][admin-page] authenticated but role not ready", {
        userId,
      });
      return;
    }

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }

    if (status === "unauthenticated") {
      // AdminLayout handles redirect. Keep page guard passive to avoid redirect races.
      console.debug(
        "[auth-guard][admin-page] waiting for layout redirect (unauthenticated)",
      );
      return;
    }

    if (status === "authenticated" && isAdmin === false) {
      // AdminLayout handles redirect for non-admin users.
      console.debug(
        "[auth-guard][admin-page] waiting for layout redirect (non-admin)",
        {
          userId,
        },
      );
      return;
    }

    if (status === "authenticated" && isAdmin) {
      console.debug("[auth-guard][admin-page] fully ready -> loading admin data", {
        userId,
        activeTab,
        accountType,
      });
      console.debug("[admin-page] fetch trigger", {
        reason: "auth-ready",
        activeTab,
      });
      setLoading(true);
      loadSubmissions();
      // Load organization stats on initial load for the badge
      loadOrganizationStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType, activeTab, isAdmin, role, status, tabParam, userId]);

  const loadBlogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        sortBy,
        sortOrder,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(contentSearch && { search: contentSearch }),
        ...(authorFilter && { author: authorFilter }),

        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter }),
      });

      const response = await fetch(`/api/admin/blogs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.results || []);
        setAvailableFilters(data.filters || { tags: [], authors: [] });
      }
    } catch (error) {
      console.error("Error loading blogs:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userPagination.page.toString(),
        limit: "20",
        ...(userSearch && { search: userSearch }),
        ...(userRoleFilter !== "all" && { role: userRoleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setUserPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total || 0,
        });

        // Set user stats from API response
        if (data.stats) {
          setUserStats({
            total: data.stats.total || 0,
            verified: data.stats.verified || 0,
            admin: data.stats.admin || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadOrganizationStats = async () => {
    try {
      // Load just the stats without full organization list
      const response = await fetch("/api/admin/organizations?limit=1");
      if (response.ok) {
        const data = await response.json();
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
      }
    } catch (error) {
      console.error("Error loading organization stats:", error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const params = new URLSearchParams({
        page: organizationPagination.page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams({
        page: eventPagination.page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEventStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setEventPagination({
          page: data.pagination.page,
          totalPages: data.pagination.pages,
        });
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({
        page: notificationPagination.page.toString(),
        limit: "20",
        ...(notificationFilters.type !== "all" && {
          type: notificationFilters.type,
        }),
        ...(notificationFilters.userId && {
          userId: notificationFilters.userId,
        }),
        ...(notificationFilters.isRead !== "all" && {
          isRead: notificationFilters.isRead,
        }),
      });

      const response = await fetch(`/api/admin/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setNotificationStats(
          data.stats || { total: 0, unread: 0, read: 0, today: 0 },
        );
        setNotificationPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert("Zəhmət olmasa lazım olan bütün sahələri doldurun");
      return;
    }

    setSendingAnnouncement(true);
    try {
      if (editingAnnouncementId) {
        // Edit existing announcement
        const response = await fetch("/api/admin/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: editingAnnouncementId,
            editAnnouncement: true,
            title: announcementForm.title,
            message: announcementForm.message,
          }),
        });

        if (response.ok) {
          alert("Elan uğurla yeniləndi");
          setEditingAnnouncementId(null);
        } else {
          const error = await response.json();
          alert(error.error || "Elanı yeniləmək alınmadı");
        }
      } else {
        // Create new announcement
        const targetUsers =
          announcementForm.targetUsers === "specific"
            ? announcementForm.userIds
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean)
            : announcementForm.targetUsers;
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: announcementForm.type,
            title: announcementForm.title,
            message: announcementForm.message,
            targetUsers,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Elan ${data.count} istifadəçiyə göndərildi`);
        } else {
          const error = await response.json();
          alert(error.error || "Elanı göndərmək alınmadı");
        }
      }

      setShowAnnouncementModal(false);
      setAnnouncementForm({
        type: "announcement",
        title: "",
        message: "",
        targetUsers: "all",
        target: "all",
        userIds: "",
      });
      loadNotifications();
    } catch (error) {
      console.error("Error with announcement:", error);
      alert("Elanı emal edərkən xəta baş verdi");
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm("Bu bildirişi silmək istədiyinizə əminsiniz?")) return;

    try {
      const response = await fetch(
        `/api/admin/notifications?id=${notificationId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        loadNotifications();
      } else {
        alert("Silmə Alınmadı");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Silmə Alınmadı");
    }
  };

  const markNotificationAsRead = async (
    notificationId: string,
    isRead: boolean,
  ) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead }),
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  // Settings management functions
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSavingSettings(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsChanged(false);
        alert("Parametrlər uğurla yadda saxlandı!");
      } else {
        const error = await response.json();
        alert(error.error || "Parametrləri yadda saxlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Parametrləri yadda saxlamaq alınmadı");
    } finally {
      setSavingSettings(false);
    }
  };

  const resetSettings = async (section?: string) => {
    const confirmMessage = section
      ? `{{section}} parametrlərini varsayılanlara sıfırlamaq istədiyinizə əminsiniz?`
      : "Bütün parametrləri varsayılanlara sıfırlamaq istədiyinizə əminsiniz?";

    if (!confirm(confirmMessage)) return;

    try {
      const endpoint = section
        ? `/api/admin/settings?section=${encodeURIComponent(section)}`
        : "/api/admin/settings";
      const response = await fetch(endpoint, { method: "DELETE" });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsChanged(false);
        alert("Parametrlər uğurla sıfırlandı!");
      } else {
        const error = await response.json();
        alert(error.error || "Parametrləri sıfırlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      alert("Parametrləri sıfırlamaq alınmadı");
    }
  };

  const loadSettingsHistory = async () => {
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH" });

      if (response.ok) {
        const data = await response.json();
        setSettingsHistory(data.history || []);
        setShowSettingsHistory(true);
      }
    } catch (error) {
      console.error("Error loading settings history:", error);
    }
  };

  const updateSettingsField = (section: string, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...(settings[section as keyof SiteSettings] as Record<string, any>),
        [field]: value,
      },
    });
    setSettingsChanged(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleReview = (item: Blog) => {
    setSelectedItem(item);
    setAdminComment(item.adminComment || "");
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const endpoint = "/api/admin/blogs";
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem._id,
          status: "approved",
          adminComment: adminComment.trim() || null,
        }),
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment("");
        loadSubmissions();
      }
    } catch (error) {
      console.error("Error approving item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!adminComment.trim()) {
      alert("Zəhmət olmasa rədd etmə səbəbini daxil edin");
      return;
    }
    setIsProcessing(true);
    try {
      const endpoint = "/api/admin/blogs";
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem._id,
          status: "rejected",
          adminComment: adminComment.trim(),
        }),
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment("");
        loadSubmissions();
      }
    } catch (error) {
      console.error("Error rejecting item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getByStatus = (arr: any[], status: string) =>
    arr.filter((s) => s.status === status);

  // User management functions
  const handleUserAction = (user: User, action: "role" | "delete") => {
    setSelectedUser(user);
    setUserAction(action);
    setShowUserModal(true);
  };

  const executeUserAction = async () => {
    if (!selectedUser || !userAction) return;
    setIsProcessing(true);

    try {
      let endpoint = "/api/admin/users";
      let method = "PUT";
      let body: any = { userId: selectedUser._id };

      switch (userAction) {
        case "role":
          body.action = "updateRole";
          body.updates = { role: selectedUser.role };
          break;

        case "delete":
          method = "DELETE";
          endpoint = `/api/admin/users?userId=${selectedUser._id}`;
          body = undefined;
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) }),
      });

      if (response.ok) {
        setShowUserModal(false);
        setSelectedUser(null);
        setUserAction(null);
        await loadUsers();
      }
    } catch (error) {
      console.error("Error executing user action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserSearch = async () => {
    setUserPagination({ page: 1, totalPages: 1, total: 0 });
    await loadUsers();
  };

  const handleUserPageChange = async (page: number) => {
    // Update pagination state first
    setUserPagination((prev) => ({ ...prev, page }));

    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(userSearch && { search: userSearch }),
        ...(userRoleFilter !== "all" && { role: userRoleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setUserPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  // Organization management functions
  const handleOrganizationAction = (
    organization: any,
    action: "approve" | "reject",
  ) => {
    setSelectedOrganization(organization);
    setOrganizationAction(action);
    setShowOrganizationModal(true);
  };

  const executeOrganizationAction = async () => {
    if (!selectedOrganization || !organizationAction) return;
    setIsProcessing(true);

    try {
      const body: any = {
        organizationId: selectedOrganization._id,
        action: organizationAction,
      };

      if (organizationAction === "reject" && adminComment.trim()) {
        body.rejectionReason = adminComment.trim();
      }

      const response = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowOrganizationModal(false);
        setSelectedOrganization(null);
        setOrganizationAction(null);
        setAdminComment("");
        await loadOrganizations();
      }
    } catch (error) {
      console.error("Error executing organization action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrganizationPageChange = async (page: number) => {
    // Update pagination state first
    setOrganizationPagination((prev) => ({ ...prev, page }));

    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  // Event management functions
  const handleEventAction = (event: any, action: "approve" | "reject") => {
    setSelectedEvent(event);
    setEventAction(action);
    setShowEventModal(true);
  };

  const executeEventAction = async () => {
    if (!selectedEvent || !eventAction) return;
    setIsProcessing(true);

    try {
      const body: any = { action: eventAction };

      if (eventAction === "reject" && eventRejectionReason.trim()) {
        body.adminComment = eventRejectionReason.trim();
      }

      const response = await fetch(`/api/admin/events/${selectedEvent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowEventModal(false);
        setSelectedEvent(null);
        setEventAction(null);
        setEventRejectionReason("");
        await loadEvents();
      }
    } catch (error) {
      console.error("Error executing event action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEventPageChange = async (page: number) => {
    // Update pagination state first
    setEventPagination((prev) => ({ ...prev, page }));

    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEventStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setEventPagination({
          page: data.pagination.page,
          totalPages: data.pagination.pages,
        });
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  // Vacancy management functions
  const handleVacancyAction = (vacancy: any, action: "approve" | "reject") => {
    setSelectedVacancy(vacancy);
    setVacancyAction(action);
    setShowVacancyModal(true);
  };

  const executeVacancyAction = async () => {
    if (!selectedVacancy || !vacancyAction) return;
    setIsProcessing(true);

    try {
      const body: any = { action: vacancyAction };

      if (vacancyAction === "reject" && vacancyRejectionReason.trim()) {
        body.adminComment = vacancyRejectionReason.trim();
      }

      const response = await fetch(`/api/vacancies/${selectedVacancy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowVacancyModal(false);
        setSelectedVacancy(null);
        setVacancyAction(null);
        setVacancyRejectionReason("");
        await loadVacancies();
      }
    } catch (error) {
      console.error("Error executing vacancy action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVacancyPageChange = async (page: number) => {
    // Update pagination state first
    setVacancyPagination((prev) => ({ ...prev, page }));

    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: "true",
      });

      if (contentSearch.trim()) {
        params.append("search", contentSearch.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/vacancies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10,
        });
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading vacancies:", error);
    }
  };

  const loadVacancies = async () => {
    try {
      const params = new URLSearchParams({
        page: vacancyPagination.page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: "true",
      });

      if (contentSearch.trim()) {
        params.append("search", contentSearch.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/vacancies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10,
        });
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading vacancies:", error);
    }
  };

  const loadMaterials = async () => {
    try {
      setTabLoading(true);
      const params = new URLSearchParams({
        page: materialPagination.page.toString(),
        limit: "20",
      });

      if (materialSearch.trim()) {
        params.append("search", materialSearch.trim());
      }

      if (materialCategoryFilter !== "all") {
        params.append("category", materialCategoryFilter);
      }

      const response = await fetch(`/api/admin/materials?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
        setMaterialPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
        });

        // Calculate stats
        if (data.stats) {
          setMaterialStats({
            total: data.stats.total || 0,
            published: data.stats.published || 0,
            unpublished: data.stats.unpublished || 0,
            featured: data.stats.featured || 0,
          });
        } else {
          const published = data.materials.filter(
            (m: Material) => m.isPublished,
          ).length;
          const featured = data.materials.filter(
            (m: Material) => m.featured,
          ).length;
          setMaterialStats({
            total: data.total || 0,
            published,
            unpublished: Math.max((data.total || 0) - published, 0),
            featured,
          });
        }
      }
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setTabLoading(false);
    }
  };

  // Delete functions for events, vacancies, organizations, and blogs
  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Bu tədbiri həmişəlik silmək istədiyinə əminsən? Bu əməliyyat geri qaytarılmır.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadEvents();
      } else {
        alert("Tədbiri silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Tədbiri silmək alınmadı");
    }
  };

  const handleDeleteVacancy = async (vacancyId: string) => {
    if (
      !confirm(
        "Bu vakansiyanı həmişəlik silmək istədiyinə əminsən? Bu əməliyyat geri qaytarılmır.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadVacancies();
      } else {
        alert("Vakansiyanı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      alert("Vakansiyanı silmək alınmadı");
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    if (
      !confirm(
        "Bu təşkilat qeydiyyatını həmişəlik silmək istədiyinə əminsən? Bu əməliyyat geri qaytarılmır.",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await loadOrganizations();
      } else {
        alert("Təşkilatı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Təşkilatı silmək alınmadı");
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (
      !confirm(
        "Bu bloqu həmişəlik silmək istədiyinə əminsən? Bu əməliyyat geri qaytarılmır.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadSubmissions();
      } else {
        alert("Bloqu silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Bloqu silmək alınmadı");
    }
  };

  // Material CRUD functions
  const handleCreateMaterial = () => {
    setMaterialFormData({
      title: "",
      description: "",
      category: "other",
      type: "",
      url: "",
      imageUrl: "",
      provider: "",
      duration: "",
      language: ["en"],
      tags: [],
      featured: false,
      isPublished: true,
      order: 0,
    });
    setSelectedMaterial(null);
    setShowMaterialFormModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setMaterialFormData(material);
    setSelectedMaterial(material);
    setShowMaterialFormModal(true);
  };

  const handleSaveMaterial = async () => {
    if (
      !materialFormData.title ||
      !materialFormData.description ||
      !materialFormData.category ||
      !materialFormData.type ||
      !materialFormData.url
    ) {
      alert(
        "Zəhmət olmasa tələb olunan xanaları doldurun: başlıq, təsvir, kateqoriya, növ və URL",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const url = selectedMaterial
        ? `/api/materials/${selectedMaterial._id}`
        : "/api/materials";
      const method = selectedMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialFormData),
      });

      if (response.ok) {
        setShowMaterialFormModal(false);
        setSelectedMaterial(null);
        await loadMaterials();
        alert(
          selectedMaterial
            ? "Material uğurla yeniləndi"
            : "Material uğurla yaradıldı",
        );
      } else {
        const error = await response.json();
        alert(error.error || "Materialı yadda saxlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error saving material:", error);
      alert("Materialı yadda saxlamaq alınmadı");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (
      !confirm(
        "Bu materialı silmək istədiyinə əminsən? Bu əməliyyat geri qaytarılmır.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadMaterials();
        alert("Material uğurla silindi");
      } else {
        alert("Materialı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Materialı silmək alınmadı");
    }
  };

  const handleToggleMaterialPublish = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...material,
          isPublished: !material.isPublished,
        }),
      });

      if (response.ok) {
        await loadMaterials();
      } else {
        alert("Yayım statusunu dəyişmək alınmadı");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Yayım statusunu dəyişmək alınmadı");
    }
  };

  const handleToggleMaterialFeatured = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...material, featured: !material.featured }),
      });

      if (response.ok) {
        await loadMaterials();
      } else {
        alert("Önə çıxarma statusunu dəyişmək alınmadı");
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
      alert("Önə çıxarma statusunu dəyişmək alınmadı");
    }
  };

  // Bulk operations
  const handleBulkAction = (action: "approve" | "reject" | "delete") => {
    if (selectedItems.length === 0) return;
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;
    setIsProcessing(true);

    try {
      const endpoint = "/api/admin/blogs";
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `bulk_${bulkAction}`,
          storyIds: selectedItems,
          ...(bulkAction === "reject" &&
            bulkComment.trim() && { adminComment: bulkComment.trim() }),
        }),
      });

      if (response.ok) {
        setShowBulkModal(false);
        setBulkAction(null);
        setBulkComment("");
        setSelectedItems([]);
        loadSubmissions();
      }
    } catch (error) {
      console.error("Error executing bulk action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const currentItems = blogs;
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map((item: Blog) => item._id));
    }
  };

  const clearFilters = () => {
    setContentSearch("");
    setStatusFilter("all");
    setAuthorFilter("");

    setDateFromFilter("");
    setDateToFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  if (loading) {
    return <LoadingState text={"İdarəetmə paneli yüklənir..."} />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Admin Header */}
      <div className="rounded-3xl border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <Container size="xl" padding="none">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {"İdarəetmə Paneli"}
                  </h1>
                  <p className="text-gray-600">{"Məzmun İdarəetmə Sistemi"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{"Sistem Aktiv"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {session?.user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {session?.user?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" padding="lg">
        <div className="py-6">
          {/* Enhanced Tab Navigation */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <nav className="flex flex-nowrap">
              <button
                onClick={() => handleTabChange("blogs")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "blogs"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {"Bloqlar"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {getByStatus(blogs, "pending").length > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {getByStatus(blogs, "pending").length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange("users")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                {"İstifadəçilər"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center"></div>
              </button>
              <button
                onClick={() => handleTabChange("organizations")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "organizations"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Building className="w-4 h-4 mr-2" />
                {"Təşkilatlar"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {organizationStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {organizationStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange("events")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "events"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {"Tədbirlər"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {eventStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {eventStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange("vacancies")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "vacancies"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                {"Vakansiyalar"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {vacancyStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {vacancyStats.pending}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTabChange("materials")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "materials"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                {"Materiallar"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {materialStats.total > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {materialStats.total}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTabChange("notifications")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "notifications"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Bell className="w-4 h-4 mr-2" />
                {"Bildirişlər"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {notificationStats.unread > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {notificationStats.unread}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange("settings")}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === "settings"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                {"Parametrlər"}
                <div className="ml-2 w-6 h-4 flex items-center justify-center"></div>
              </button>
            </nav>
          </div>

          {/* Blogs Tab */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              {/* Enhanced Search and Filter Controls */}
              <div
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                data-announcement-form
              >
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={
                          "Başlıq, məzmun və ya etiketlər üzrə bloq axtar..."
                        }
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="md"
                    className="flex items-center gap-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    <Filter className="w-4 h-4" />
                    {"Filterlər"}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {"Status"}
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="all">{"Bütün Statuslar"}</option>
                        <option value="pending">{"Gözləmədə"}</option>
                        <option value="approved">{"Təsdiqlənmiş"}</option>
                        <option value="rejected">{"Rədd Edilmiş"}</option>
                      </select>
                    </div>

                    {/* Author Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {"Müəllif"}
                      </label>
                      <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">{"Bütün Müəlliflər"}</option>
                        {availableFilters.authors.map((author) => (
                          <option key={author.id} value={author.id}>
                            {author.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {"Sırala"}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="createdAt">{"Tarix"}</option>
                          <option value="title">{"Başlıq"}</option>
                          <option value="author">{"Müəllif"}</option>
                        </select>
                        <Button
                          onClick={() =>
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          }
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                        >
                          {sortOrder === "asc" ? (
                            <SortAsc className="w-4 h-4" />
                          ) : (
                            <SortDesc className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {"Tarix Aralığı"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <span className="self-center text-gray-500">
                          {"dən"}
                        </span>
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="md"
                        className="w-full text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-600 transition-all"
                      >
                        {"Hamısını Təmizlə"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mt-4">
                    <span className="text-sm font-medium text-blue-800">
                      {`element seçildi`}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBulkAction("approve")}
                        variant="primary"
                        size="sm"
                      >
                        {"Təsdiq Et"}
                      </Button>
                      <Button
                        onClick={() => handleBulkAction("reject")}
                        variant="danger"
                        size="sm"
                      >
                        {"Rədd Et"}
                      </Button>
                      <Button
                        onClick={() => handleBulkAction("delete")}
                        variant="secondary"
                        size="sm"
                      >
                        {"Sil"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Blogs List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {`Bloqlar (${blogs.length})`}
                  </h2>
                  {blogs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === blogs.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-600">
                        {"Hamısını Seç"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-6 py-6">
                  {blogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {"Bloq tapılmadı"}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {blogs.map((blog) => (
                        <div
                          key={blog._id}
                          className={`border border-gray-200 rounded-xl p-6 transition-all ${selectedItems.includes(blog._id) ? "bg-blue-50 border-blue-300" : "bg-gray-50 hover:shadow-md"}`}
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(blog._id)}
                              onChange={() => toggleItemSelection(blog._id)}
                              className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                    blog.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : blog.status === "approved"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {blog.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {"tərəfindən"}{" "}
                                  {blog.isAnonymous ? (
                                    "Anonim"
                                  ) : blog.author?._id ? (
                                    <Link
                                      href={`/profile/${blog.author._id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      target="_blank"
                                    >
                                      {blog.author.name ||
                                        blog.author.email ||
                                        "Naməlum"}
                                    </Link>
                                  ) : (
                                    blog.author?.name ||
                                    blog.author ||
                                    "Naməlum"
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    blog.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {blog.title}
                              </h3>
                              {blog.abstract && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {blog.abstract}
                                </p>
                              )}

                              {blog.adminComment && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                  <p className="text-sm font-medium text-red-800 mb-1">
                                    {"İdarəçi şərhi"}:
                                  </p>
                                  <p className="text-sm text-red-700">
                                    {blog.adminComment}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={localePath(
                                  `/admin/preview/blog/${blog._id}`,
                                )}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                {"Önizləmə"}
                              </Link>
                              {blog.status !== "pending" && (
                                <Button
                                  onClick={() => handleDeleteBlog(blog._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {"Sil"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Cəmi İstifadəçilər"}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {userStats.total}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Təsdiqlənmiş İstifadəçilər"}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {userStats.verified}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-cyan-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Admin İstifadəçiləri"}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {userStats.admin}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* User Search and Filter Controls */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={"Ad və ya e-poçt ilə istifadəçi axtar..."}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleUserSearch()
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{"Bütün Rollar"}</option>
                      <option value="user">{"İstifadəçilər"}</option>
                      <option value="admin">{"İdarəçi"}</option>
                    </select>
                    <Button
                      onClick={handleUserSearch}
                      variant="primary"
                      size="md"
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {"Axtar"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {"İstifadəçi İdarəetməsi"}{" "}
                    <span className="ml-2 text-base font-normal text-gray-500">
                      ({`${userPagination.total} istifadəçi`})
                    </span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {"İstifadəçi tapılmadı"}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div
                          key={user._id}
                          className="border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  user.role === "admin"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role.charAt(0).toUpperCase() +
                                  user.role.slice(1)}
                              </span>

                              {user.emailVerified && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {"Təsdiqlənmiş"}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {user.email}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>
                                {"Bloqlar"}: {user.stats?.blogs || 0}
                              </span>
                              <span>
                                {"Qoşulma tarixi"}:{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {user.profile?.bio && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {user.profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => handleUserAction(user, "role")}
                              variant="secondary"
                              size="sm"
                              className="inline-flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {"Rolu Redaktə Et"}
                            </Button>

                            <Button
                              onClick={() => handleUserAction(user, "delete")}
                              variant="danger"
                              size="sm"
                              className="inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {"Sil"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {userPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {"Səhifə"} {userPagination.page} {"/"}{" "}
                        {userPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleUserPageChange(userPagination.page - 1)
                          }
                          disabled={userPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {"Əvvəlki"}
                        </Button>
                        <Button
                          onClick={() =>
                            handleUserPageChange(userPagination.page + 1)
                          }
                          disabled={
                            userPagination.page === userPagination.totalPages
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {"Növbəti"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organizations Tab */}
          {activeTab === "organizations" && (
            <div className="space-y-6">
              {/* Organization Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Gözləmədə"}
                      </p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {organizationStats.pending}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Təsdiqlənmiş"}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {organizationStats.approved}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Rədd Edilmiş"}
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {organizationStats.rejected}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Cəmi Təşkilatlar"}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {organizationStats.total}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Organization Search and Filter Controls */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={
                          "Ad, təşkilat və ya e-poçt ilə Təşkilat axtar..."
                        }
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{"Bütün Statuslar"}</option>
                      <option value="pending">{"Gözləmədə"}</option>
                      <option value="approved">{"Təsdiqlənmiş"}</option>
                      <option value="rejected">{"Rədd Edilmiş"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Organization List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {"Təşkilat Qeydiyyatları"}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {organizations.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {"Təşkilat tapılmadı"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {"Filterlərə uyğun Təşkilat qeydiyyatı yoxdur."}
                      </p>
                    </div>
                  ) : (
                    organizations.map((organization) => {
                      const status = organization.status || "pending";
                      return (
                        <div
                          key={organization._id}
                          className="px-6 py-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {status === "approved" ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : status === "rejected" ? (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Clock className="w-3 h-3 mr-1" />
                                  )}
                                  {status === "approved"
                                    ? "Təsdiqlənmiş"
                                    : status === "rejected"
                                      ? "Rədd Edilmiş"
                                      : "Gözləmədə"}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                {organization.organizationName}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {organization.email}
                              </p>
                              <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                {organization.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  {"Qeydiyyat tarixi"}:{" "}
                                  {new Date(
                                    organization.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                {organization.focusAreas &&
                                  organization.focusAreas.length > 0 && (
                                    <span>
                                      {organization.focusAreas.length}{" "}
                                      {"Fəaliyyət Sahələri"}
                                    </span>
                                  )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Button
                                onClick={() => {
                                  setSelectedOrganization(organization);
                                  setShowOrganizationDetailModal(true);
                                }}
                                variant="secondary"
                                size="sm"
                                className="inline-flex items-center whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {"Ətraflı Bax"}
                              </Button>
                              {status === "pending" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      handleOrganizationAction(
                                        organization,
                                        "approve",
                                      )
                                    }
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center whitespace-nowrap"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {"Təsdiq Et"}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleOrganizationAction(
                                        organization,
                                        "reject",
                                      )
                                    }
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center whitespace-nowrap"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {"Rədd Et"}
                                  </Button>
                                </>
                              )}
                              {status !== "pending" && (
                                <Button
                                  onClick={() =>
                                    handleDeleteOrganization(organization._id)
                                  }
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center whitespace-nowrap"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {"Sil"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Organization Pagination */}
                {organizationPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {"Səhifə"} {organizationPagination.page} {"/"}{" "}
                        {organizationPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleOrganizationPageChange(
                              organizationPagination.page - 1,
                            )
                          }
                          disabled={organizationPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {"Əvvəlki"}
                        </Button>
                        <Button
                          onClick={() =>
                            handleOrganizationPageChange(
                              organizationPagination.page + 1,
                            )
                          }
                          disabled={
                            organizationPagination.page ===
                            organizationPagination.totalPages
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {"Növbəti"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div className="space-y-6">
              {/* Event Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Gözləmədə"}
                      </p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {eventStats.pending}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Təsdiqlənmiş"}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {eventStats.approved}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Rədd Edilmiş"}
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {eventStats.rejected}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Cəmi Tədbirlər"}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {eventStats.total}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Event Search and Filter Controls */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={
                          "Başlıq, təşkilat və ya təsvir üzrə tədbir axtar..."
                        }
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{"Bütün Statuslar"}</option>
                      <option value="pending">{"Gözləmədə"}</option>
                      <option value="approved">{"Təsdiqlənmiş"}</option>
                      <option value="rejected">{"Rədd Edilmiş"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Event List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {"Tədbir Təqdimləri"}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {events.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {"Tədbir tapılmadı"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {"Filterlərə uyğun tədbir təqdimatı yoxdur."}
                      </p>
                    </div>
                  ) : (
                    events.map((event) => {
                      const status = event.status || "pending";
                      return (
                        <div
                          key={event._id}
                          className="px-6 py-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {status === "approved" ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : status === "rejected" ? (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Clock className="w-3 h-3 mr-1" />
                                  )}
                                  {status === "approved"
                                    ? "Təsdiqlənmiş"
                                    : status === "rejected"
                                      ? "Rədd Edilmiş"
                                      : "Gözləmədə"}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                  {event.eventType || "Tədbir"}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {event.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {event.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {event.description?.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>
                                  {"Təşkilatçı"}:{" "}
                                  {event.organizationName || "Naməlum"}
                                </span>
                                <span>•</span>
                                <span>
                                  {"Tarix"}:{" "}
                                  {new Date(
                                    event.eventDate,
                                  ).toLocaleDateString()}
                                </span>
                                {event.endDate && (
                                  <>
                                    <span>-</span>
                                    <span>
                                      {new Date(
                                        event.endDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span>
                                  {"Yer"}:{" "}
                                  {event.location?.type || "Naməlum məkan"}
                                </span>
                              </div>
                              {event.adminComment && status === "rejected" && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm text-red-700">
                                    <strong>{"İdarəçi şərhi"}:</strong>{" "}
                                    {event.adminComment}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {status === "pending" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      handleEventAction(event, "approve")
                                    }
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {"Təsdiq Et"}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleEventAction(event, "reject")
                                    }
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {"Rədd Et"}
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() =>
                                  window.open(
                                    localePath(
                                      `/admin/preview/events/${event._id}`,
                                    ),
                                    "_blank",
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center text-xs"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {"Bax"}
                              </Button>
                              {status !== "pending" && (
                                <Button
                                  onClick={() => handleDeleteEvent(event._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center text-xs"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {"Sil"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Event Pagination */}
                {eventPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {"Səhifə"} {eventPagination.page} {"/"}{" "}
                        {eventPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleEventPageChange(eventPagination.page - 1)
                          }
                          disabled={eventPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {"Əvvəlki"}
                        </Button>
                        <Button
                          onClick={() =>
                            handleEventPageChange(eventPagination.page + 1)
                          }
                          disabled={
                            eventPagination.page === eventPagination.totalPages
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {"Növbəti"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vacancies Tab */}
          {activeTab === "vacancies" && (
            <div className="space-y-6">
              {/* Vacancy Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Gözləmədə"}
                      </p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {vacancyStats.pending}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Təsdiqlənmiş"}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {vacancyStats.approved}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Rədd Edilmiş"}
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {vacancyStats.rejected}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {"Cəmi Vakansiyalar"}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {vacancyStats.total}
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Vacancy Search and Filter Controls */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={
                          "Başlıq, təşkilat və ya təsvir üzrə vakansiya axtar..."
                        }
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{"Bütün Statuslar"}</option>
                      <option value="pending">{"Gözləmədə"}</option>
                      <option value="approved">{"Təsdiqlənmiş"}</option>
                      <option value="rejected">{"Rədd Edilmiş"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vacancy List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {"Vakansiya Təqdimləri"}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {vacancies.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {"Vakansiya tapılmadı"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {"Filterlərə uyğun vakansiya təqdimatı yoxdur."}
                      </p>
                    </div>
                  ) : (
                    vacancies.map((vacancy) => {
                      const status = vacancy.status || "pending";
                      return (
                        <div
                          key={vacancy._id}
                          className="px-6 py-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {status === "approved" ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : status === "rejected" ? (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Clock className="w-3 h-3 mr-1" />
                                  )}
                                  {status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {vacancy.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {vacancy.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {vacancy.description?.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>
                                  {"Təşkilat"}:{" "}
                                  {vacancy.organizationName || "Naməlum"}
                                </span>
                                <span>•</span>
                                <span>
                                  {"Son Tarix"}:{" "}
                                  {new Date(
                                    vacancy.applicationDeadline,
                                  ).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>
                                  {vacancy.location?.isRemote
                                    ? "Uzaqdan"
                                    : `${vacancy.location?.city || ""} ${vacancy.location?.country || ""}`.trim() ||
                                      "Məkan dəqiqləşdiriləcək"}
                                </span>
                                <span>•</span>
                                <span>
                                  {vacancy.compensation?.type}:{" "}
                                  {vacancy.compensation?.amount
                                    ? `${vacancy.compensation.amount} ${vacancy.compensation.currency || ""}`
                                    : "Göstərilməyib"}
                                </span>
                              </div>
                              {vacancy.adminComment &&
                                status === "rejected" && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700">
                                      <strong>{"İdarəçi şərhi"}:</strong>{" "}
                                      {vacancy.adminComment}
                                    </p>
                                  </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {status === "pending" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      handleVacancyAction(vacancy, "approve")
                                    }
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {"Təsdiq Et"}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleVacancyAction(vacancy, "reject")
                                    }
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {"Rədd Et"}
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() =>
                                  window.open(
                                    localePath(
                                      `/admin/preview/vacancies/${vacancy._id}`,
                                    ),
                                    "_blank",
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center text-xs"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {"Bax"}
                              </Button>
                              {status !== "pending" && (
                                <Button
                                  onClick={() =>
                                    handleDeleteVacancy(vacancy._id)
                                  }
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center text-xs"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {"Sil"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Vacancy Pagination */}
                {vacancyPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {"Səhifə"} {vacancyPagination.page} {"/"}{" "}
                        {vacancyPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleVacancyPageChange(vacancyPagination.page - 1)
                          }
                          disabled={vacancyPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {"Əvvəlki"}
                        </Button>
                        <Button
                          onClick={() =>
                            handleVacancyPageChange(vacancyPagination.page + 1)
                          }
                          disabled={
                            vacancyPagination.page ===
                            vacancyPagination.totalPages
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {"Növbəti"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              {/* Notification Management Header */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-blue-500" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {"Bildiriş İdarəetməsi"}
                      </h2>
                      <p className="text-gray-600">{"Təsvir"}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowAnnouncementModal(true)}
                    variant="primary"
                    size="md"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {"Elan Göndər"}
                  </Button>
                </div>

                {/* Notification Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {"Cəmi"}
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {notificationStats.total}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {"Oxu"}
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {notificationStats.read}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {"Oxunmamış"}
                        </p>
                        <p className="text-3xl font-bold text-yellow-600">
                          {notificationStats.unread}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 border-l-4 border-l-cyan-500 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {"Bu gün"}
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {notificationStats.today}
                        </p>
                      </div>
                      <Bell className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement Creation Form */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Send className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {"Yeni Elan Yarat"}
                  </h3>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendAnnouncement();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Başlıq etiketi"} *
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder={"Elan başlığını daxil edin..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Mesaj etiketi"} *
                    </label>
                    <textarea
                      rows={4}
                      value={announcementForm.message}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder={"Elan mesajını daxil edin..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Hədəf Auditoriya"}
                    </label>
                    <Select
                      value={announcementForm.targetUsers}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          targetUsers: e.target.value,
                        }))
                      }
                      options={[
                        { value: "all", label: "Bütün İstifadəçilər" },
                        { value: "verified", label: "Yalnız təsdiqlənmişlər" },
                      ]}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setAnnouncementForm({
                          type: "announcement",
                          title: "",
                          message: "",
                          targetUsers: "all",
                          target: "all",
                          userIds: "",
                        })
                      }
                    >
                      {"Formanı Təmizlə"}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={
                        sendingAnnouncement ||
                        !announcementForm.title.trim() ||
                        !announcementForm.message.trim()
                      }
                      loading={sendingAnnouncement}
                      icon={sendingAnnouncement ? undefined : Send}
                    >
                      {sendingAnnouncement ? "Göndərilir..." : "Göndər düyməsi"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Announcements List */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {`Göndərilənlər siyahısı`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {"Göndərilənlərin təsviri"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="px-3 py-2 text-sm">
                      {"Filterlər"}
                    </Button>
                    <Button
                      onClick={() => {
                        // Clear form and scroll to announcement form
                        setAnnouncementForm({
                          type: "announcement",
                          title: "",
                          message: "",
                          targetUsers: "all",
                          target: "all",
                          userIds: "",
                        });
                        // Scroll to form
                        document
                          .querySelector("[data-announcement-form]")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {"Yeni Elan"}
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-6">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">{"Hələ elan yoxdur"}</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {"İlk Elanı Yarat"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {"Nişan"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    notification.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  {"Alıcılar"}:{" "}
                                  {notification.userId
                                    ? `${notification.userId.name}`
                                    : "Bütün İstifadəçilər"}
                                </span>
                                <span>•</span>
                                <span>
                                  {"Göndərmə vaxtı"}:{" "}
                                  {new Date(
                                    notification.createdAt,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                onClick={() => {
                                  // Set editing mode and populate form with announcement data
                                  setEditingAnnouncementId(notification._id);
                                  setAnnouncementForm({
                                    type: "announcement",
                                    title: notification.title,
                                    message: notification.message,
                                    targetUsers: notification.userId
                                      ? "specific"
                                      : "all",
                                    target: notification.userId
                                      ? "specific"
                                      : "all",
                                    userIds: notification.userId
                                      ? notification.userId._id
                                      : "",
                                  });
                                  // Scroll to form
                                  document
                                    .querySelector("[data-announcement-form]")
                                    ?.scrollIntoView({ behavior: "smooth" });
                                }}
                                variant="ghost"
                                size="sm"
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title={"Başlığı Redaktə Et"}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                                variant="ghost"
                                size="sm"
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={"Başlığı Sil"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {notificationPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {"Səhifə"} {notificationPagination.page} {"/"}{" "}
                        {notificationPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            const newPage = notificationPagination.page - 1;
                            setNotificationPagination((prev) => ({
                              ...prev,
                              page: newPage,
                            }));
                            // Fetch new page data
                            try {
                              const params = new URLSearchParams({
                                page: newPage.toString(),
                                limit: "20",
                                ...(notificationFilters.type !== "all" && {
                                  type: notificationFilters.type,
                                }),
                                ...(notificationFilters.userId && {
                                  userId: notificationFilters.userId,
                                }),
                                ...(notificationFilters.isRead !== "all" && {
                                  isRead: notificationFilters.isRead,
                                }),
                              });

                              const response = await fetch(
                                `/api/admin/notifications?${params}`,
                              );
                              if (response.ok) {
                                const data = await response.json();
                                setNotifications(data.notifications || []);
                                setNotificationStats(
                                  data.stats || {
                                    total: 0,
                                    unread: 0,
                                    read: 0,
                                    today: 0,
                                  },
                                );
                                setNotificationPagination({
                                  page: data.pagination.page,
                                  totalPages: data.pagination.totalPages,
                                });
                              }
                            } catch (error) {
                              console.error(
                                "Error loading notifications:",
                                error,
                              );
                            }
                          }}
                          disabled={notificationPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {"Əvvəlki"}
                        </Button>
                        <Button
                          onClick={async () => {
                            const newPage = notificationPagination.page + 1;
                            setNotificationPagination((prev) => ({
                              ...prev,
                              page: newPage,
                            }));
                            // Fetch new page data
                            try {
                              const params = new URLSearchParams({
                                page: newPage.toString(),
                                limit: "20",
                                ...(notificationFilters.type !== "all" && {
                                  type: notificationFilters.type,
                                }),
                                ...(notificationFilters.userId && {
                                  userId: notificationFilters.userId,
                                }),
                                ...(notificationFilters.isRead !== "all" && {
                                  isRead: notificationFilters.isRead,
                                }),
                              });

                              const response = await fetch(
                                `/api/admin/notifications?${params}`,
                              );
                              if (response.ok) {
                                const data = await response.json();
                                setNotifications(data.notifications || []);
                                setNotificationStats(
                                  data.stats || {
                                    total: 0,
                                    unread: 0,
                                    read: 0,
                                    today: 0,
                                  },
                                );
                                setNotificationPagination({
                                  page: data.pagination.page,
                                  totalPages: data.pagination.totalPages,
                                });
                              }
                            } catch (error) {
                              console.error(
                                "Error loading notifications:",
                                error,
                              );
                            }
                          }}
                          disabled={
                            notificationPagination.page ===
                            notificationPagination.totalPages
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {"Növbəti"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === "materials" && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl shadow-md p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black">
                          Materialların idarə edilməsi
                        </h2>
                        <p className="text-blue-100 mt-1">
                          Təhsil resurslarını təşkil edin və idarə edin
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateMaterial}
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-300 font-semibold px-6 py-3"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    {"Yeni material əlavə et"}
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Cəmi
                        </p>
                        <p className="text-3xl font-bold mt-1">
                          {materialStats.total}
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Yayımlanıb
                        </p>
                        <p className="text-3xl font-bold mt-1">
                          {materialStats.published}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-300" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Qaralama
                        </p>
                        <p className="text-3xl font-bold mt-1">
                          {materialStats.unpublished}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-300" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Önə çıxarılan
                        </p>
                        <p className="text-3xl font-bold mt-1">
                          {materialStats.featured}
                        </p>
                      </div>
                      <Tag className="w-8 h-8 text-cyan-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Axtarış və filtrləmə
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materiallarda axtarış
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder={
                          "Başlıq, təsvir və ya təminatçı üzrə axtar..."
                        }
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kateqoriya
                    </label>
                    <select
                      value={materialCategoryFilter}
                      onChange={(e) =>
                        setMaterialCategoryFilter(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="all">Bütün kateqoriyalar</option>
                      <option value="toolkit">🛠️ Toolkit</option>
                      <option value="course">📚 Course</option>
                      <option value="video">🎥 Video</option>
                      <option value="guide">📖 Guide</option>
                      <option value="document">📄 Document</option>
                      <option value="emergency">🚨 Emergency</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setMaterialSearch("");
                        setMaterialCategoryFilter("all");
                        loadMaterials();
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {"Filtrləri təmizlə"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Materials Table */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Material siyahısı ({materials.length})
                    </h3>
                    <div className="text-sm text-gray-500">
                      {materialCategoryFilter !== "all" &&
                        `Filtr: ${materialCategoryFilter}`}
                    </div>
                  </div>
                </div>

                {tabLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">
                      Materiallar yüklənir...
                    </span>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Material tapılmadı
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {materialSearch || materialCategoryFilter !== "all"
                        ? "Filtrləri dəyişərək yenidən yoxlayın"
                        : "İlk materialınızı əlavə edərək başlayın"}
                    </p>
                    {!materialSearch && materialCategoryFilter === "all" && (
                      <Button onClick={handleCreateMaterial} variant="primary">
                        <FileText className="w-4 h-4 mr-2" />
                        {"İlk materialı əlavə et"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kateqoriya
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Növ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aktivlik
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Əməliyyatlar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {materials.map((material) => (
                          <tr
                            key={material._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                {material.imageUrl && (
                                  <Image
                                    src={material.imageUrl}
                                    alt={material.title}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                    {material.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">
                                    {material.description}
                                  </div>
                                  {material.provider && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {`təminatçı: ${material.provider}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {material.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {material.type || "Göstərilməyib"}
                              </div>
                              {material.duration && (
                                <div className="text-xs text-gray-500">
                                  {material.duration}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {material.views || 0}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleMaterialPublish(material)
                                  }
                                  className={`px-3 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full transition-all ${
                                    material.isPublished
                                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                  }`}
                                  title="Yayımlanma statusunu dəyiş"
                                >
                                  {material.isPublished ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {"Yayımlanıb"}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {"Qaralama"}
                                    </>
                                  )}
                                </button>
                                {material.featured && (
                                  <span className="px-3 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {"Önə çıxarılan"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleMaterialFeatured(material)
                                  }
                                  className={`p-2 rounded-lg transition-all ${
                                    material.featured
                                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                  title={
                                    material.featured
                                      ? "Önə çıxarılandan sil"
                                      : "Önə çıxarılanlara əlavə et"
                                  }
                                >
                                  <Tag className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditMaterial(material)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                  title="Materialı redaktə et"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteMaterial(material._id)
                                  }
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                  title="Materialı sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {settingsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <span className="ml-2 text-gray-600">
                    {"Parametrlər yüklənir..."}
                  </span>
                </div>
              ) : (
                <>
                  {/* Settings Header */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-500" />
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {"Sistem Parametrləri"}
                          </h2>
                          <p className="text-gray-600">
                            {
                              "Sayt üzrə ümumi parametrləri və üstünlükləri tənzimləyin"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={loadSettingsHistory}
                          variant="secondary"
                          size="md"
                          className="inline-flex items-center bg-gray-600 text-white hover:bg-gray-700"
                        >
                          <History className="w-4 h-4 mr-2" />
                          {"Tarixçə"}
                        </Button>
                        <Button
                          onClick={() => resetSettings()}
                          variant="danger"
                          size="md"
                          className="inline-flex items-center"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {"Standarta Sıfırla"}
                        </Button>
                        <Button
                          onClick={saveSettings}
                          disabled={!settingsChanged || savingSettings}
                          variant="primary"
                          size="md"
                          className="inline-flex items-center"
                        >
                          {savingSettings ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {savingSettings
                            ? "Yadda saxlanılır..."
                            : "Parametrləri Yadda Saxla"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {settings && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Settings Navigation */}
                      <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <nav className="space-y-2">
                            {[
                              {
                                id: "siteInfo",
                                label: "Sayt Məlumatı",
                                icon: "🌐",
                              },
                              {
                                id: "contentPolicies",
                                label: "Məzmun Qaydaları",
                                icon: "📝",
                              },
                              {
                                id: "userManagement",
                                label: "İstifadəçi İdarəetməsi",
                                icon: "👥",
                              },
                              {
                                id: "notifications",
                                label: "Bildirişlər",
                                icon: "🔔",
                              },
                              {
                                id: "security",
                                label: "Təhlükəsizlik",
                                icon: "🔒",
                              },
                              {
                                id: "features",
                                label: "Funksiyalar",
                                icon: "⚡",
                              },
                            ].map((section) => (
                              <Button
                                key={section.id}
                                onClick={() =>
                                  setActiveSettingsSection(section.id)
                                }
                                variant={
                                  activeSettingsSection === section.id
                                    ? "primary"
                                    : "ghost"
                                }
                                size="sm"
                                className={`w-full text-left justify-start ${
                                  activeSettingsSection === section.id
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span className="mr-2">{section.icon}</span>
                                {section.label}
                              </Button>
                            ))}
                          </nav>
                        </div>
                      </div>

                      {/* Settings Content */}
                      <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          {activeSettingsSection === "siteInfo" && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {"Sayt Məlumatı"}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Sayt Adı"}
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.siteInfo.siteName}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "siteInfo",
                                        "siteName",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Sayt URL-i"}
                                  </label>
                                  <input
                                    type="url"
                                    value={settings.siteInfo.siteUrl}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "siteInfo",
                                        "siteUrl",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Sayt Təsviri"}
                                  </label>
                                  <textarea
                                    value={settings.siteInfo.siteDescription}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "siteInfo",
                                        "siteDescription",
                                        e.target.value,
                                      )
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Əlaqə E-poçtu"}
                                  </label>
                                  <input
                                    type="email"
                                    value={settings.siteInfo.contactEmail}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "siteInfo",
                                        "contactEmail",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Dəstək E-poçtu"}
                                  </label>
                                  <input
                                    type="email"
                                    value={settings.siteInfo.supportEmail}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "siteInfo",
                                        "supportEmail",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === "contentPolicies" && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {"Məzmun Qaydaları"}
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {"Təsdiq Tələb Olunur"}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {
                                        "Bütün məzmun dərcdən əvvəl təsdiqlənməlidir"
                                      }
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={
                                      settings.contentPolicies.requireApproval
                                    }
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "contentPolicies",
                                        "requireApproval",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {
                                        "Təsdiqlənmiş İstifadəçiləri Avtomatik Təsdiqlə"
                                      }
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {
                                        "Təsdiqlənmiş istifadəçilərdən gələn məzmunu avtomatik təsdiqlə"
                                      }
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={
                                      settings.contentPolicies
                                        .autoApproveVerifiedUsers
                                    }
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "contentPolicies",
                                        "autoApproveVerifiedUsers",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {"Məqalə üçün Maks. Uzunluq"}
                                    </label>
                                    <input
                                      type="number"
                                      value={
                                        settings.contentPolicies
                                          .maxArticleLength
                                      }
                                      onChange={(e) =>
                                        updateSettingsField(
                                          "contentPolicies",
                                          "maxArticleLength",
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {"Bloq üçün Maks. Uzunluq"}
                                    </label>
                                    <input
                                      type="number"
                                      value={
                                        settings.contentPolicies.maxBlogLength
                                      }
                                      onChange={(e) =>
                                        updateSettingsField(
                                          "contentPolicies",
                                          "maxBlogLength",
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === "userManagement" && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {"İstifadəçi İdarəetməsi"}
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {"İstifadəçi Qeydiyyatı"}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {
                                        "Yeni istifadəçilərin qeydiyyatına icazə verin"
                                      }
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={
                                      settings.userManagement.allowRegistration
                                    }
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "userManagement",
                                        "allowRegistration",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {"E-poçt Təsdiqi Tələb Et"}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {
                                        "İstifadəçilər yazı yazmadan əvvəl e-poçtu təsdiqləməlidir"
                                      }
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={
                                      settings.userManagement
                                        .requireEmailVerification
                                    }
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "userManagement",
                                        "requireEmailVerification",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {"Standart İstifadəçi Rolu"}
                                  </label>
                                  <select
                                    value={
                                      settings.userManagement.defaultUserRole
                                    }
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "userManagement",
                                        "defaultUserRole",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="user">{"İstifadəçi"}</option>
                                    <option value="contributor">
                                      {"Töhfəçi"}
                                    </option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === "security" && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {"Təhlükəsizlik Parametrləri"}
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {"İki Mərhələli Doğrulamanı Aktiv Et"}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {"Admin hesabları üçün 2FA tələb et"}
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.security.enableTwoFactor}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "security",
                                        "enableTwoFactor",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      {"Sorğu Məhdudiyyətini Aktiv Et"}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      {
                                        "Sui-istifadənin qarşısını almaq üçün API sorğularını məhdudlaşdır"
                                      }
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.security.enableRateLimit}
                                    onChange={(e) =>
                                      updateSettingsField(
                                        "security",
                                        "enableRateLimit",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {"Sessiya Müddəti (dəqiqə)"}
                                    </label>
                                    <input
                                      type="number"
                                      value={settings.security.sessionTimeout}
                                      onChange={(e) =>
                                        updateSettingsField(
                                          "security",
                                          "sessionTimeout",
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {"Maks. Giriş Cəhdləri"}
                                    </label>
                                    <input
                                      type="number"
                                      value={settings.security.maxLoginAttempts}
                                      onChange={(e) =>
                                        updateSettingsField(
                                          "security",
                                          "maxLoginAttempts",
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === "features" && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {"Funksiya Yandır/Söndür"}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(settings.features).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                    >
                                      <div>
                                        <label className="text-sm font-medium text-gray-700 capitalize">
                                          {key
                                            .replace(/([A-Z])/g, " $1")
                                            .trim()}
                                        </label>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={value as boolean}
                                        onChange={(e) =>
                                          updateSettingsField(
                                            "features",
                                            key,
                                            e.target.checked,
                                          )
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {showModal && selectedItem && (
          <Dialog.Root
            open={showModal}
            onOpenChange={(open) => {
              if (!open) setShowModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <Dialog.Description className="sr-only">
                  Seçilmiş məzmun üçün təsdiq və ya rədd etmə addımlarını idarə
                  edin.
                </Dialog.Description>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {"Yoxla"}{" "}
                      {activeTab.slice(0, -1).charAt(0).toUpperCase() +
                        activeTab.slice(1, -1)}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </Dialog.Close>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedItem.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activeTab.slice(0, -1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {"müəllif: "}{" "}
                        {selectedItem.isAnonymous
                          ? "Anonim"
                          : (typeof selectedItem.author === "object"
                              ? (selectedItem.author as any)?.name ||
                                (selectedItem.author as any)?.email
                              : selectedItem.author) || "Naməlum"}
                      </span>
                    </div>
                    {selectedItem.abstract && (
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedItem.abstract}
                      </p>
                    )}
                    <div className="prose max-w-none max-h-96 overflow-y-auto">
                      {selectedItem.content &&
                      typeof selectedItem.content === "object" ? (
                        <BlocknoteReadOnly initialJSON={selectedItem.content} />
                      ) : selectedItem.contentHtml &&
                        selectedItem.contentHtml.trim() ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selectedItem.contentHtml,
                          }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words text-sm bg-gray-100 p-2 rounded">
                          {typeof selectedItem.content === "string"
                            ? selectedItem.content
                            : JSON.stringify(selectedItem.content, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Şərh"}
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={"Şərh əlavə edin..."}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing}
                      variant="danger"
                      size="sm"
                    >
                      {isProcessing ? "Emal olunur..." : "Rədd Et"}
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      variant="primary"
                      size="sm"
                    >
                      {isProcessing ? "Emal olunur..." : "Təsdiq Et"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* User Management Modal */}
        {showUserModal && selectedUser && (
          <Dialog.Root
            open={showUserModal}
            onOpenChange={(open) => {
              if (!open) setShowUserModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {userAction === "role" && "İstifadəçi Rolunu Dəyiş"}
                    {userAction === "delete" && "İstifadəçini Sil"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedUser.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedUser.email}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          selectedUser.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {(
                          {
                            user: "İstifadəçi",
                            organization: "Təşkilat",
                            admin: "Admin",
                          } as Record<string, string>
                        )[selectedUser.role] || selectedUser.role}
                      </span>
                    </div>
                  </div>

                  {userAction === "role" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Yeni rolu seç"}
                      </label>
                      <Select
                        value={selectedUser.role}
                        onChange={(e) => {
                          setSelectedUser({
                            ...selectedUser,
                            role: e.target.value as "user" | "admin",
                          });
                        }}
                        options={[
                          { value: "user", label: "İstifadəçi" },
                          { value: "admin", label: "Admin" },
                        ]}
                        variant="default"
                      />
                    </div>
                  )}

                  {userAction === "delete" && (
                    <div className="mb-4">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-red-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              {"Bu istifadəçi silinsin?"}
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                {
                                  "Bu əməliyyatı geri qaytarmaq mümkün deyil. İstifadəçi məlumatları daimi olaraq silinə bilər."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={executeUserAction}
                      disabled={isProcessing}
                      variant={userAction === "delete" ? "danger" : "primary"}
                      size="sm"
                    >
                      {isProcessing
                        ? "Emal olunur..."
                        : userAction === "role"
                          ? "Rolu Yenilə"
                          : "İstifadəçini Sil"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Bulk Action Modal */}
        {showBulkModal && (
          <Dialog.Root
            open={showBulkModal}
            onOpenChange={(open) => {
              if (!open) setShowBulkModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {"Kütləvi"}{" "}
                    {bulkAction === "approve"
                      ? "Təsdiq Et"
                      : bulkAction === "reject"
                        ? "Rədd Et"
                        : bulkAction === "delete"
                          ? "Sil"
                          : "Redaktə Et"}{" "}
                    {activeTab}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {`${selectedItems.length} ${activeTab.slice(0, -1)} üçün ${bulkAction ? ({ approve: "Təsdiq Et", reject: "Rədd Et", delete: "Sil", update: "Yenilə" } as Record<string, string>)[bulkAction] || bulkAction : ""} etmək istədiyinə əminsən?`}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {selectedItems.map((id) => {
                        const item = blogs.find((b: Blog) => b._id === id);
                        return (
                          <div key={id} className="text-sm text-gray-700 mb-1">
                            • {item?.title || "Naməlum"}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(bulkAction === "reject" || bulkAction === "approve") && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Şərh"}{" "}
                        {bulkAction === "reject"
                          ? `(${"mütləq"})`
                          : `(${"ixtiyari"})`}
                      </label>
                      <textarea
                        value={bulkComment}
                        onChange={(e) => setBulkComment(e.target.value)}
                        placeholder={"Şərh əlavə edin..."}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={executeBulkAction}
                      disabled={
                        isProcessing ||
                        (bulkAction === "reject" && !bulkComment.trim())
                      }
                      variant={
                        bulkAction === "delete" || bulkAction === "reject"
                          ? "danger"
                          : "primary"
                      }
                      size="sm"
                    >
                      {isProcessing
                        ? "Emal olunur..."
                        : bulkAction === "approve"
                          ? "Hamısını Təsdiqlə"
                          : bulkAction === "reject"
                            ? "Hamısını Rədd Et"
                            : bulkAction === "delete"
                              ? "Hamısını Sil"
                              : "Hamısını Yenilə"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Organization Action Modal */}
        {/* Organization Detail Modal */}
        {showOrganizationDetailModal && selectedOrganization && (
          <Dialog.Root
            open={showOrganizationDetailModal}
            onOpenChange={(open) => {
              if (!open) setShowOrganizationDetailModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {"Təşkilat Qeydiyyat Məlumatları"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedOrganization.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedOrganization.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedOrganization.status === "approved" ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : selectedOrganization.status === "rejected" ? (
                        <XCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1" />
                      )}
                      {selectedOrganization.status === "approved"
                        ? "Təsdiqlənmiş"
                        : selectedOrganization.status === "rejected"
                          ? "Rədd Edilmiş"
                          : "Gözləmədə"}
                    </span>
                  </div>

                  {/* Organization Name */}
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedOrganization.organizationName}
                    </h4>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="font-semibold text-gray-900 mb-3">
                      {"Əlaqə Məlumatları"}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          {"E-poçt"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.email}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Əlaqə Şəxsi"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.contactPerson.name}
                        </p>
                      </div>
                      {selectedOrganization.contactPerson.position && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Vəzifə"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.contactPerson.position}
                          </p>
                        </div>
                      )}
                      {selectedOrganization.contactPhone && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Telefon"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.contactPhone}
                          </p>
                        </div>
                      )}
                      {selectedOrganization.contactPerson.phone && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Əlaqə Telefonu"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.contactPerson.phone}
                          </p>
                        </div>
                      )}
                      {selectedOrganization.contactPerson.email &&
                        selectedOrganization.contactPerson.email !==
                          selectedOrganization.email && (
                          <div>
                            <span className="font-medium text-gray-700">
                              {"Əlaqə E-poçtu"}:
                            </span>
                            <p className="text-gray-600">
                              {selectedOrganization.contactPerson.email}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">
                      {"Təsvir"}
                    </h5>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedOrganization.description}
                    </p>
                  </div>

                  {/* Organization Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="font-semibold text-gray-900 mb-3">
                      {"Təşkilat Məlumatları"}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {selectedOrganization.website && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Veb səhifə"}:
                          </span>
                          <a
                            href={selectedOrganization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            {selectedOrganization.website}
                          </a>
                        </div>
                      )}
                      {selectedOrganization.address && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Ünvan"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.address}
                          </p>
                        </div>
                      )}
                      {selectedOrganization.registrationNumber && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Qeydiyyat Nömrəsi"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.registrationNumber}
                          </p>
                        </div>
                      )}
                      {selectedOrganization.organizationType && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Təşkilat növü"}:
                          </span>
                          <p className="text-gray-600">
                            {ORGANIZATION_TYPE_LABELS[
                              selectedOrganization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                            ] || selectedOrganization.organizationType}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Focus Areas */}
                  {selectedOrganization.focusAreas &&
                    selectedOrganization.focusAreas.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">
                          {"Fəaliyyət Sahələri"}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrganization.focusAreas.map(
                            (area: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {area}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Social Media */}
                  {selectedOrganization.socialMedia &&
                    Object.values(selectedOrganization.socialMedia).some(
                      (val) => val,
                    ) && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">
                          {"Sosial Media"}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {selectedOrganization.socialMedia.facebook && (
                            <a
                              href={selectedOrganization.socialMedia.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Facebook
                            </a>
                          )}
                          {selectedOrganization.socialMedia.twitter && (
                            <a
                              href={selectedOrganization.socialMedia.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Twitter
                            </a>
                          )}
                          {selectedOrganization.socialMedia.instagram && (
                            <a
                              href={selectedOrganization.socialMedia.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Instagram
                            </a>
                          )}
                          {selectedOrganization.socialMedia.linkedin && (
                            <a
                              href={selectedOrganization.socialMedia.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                          {selectedOrganization.socialMedia.youtube && (
                            <a
                              href={selectedOrganization.socialMedia.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              YouTube
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Admin Comment (if rejected) */}
                  {selectedOrganization.adminComment &&
                    selectedOrganization.status === "rejected" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="font-semibold text-red-900 mb-2">
                          {"İdarəçi şərhi"}
                        </h5>
                        <p className="text-red-700 text-sm">
                          {selectedOrganization.adminComment}
                        </p>
                      </div>
                    )}

                  {/* Registration Date */}
                  <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                    <p>
                      {"Qeydiyyat tarixi"}:{" "}
                      {new Date(
                        selectedOrganization.createdAt,
                      ).toLocaleDateString()}{" "}
                      {new Date(
                        selectedOrganization.createdAt,
                      ).toLocaleTimeString()}
                    </p>
                    {selectedOrganization.approvedAt && (
                      <p>
                        {"Təsdiq tarixi"}:{" "}
                        {new Date(
                          selectedOrganization.approvedAt,
                        ).toLocaleDateString()}{" "}
                        {new Date(
                          selectedOrganization.approvedAt,
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedOrganization.status === "pending" && (
                  <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button
                      onClick={() => {
                        setShowOrganizationDetailModal(false);
                        handleOrganizationAction(
                          selectedOrganization,
                          "reject",
                        );
                      }}
                      variant="danger"
                      size="md"
                      className="inline-flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {"Rədd Et"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowOrganizationDetailModal(false);
                        handleOrganizationAction(
                          selectedOrganization,
                          "approve",
                        );
                      }}
                      variant="primary"
                      size="md"
                      className="inline-flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {"Təsdiq Et"}
                    </Button>
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Organization Approve/Reject Modal */}
        {showOrganizationModal && selectedOrganization && (
          <Dialog.Root
            open={showOrganizationModal}
            onOpenChange={(open) => {
              if (!open) setShowOrganizationModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
                <Dialog.Description className="sr-only">
                  Təşkilat qeydiyyatı üçün təsdiq və ya rədd qərarını idarə
                  edin.
                </Dialog.Description>
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {organizationAction === "approve"
                      ? "Qeydiyyatı Təsdiqlə"
                      : "Qeydiyyatı Rədd Et"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedOrganization.organizationName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {"Əlaqə"}: {selectedOrganization.contactPerson.name} (
                      {selectedOrganization.email})
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      {selectedOrganization.description}
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                      {selectedOrganization.website && (
                        <span>
                          {"Veb səhifə"}: {selectedOrganization.website}
                        </span>
                      )}
                      {selectedOrganization.contactPhone && (
                        <span>
                          {"Telefon"}: {selectedOrganization.contactPhone}
                        </span>
                      )}
                      {selectedOrganization.address && (
                        <span>
                          {"Ünvan"}: {selectedOrganization.address}
                        </span>
                      )}
                      {selectedOrganization.registrationNumber && (
                        <span>
                          {"Qeydiyyat Nömrəsi"}:{" "}
                          {selectedOrganization.registrationNumber}
                        </span>
                      )}
                    </div>
                    {selectedOrganization.focusAreas &&
                      selectedOrganization.focusAreas.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {"Fəaliyyət Sahələri"}:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedOrganization.focusAreas.map(
                              (area: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {area}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {organizationAction === "approve" && (
                    <div className="mb-4">
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                              {"Qeydiyyatı Təsdiqlə"}
                            </h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>
                                {
                                  "Təşkilat qeydiyyatını təsdiqləməzdən əvvəl məlumatları nəzərdən keçirin."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {organizationAction === "reject" && (
                    <div className="mb-4">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <XCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              {"Qeydiyyatı Rədd Et"}
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                {
                                  "Təşkilatın təkmilləşdirməsinə kömək etmək üçün rədd səbəbini qeyd edin."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {"İdarəçi şərhi"} ({"mütləq"})
                        </label>
                        <textarea
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          placeholder={"Rədd etmə səbəbi..."}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={executeOrganizationAction}
                      disabled={
                        isProcessing ||
                        (organizationAction === "reject" &&
                          !adminComment.trim())
                      }
                      variant={
                        organizationAction === "reject" ? "danger" : "primary"
                      }
                      size="sm"
                    >
                      {isProcessing
                        ? "Emal olunur..."
                        : organizationAction === "approve"
                          ? "Təsdiq Et"
                          : "Rədd Et"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Event Action Modal */}
        {showEventModal && selectedEvent && (
          <Dialog.Root
            open={showEventModal}
            onOpenChange={(open) => {
              if (!open) setShowEventModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {eventAction === "approve"
                      ? "Tədbiri Təsdiqlə"
                      : "Tədbiri Rədd Et"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {selectedEvent.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Kateqoriya"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedEvent.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Yaradan"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedEvent.organizationName || "Naməlum"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Başlama Tarixi"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {new Date(
                            selectedEvent.eventDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Yer"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedEvent.location?.type || "Naməlum"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">
                        {"Təsvir"}:
                      </span>
                      <p className="mt-1 text-gray-600 text-sm">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>

                  {eventAction === "reject" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"İdarəçi şərhi"} ({"mütləq"})
                      </label>
                      <textarea
                        value={eventRejectionReason}
                        onChange={(e) =>
                          setEventRejectionReason(e.target.value)
                        }
                        placeholder={
                          "Zəhmət olmasa bu tədbiri rədd etmək üçün ətraflı şərh daxil edin..."
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={executeEventAction}
                      disabled={
                        isProcessing ||
                        (eventAction === "reject" &&
                          !eventRejectionReason.trim())
                      }
                      variant={eventAction === "reject" ? "danger" : "primary"}
                      size="sm"
                    >
                      {isProcessing
                        ? "Emal olunur..."
                        : eventAction === "approve"
                          ? "Tədbiri Təsdiqlə"
                          : "Tədbiri Rədd Et"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Vacancy Modal */}
        {showVacancyModal && selectedVacancy && (
          <Dialog.Root
            open={showVacancyModal}
            onOpenChange={(open) => {
              if (!open) setShowVacancyModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {vacancyAction === "approve"
                      ? "Vakansiyanı Təsdiqlə"
                      : "Vakansiyanı Rədd Et"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {selectedVacancy.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Kateqoriya"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedVacancy.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Təşkilat"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedVacancy.organizationName || "Naməlum"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Son Tarix"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {new Date(
                            selectedVacancy.applicationDeadline,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Yer"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedVacancy.location?.isRemote
                            ? "Uzaqdan"
                            : `${selectedVacancy.location?.city || ""} ${selectedVacancy.location?.country || ""}`.trim() ||
                              "Məkan dəqiqləşdiriləcək"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Əmək haqqı"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedVacancy.compensation?.type}:{" "}
                          {selectedVacancy.compensation?.amount
                            ? `${selectedVacancy.compensation.amount} ${selectedVacancy.compensation.currency || ""}`
                            : "Göstərilməyib"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Növ"}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedVacancy.type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">
                        {"Təsvir"}:
                      </span>
                      <p className="mt-1 text-gray-600 text-sm">
                        {selectedVacancy.description}
                      </p>
                    </div>
                    {selectedVacancy.requirements && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">
                          {"Tələblər"}:
                        </span>
                        <p className="mt-1 text-gray-600 text-sm">
                          {selectedVacancy.requirements}
                        </p>
                      </div>
                    )}
                  </div>

                  {vacancyAction === "reject" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"İdarəçi şərhi"} ({"mütləq"})
                      </label>
                      <textarea
                        value={vacancyRejectionReason}
                        onChange={(e) =>
                          setVacancyRejectionReason(e.target.value)
                        }
                        placeholder={
                          "Zəhmət olmasa bu vakansiyanı rədd etmək üçün ətraflı şərh daxil edin..."
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      onClick={executeVacancyAction}
                      disabled={
                        isProcessing ||
                        (vacancyAction === "reject" &&
                          !vacancyRejectionReason.trim())
                      }
                      variant={
                        vacancyAction === "reject" ? "danger" : "primary"
                      }
                      size="sm"
                    >
                      {isProcessing
                        ? "Emal olunur..."
                        : vacancyAction === "approve"
                          ? "Vakansiyanı Təsdiqlə"
                          : "Vakansiyanı Rədd Et"}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <Dialog.Root
            open={showAnnouncementModal}
            onOpenChange={(open) => {
              if (!open) setShowAnnouncementModal(false);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {"Elan Göndər"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Dialog.Close>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendAnnouncement();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Başlıq"}
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={"Elan başlığını daxil edin..."}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Mesaj"}
                    </label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={"Elan mesajını daxil edin..."}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Hədəf Auditoriya"}
                    </label>
                    <Select
                      value={announcementForm.targetUsers}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          targetUsers: e.target.value,
                        }))
                      }
                      options={[
                        { value: "all", label: "Bütün İstifadəçilər" },
                        {
                          value: "verified",
                          label: "Yalnız Təsdiqlənmiş İstifadəçilər",
                        },
                        { value: "specific", label: "Konkret İstifadəçilər" },
                      ]}
                      variant="default"
                    />
                  </div>

                  {announcementForm.targetUsers === "specific" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"İstifadəçi ID-ləri (vergüllə ayrılmış)"}
                      </label>
                      <input
                        type="text"
                        value={announcementForm.userIds}
                        onChange={(e) =>
                          setAnnouncementForm((prev) => ({
                            ...prev,
                            userIds: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          "Vergüllə ayrılmış istifadəçi ID-lərini daxil edin..."
                        }
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline" size="sm">
                        {"Ləğv Et"}
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="submit"
                      disabled={sendingAnnouncement}
                      variant="primary"
                      size="sm"
                    >
                      {sendingAnnouncement ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                          {"Göndərilir..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2 inline" />
                          {"Elan Göndər"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Material Form Modal */}
        {showMaterialFormModal && (
          <Dialog.Root
            open={showMaterialFormModal}
            onOpenChange={(open) => {
              if (!open) {
                setShowMaterialFormModal(false);
                setSelectedMaterial(null);
              }
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    {selectedMaterial
                      ? "Materialı redaktə et"
                      : "Yeni material əlavə et"}
                  </Dialog.Title>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Başlıq"} *
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.title || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            title: e.target.value,
                          })
                        }
                        placeholder={"Material başlığı"}
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Təsvir"} *
                      </label>
                      <TextArea
                        value={materialFormData.description || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder={"Materialın ətraflı təsviri"}
                        rows={3}
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Kateqoriya"} *
                      </label>
                      <Select
                        value={materialFormData.category || "other"}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            category: e.target.value as any,
                          })
                        }
                        options={[
                          { value: "toolkit", label: "Alət dəsti" },
                          { value: "course", label: "Kurs" },
                          { value: "video", label: "Video" },
                          { value: "guide", label: "Bələdçi" },
                          { value: "document", label: "Sənəd" },
                          { value: "emergency", label: "Təcili yardım" },
                          { value: "other", label: "Digər" },
                        ]}
                        variant="default"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Növ"}
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.type || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            type: e.target.value,
                          })
                        }
                        placeholder={"məs., PDF, Video Kursu, İnteraktiv Alət"}
                        className="w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"URL"} *
                      </label>
                      <Input
                        type="url"
                        value={materialFormData.url || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            url: e.target.value,
                          })
                        }
                        placeholder={"https://example.com/resurs"}
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Təminatçı"}
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.provider || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            provider: e.target.value,
                          })
                        }
                        placeholder={"Təşkilat və ya təminatçı adı"}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Müddət"}
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.duration || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            duration: e.target.value,
                          })
                        }
                        placeholder={"məs., 4 həftə, 30 dəqiqə"}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Dillər (vergüllə ayrılmış)"}
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.language?.join(", ") || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            language: e.target.value
                              .split(",")
                              .map((l) => l.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder={"az, en, ru"}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Teqlər (vergüllə ayrılmış)"}
                      </label>
                      <Input
                        type="text"
                        value={materialFormData.tags?.join(", ") || ""}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder={"gender-bərabərliyi, təhsil, alətlər"}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Sıra"}
                      </label>
                      <Input
                        type="number"
                        value={materialFormData.order || 0}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            order: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        className="w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"Material şəkli"}
                      </label>
                      <ImageUpload
                        value={materialFormData.imageUrl || ""}
                        onChange={(url) =>
                          setMaterialFormData({
                            ...materialFormData,
                            imageUrl: url,
                          })
                        }
                        context="material"
                        maxSize={10}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {
                          "Şəkil yükləyin və ya standart görünüş üçün boş saxlayın"
                        }
                      </p>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={materialFormData.featured || false}
                          onChange={(e) =>
                            setMaterialFormData({
                              ...materialFormData,
                              featured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {"Önə çıxarılan"}
                        </span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={materialFormData.isPublished !== false}
                          onChange={(e) =>
                            setMaterialFormData({
                              ...materialFormData,
                              isPublished: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {"Yayımlanıb"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button
                      onClick={() => {
                        setShowMaterialFormModal(false);
                        setSelectedMaterial(null);
                      }}
                      variant="outline"
                      disabled={isProcessing}
                    >
                      {"Ləğv et"}
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleSaveMaterial}
                    variant="primary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                        {"Yadda saxlanılır..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" />
                        {selectedMaterial
                          ? "Materialı yenilə"
                          : "Material yarat"}
                      </>
                    )}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </Container>
    </div>
  );
}
