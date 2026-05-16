import AdminListLayout from "@/components/admin/AdminListLayout";
import { Card } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  return (
    <AdminListLayout title="Admin Paneli" description="Bölmə seçmək üçün sol menyudan istifadə edin.">
      <Card className="p-6">
        <h2 className="text-2xl font-black text-slate-900">Admin Paneli</h2>
        <p className="text-slate-600">
          Bölmə seçmək üçün sol menyudan istifadə edin.
        </p>
      </Card>
    </AdminListLayout>
  );
}
