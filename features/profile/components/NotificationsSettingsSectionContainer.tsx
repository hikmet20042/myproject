"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Save } from "lucide-react";
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/feedback/Alert'
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/features/profile/components/ui";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { Select } from '@/components/ui/Select'

type NotificationPreferences = {
  engagement_enabled: boolean;
  frequency: 'instant' | 'off';
};

const NOTIFICATION_GROUPS = {
  essential: {
    label: "🔒 Mütləq Bildirilişlər",
    description: "Həmiş aktiv - Hesab təhlükəsizliyi və kontent moderasiyası",
    isLocked: true,
    items: [
      { key: "essential", label: "Parol dəyişikliyi, E-poçt doğrulanması, Kontent qərarları (Təsdiq/Rədd)" },
    ],
  },
  engagement: {
    label: "💬 Cəmiyyət Fəaliyyəti",
    description: "Bəyənmələr, Saxlanışlar, İzləyicilər, Trend məzmun",
    isLocked: false,
    items: [
      { key: "engagement_enabled", label: "Cəmiyyət fəaliyyətini mə'lumat al" },
    ],
  },
  frequency: {
    label: "⏱️ Bildirilən Tezlik",
    description: "Bildirilişləri nə vaxt almağınızı seçin",
    isLocked: false,
    items: [
      { key: "frequency", type: "select", label: "Tezlik", options: [
        { value: "instant", label: "🚀 Ani - Dərhal göndər" },
        { value: "off", label: "🔕 Söndür - Hamısını deaktivləşdir (Mütləq olmayanlar istisna)" },
      ]},
    ],
  },
};

export function NotificationsSettingsSectionContainer() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const { showError, showSuccess } = useGlobalFeedback();

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Tercihlər yüklənmədi");
      const json = await response.json();
      setPreferences(json.data);
    } catch (error) {
      showError("Tercihlər yüklənə bilmədi");
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("Tercihlər saxlanıla bilmədi");

      showSuccess("Bildirimlərin Tercihlər Uğurla Saxlanıldı");
    } catch (error) {
      showError("Tercihlər saxlanıla bilmədi");
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleAll = (enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      engagement_enabled: enabled,
    });
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  if (loading) {
    return (
      <SectionCard title="Bildirimlərin Tercihlər" description="Hansı bildirişləri almağınızı idarə edin">
        <div className="flex items-center justify-center py-8">
          <Loading size="md" variant="spinner" color="gray" />
        </div>
      </SectionCard>
    );
  }

  if (!preferences) {
    return (
      <SectionCard title="Bildirimlərin Tercihlər" description="Hansı bildirişləri almağınızı idarə edin">
        <Alert variant="error" size="sm">Tercihlər yüklənə bilmədi</Alert>
      </SectionCard>
    );
  }

  const allEnabled = preferences?.engagement_enabled === true && preferences?.frequency === 'instant';

  return (
    <SectionCard
      title="Bildirimlərin Tercihlər"
      description="Bildirişlərinizi sadə və saf şəkildə idarə edin"
      actions={
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving || loading}>
          <Save className="w-4 h-4 mr-2" />
          Yadda saxla
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ESSENTIAL SECTION - LOCKED */}
        <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔒</span>
                <h3 className="font-semibold text-gray-900">Mütləq Bildirilişlər</h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">Həmiş aktiv - deaktiv edilə bilməz</p>
            </div>
          </div>
          <div className="pl-7 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-sm font-bold mt-0.5">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Hesab Təhlükəsizliyi</p>
                <p className="text-xs text-gray-600">Parol dəyişikliyi, E-poçt doğrulanması</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-sm font-bold mt-0.5">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Məzmun Moderasiyası</p>
                <p className="text-xs text-gray-600">Bloqunuzun, tədbirlərin və vakansiyaların təsdiq/rədd qərarları</p>
              </div>
            </div>
          </div>
        </div>

        {/* ENGAGEMENT SECTION - TOGGLEABLE */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💬</span>
                <h3 className="font-semibold text-gray-900">Cəmiyyət Fəaliyyəti</h3>
              </div>
              <p className="text-xs text-gray-600">Bəyənmələr, saxlanışlar, izləyicilər və trend məzmun</p>
            </div>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
            <input
              type="checkbox"
              checked={preferences?.engagement_enabled === true}
              onChange={(e) =>
                setPreferences(prev => prev ? { ...prev, engagement_enabled: e.target.checked } : prev)
              }
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">Cəmiyyət bildirişlərini al</span>
          </label>
        </div>

        {/* FREQUENCY SECTION - SELECT */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⏱️</span>
              <h3 className="font-semibold text-gray-900">Bildirilən Tezlik</h3>
            </div>
            <p className="text-xs text-gray-600">Bildirişləri nə vaxt almağınızı seçin</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <Select
              label="Bildiriş tezliyi"
              value={preferences?.frequency || 'instant'}
              onChange={(e) =>
                setPreferences(prev => prev ? { ...prev, frequency: e.target.value as 'instant' | 'off' } : prev)
              }
              options={[
                { value: 'instant', label: '🚀 Ani - Dərhal göndər' },
                { value: 'off', label: '🔕 Söndür' },
              ]}
            />
          </div>
        </div>

        {/* INFO NOTICE */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <strong>Qeyd:</strong> Bildirişlər deaktiv olsa da, siz idarəetmə panelində hərəkətləri görə biləcəksiniz.
            Deaktivləşdirmə yalnız real vaxt bildirişlərini əngəlləyir.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
