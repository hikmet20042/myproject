"use client";

import { useRouter } from "next/navigation";
import { Bell, KeyRound, Mail, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionCard } from "@/features/profile/components/ui";

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const localePath = useLocalizedPath();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tənzimləmələr"
        description="Hesab təhlükəsizliyi, seçimlər və kritik əməliyyatları buradan idarə et."
      />

      <SectionCard title="Account" description="Hesab məlumatların və təhlükəsizlik ayarların.">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{session?.user?.email || "-"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Parolu dəyiş</p>
                <p className="text-sm text-gray-500">Hesab təhlükəsizliyi üçün mütəmadi yenilə.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push(localePath("/auth/reset-password"))}>
              Dəyiş
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferences" description="Bildiriş seçimləri və fərdi seçimlər.">
        <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Bildiriş tərcihləri</p>
              <p className="text-sm text-gray-500">Tezliklə fərdiləşdirilə bilən bildiriş seçimləri əlavə ediləcək.</p>
            </div>
          </div>
          <Button variant="outline" disabled>
            Tezliklə
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" description="Bu əməliyyatlar geri qaytarıla bilməz.">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Hesabı sil</p>
              <p className="text-sm text-red-700">Bu əməliyyat hazırda aktiv deyil, lakin gələcəkdə burada olacaq.</p>
            </div>
          </div>
          <Button variant="danger" disabled>
            Sil
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
