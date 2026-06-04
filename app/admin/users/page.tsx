"use client";

import { useEffect, useState } from "react";
import { Modal } from '@/components/ui/Modal'
import {
  CheckCircle,
  Edit,
  Search,
  Shield,
  User,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/shared";
import EmptyState from "@/components/shared/EmptyState";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { Card } from "@/components/ui/Card";
import AdminListLayout from "@/components/admin/AdminListLayout";
import { Badge } from '@/components/ui/Badge'

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

export default function UsersAdminPage() {
  const { showError, showSuccess } = useGlobalFeedback();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const unwrapPayload = (responseData: any) =>
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setUsers(data.users || []);
        setUserPagination({
          page: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
          total: data.pagination.total || 0,
        });

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
      showError("İstifadəçilər yüklənmədi");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadUsers().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        showSuccess("Əməliyyat uğurla tamamlandı");
        await loadUsers();
      } else {
        showError("Əməliyyat tamamlanmadı");
      }
    } catch (error) {
      console.error("Error executing user action:", error);
      showError("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserSearch = async () => {
    setUserPagination({ page: 1, totalPages: 1, total: 0 });
    await loadUsers();
  };

  const handleUserPageChange = async (page: number) => {
    setUserPagination((prev) => ({ ...prev, page }));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(userSearch && { search: userSearch }),
        ...(userRoleFilter !== "all" && { role: userRoleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setUsers(data.users || []);
        setUserPagination({
          page: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
          total: data.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showError("İstifadəçilər yüklənmədi");
    }
  };

  if (loading) {
    return <LoadingState text={"İdarəetmə paneli yüklənir..."} />;
  }

  return (
    <AdminListLayout title="İstifadəçi İdarəetməsi" description="İstifadəçi hesablarını və rollarını idarə edin.">
      <div className="py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Cəmi İstifadəçilər"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {userStats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-green-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Təsdiqlənmiş İstifadəçilər"}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {userStats.verified}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-cyan-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Admin İstifadəçiləri"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {userStats.admin}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  icon={Search}
                  placeholder={"Ad və ya e-poçt ilə istifadəçi axtar..."}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleUserSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                options={[
                  { value: "all", label: "Bütün Rollar" },
                  { value: "user", label: "İstifadəçilər" },
                  { value: "admin", label: "İdarəçi" },
                ]}
                variant="default"
              />
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
        </Card>

        <Card>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-slate-900">
              {"İstifadəçi İdarəetməsi"}{" "}
              <span className="ml-2 text-base font-normal text-slate-500">
                ({`${userPagination.total} istifadəçi`})
              </span>
            </h2>
          </div>
          <div className="px-6 py-6">
            {users.length === 0 ? (
              <EmptyState variant="minimal" message="İstifadəçi tapılmadı" />
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow"
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
                          <Badge variant="success" size="sm">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {"Təsdiqlənmiş"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {user.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">{user.email}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>
                          {"Bloqlar"}: {user.stats?.blogs || 0}
                        </span>
                        <span>
                          {"Qoşulma tarixi"}:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.profile?.bio && (
                        <p className="text-sm text-slate-600 mt-2 italic">
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

          {userPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  {"Səhifə"} {userPagination.page} {"/"}{" "}
                  {userPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUserPageChange(userPagination.page - 1)}
                    disabled={userPagination.page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    {"Əvvəlki"}
                  </Button>
                  <Button
                    onClick={() => handleUserPageChange(userPagination.page + 1)}
                    disabled={userPagination.page === userPagination.totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    {"Növbəti"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {showUserModal && selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title={
            userAction === "role" ? "İstifadəçi Rolunu Dəyiş" : "İstifadəçini Sil"
          }
          size="sm"
          className="max-h-[90vh] overflow-y-auto"
        >
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    {selectedUser.name}
                  </h4>
                  <p className="text-sm text-slate-600 mb-2">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserModal(false)}
                  >
                    {"Ləğv Et"}
                  </Button>
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
        </Modal>
      )}
    </AdminListLayout>
  );
}
