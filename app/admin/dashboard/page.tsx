import AdminListLayout from "@/components/admin/AdminListLayout";

export default function AdminDashboardPage() {
  return (
    <AdminListLayout title="Admin Paneli" description="Bölmə seçmək üçün sol menyudan istifadə edin.">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Admin Paneli</h2>
        <p className="text-gray-600">
          Bölmə seçmək üçün sol menyudan istifadə edin.
        </p>
      </div>
    </AdminListLayout>
  );
}
