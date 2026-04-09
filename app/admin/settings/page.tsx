"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageStateGuard } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { History, RotateCcw, Save, Settings } from "lucide-react";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";

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

export default function SettingsAdminPage() {
  const { showError, showSuccess } = useGlobalFeedback();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] =
    useState("siteInfo");
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingSettings, setResettingSettings] = useState(false);
  const [settingsHistory, setSettingsHistory] = useState<any[]>([]);
  const [resetConfirmSection, setResetConfirmSection] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSettingsLoading(true);
    loadSettings().finally(() => setSettingsLoading(false));
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
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
        showSuccess("Parametrlər uğurla yadda saxlandı!");
      } else {
        const error = await response.json();
        showError(error.error || "Parametrləri yadda saxlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showError("Parametrləri yadda saxlamaq alınmadı");
    } finally {
      setSavingSettings(false);
    }
  };

  const resetSettings = async (section?: string) => {
    setResettingSettings(true);
    try {
      const endpoint = section
        ? `/api/admin/settings?section=${encodeURIComponent(section)}`
        : "/api/admin/settings";
      const response = await fetch(endpoint, { method: "DELETE" });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsChanged(false);
        showSuccess("Parametrlər uğurla sıfırlandı!");
      } else {
        const error = await response.json();
        showError(error.error || "Parametrləri sıfırlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      showError("Parametrləri sıfırlamaq alınmadı");
    } finally {
      setResettingSettings(false);
    }
  };

  const loadSettingsHistory = async () => {
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH" });

      if (response.ok) {
        const data = await response.json();
        setSettingsHistory(data.history || []);
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

  return (
    <PageStateGuard
      isLoading={settingsLoading}
      isError={false}
      isEmpty={false}
      loadingText="İdarəetmə paneli yüklənir..."
    >
    <AdminListLayout title="Sistem Parametrləri" description="Sayt üzrə ümumi parametrləri və üstünlükləri tənzimləyin.">
      <div className="py-6 space-y-6">
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
                onClick={() => setResetConfirmSection("")}
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
                loading={savingSettings}
                variant="primary"
                size="md"
                className="inline-flex items-center"
              >
                {!savingSettings && (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingSettings ? "Yadda saxlanılır..." : "Parametrləri Yadda Saxla"}
              </Button>
            </div>
          </div>
        </div>

        {settings && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <nav className="space-y-2">
                  {[
                    { id: "siteInfo", label: "Sayt Məlumatı", icon: "🌐" },
                    { id: "contentPolicies", label: "Məzmun Qaydaları", icon: "📝" },
                    { id: "userManagement", label: "İstifadəçi İdarəetməsi", icon: "👥" },
                    { id: "notifications", label: "Bildirişlər", icon: "🔔" },
                    { id: "security", label: "Təhlükəsizlik", icon: "🔒" },
                    { id: "features", label: "Funksiyalar", icon: "⚡" },
                  ].map((section) => (
                    <Button
                      key={section.id}
                      onClick={() => setActiveSettingsSection(section.id)}
                      variant={activeSettingsSection === section.id ? "primary" : "ghost"}
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
                            updateSettingsField("siteInfo", "siteName", e.target.value)
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
                            updateSettingsField("siteInfo", "siteUrl", e.target.value)
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
                            updateSettingsField("siteInfo", "contactEmail", e.target.value)
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
                            updateSettingsField("siteInfo", "supportEmail", e.target.value)
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
                            {"Bütün məzmun dərcdən əvvəl təsdiqlənməlidir"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.contentPolicies.requireApproval}
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
                            {"Təsdiqlənmiş İstifadəçiləri Avtomatik Təsdiqlə"}
                          </label>
                          <p className="text-xs text-gray-500">
                            {"Təsdiqlənmiş istifadəçilərdən gələn məzmunu avtomatik təsdiqlə"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.contentPolicies.autoApproveVerifiedUsers}
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
                            value={settings.contentPolicies.maxArticleLength}
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
                            value={settings.contentPolicies.maxBlogLength}
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
                            {"Yeni istifadəçilərin qeydiyyatına icazə verin"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.userManagement.allowRegistration}
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
                            {"İstifadəçilər yazı yazmadan əvvəl e-poçtu təsdiqləməlidir"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.userManagement.requireEmailVerification}
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
                          value={settings.userManagement.defaultUserRole}
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
                          <option value="contributor">{"Töhfəçi"}</option>
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
                            {"Sui-istifadənin qarşısını almaq üçün API sorğularını məhdudlaşdır"}
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
                      {Object.entries(settings.features).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminListLayout>
    <AdminActionModal
      isOpen={resetConfirmSection !== null}
      onClose={() => setResetConfirmSection(null)}
      title="Parametrləri sıfırla"
      description={
        resetConfirmSection
          ? `${resetConfirmSection} bölməsini varsayılanlara sıfırlamaq istədiyinizə əminsiniz?`
          : "Bütün parametrləri varsayılanlara sıfırlamaq istədiyinizə əminsiniz?"
      }
      actions={[
        {
          label: "Sıfırla",
          variant: "danger",
          loading: resettingSettings,
          disabled: resettingSettings,
          onClick: async () => {
            await resetSettings(resetConfirmSection || undefined);
            setResetConfirmSection(null);
          },
        },
      ]}
    />
    </PageStateGuard>
  );
}
