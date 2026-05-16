"use client";

import { useEffect, useState } from "react";
import { Modal } from '@/components/ui/Modal'
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle,
  Edit,
  Send,
  Trash2,
} from "lucide-react";
import { Loading } from '@/components/ui/Loading'
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { PageStateGuard } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { Card } from "@/components/ui/Card";
import AdminListLayout from "@/components/admin/AdminListLayout";
import { Badge } from '@/components/ui/Badge'

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

export default function NotificationsAdminPage() {
  const { showError, showSuccess } = useGlobalFeedback();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationStats, setNotificationStats] = useState<{
    total: number;
    unread: number;
    read: number;
    today: number;
  }>({ total: 0, unread: 0, read: 0, today: 0 });
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
  const [deleteConfirmNotification, setDeleteConfirmNotification] = useState<
    Notification | null
  >(null);
  const [deletingNotification, setDeletingNotification] = useState(false);

  const unwrapPayload = (responseData: any) =>
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

  useEffect(() => {
    setLoading(true);
    loadNotifications().finally(() => setLoading(false));
  }, []);

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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setNotifications(data.notifications || []);
        setNotificationStats(
          data.stats || { total: 0, unread: 0, read: 0, today: 0 },
        );
        setNotificationPagination({
          page: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
        });
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      showError("Zəhmət olmasa lazım olan bütün sahələri doldurun");
      return;
    }

    setSendingAnnouncement(true);
    try {
      if (editingAnnouncementId) {
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
          showSuccess("Elan uğurla yeniləndi");
          setEditingAnnouncementId(null);
        } else {
          const error = await response.json();
          showError(error.error || "Elanı yeniləmək alınmadı");
        }
      } else {
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
          const responseData = await response.json();
          const data = unwrapPayload(responseData);
          showSuccess(`Elan ${data.count || 0} istifadəçiyə göndərildi`);
        } else {
          const error = await response.json();
          showError(error.error || "Elanı göndərmək alınmadı");
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
      showError("Elanı emal edərkən xəta baş verdi");
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setDeletingNotification(true);
    try {
      const response = await fetch(
        `/api/admin/notifications?id=${notificationId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await loadNotifications();
        setDeleteConfirmNotification(null);
        showSuccess("Bildiriş silindi.");
      } else {
        showError("Silmə alınmadı");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      showError("Silmə alınmadı");
    } finally {
      setDeletingNotification(false);
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

  return (
    <PageStateGuard
      isLoading={loading}
      isError={false}
      isEmpty={false}
      loadingText="İdarəetmə paneli yüklənir..."
    >
    <AdminListLayout title="Bildiriş İdarəetməsi" description="Elanları və bildiriş axınını mərkəzləşdirilmiş qaydada idarə edin.">
      <div className="py-6 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {"Bildiriş İdarəetməsi"}
                </h2>
                <p className="text-slate-600">{"Təsvir"}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <Card className="border-l-4 border-l-blue-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{"Cəmi"}</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {notificationStats.total}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-green-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{"Oxu"}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {notificationStats.read}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-yellow-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {"Oxunmamış"}
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {notificationStats.unread}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-cyan-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {"Bu gün"}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {notificationStats.today}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Send className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900">
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
              <Input
                type="text"
                label="Başlıq"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder={"Elan başlığını daxil edin..."}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <TextArea
                label="Mesaj etiketi"
                rows={4}
                value={announcementForm.message}
                onChange={(e) =>
                  setAnnouncementForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder={"Elan mesajını daxil edin..."}
                required
              />
            </div>
            <div>
              <Select
                label="Hədəf Auditoriya"
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
        </Card>

        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {`Göndərilənlər siyahısı`}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {"Göndərilənlərin təsviri"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="px-3 py-2 text-sm">
                {"Filterlər"}
              </Button>
              <Button
                onClick={() => {
                  setAnnouncementForm({
                    type: "announcement",
                    title: "",
                    message: "",
                    targetUsers: "all",
                    target: "all",
                    userIds: "",
                  });
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
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">{"Hələ elan yoxdur"}</p>
                <p className="text-slate-400 text-sm mt-2">
                  {"İlk Elanı Yarat"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification._id}
                    className="p-4 hover:shadow-md transition-all" interactive
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="primary" size="sm">
                            {"Nişan"}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">
                          {notification.title}
                        </h4>
                        <p className="text-slate-600 text-sm mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
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
                            setEditingAnnouncementId(notification._id);
                            setAnnouncementForm({
                              type: "announcement",
                              title: notification.title,
                              message: notification.message,
                              targetUsers: notification.userId
                                ? "specific"
                                : "all",
                              target: notification.userId ? "specific" : "all",
                              userIds: notification.userId
                                ? notification.userId._id
                                : "",
                            });
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
                          onClick={() => setDeleteConfirmNotification(notification)}
                          variant="ghost"
                          size="sm"
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={"Başlığı Sil"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {notificationPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
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
                        console.error("Error loading notifications:", error);
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
                        console.error("Error loading notifications:", error);
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
        </Card>
      </div>

      {showAnnouncementModal && (
        <Modal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          title="Elan Göndər"
          size="lg"
        >

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendAnnouncement();
                }}
                className="space-y-4"
              >
                <div>
                  <Input
                    type="text"
                    label="Başlıq"
                    value={announcementForm.title}
                    onChange={(e) =>
                      setAnnouncementForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={"Elan başlığını daxil edin..."}
                    required
                  />
                </div>

                <div>
                  <TextArea
                    label="Mesaj"
                    value={announcementForm.message}
                    onChange={(e) =>
                      setAnnouncementForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder={"Elan mesajını daxil edin..."}
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Hədəf Auditoriya"
                    value={announcementForm.targetUsers}
                    onChange={(e) =>
                      setAnnouncementForm((prev) => ({
                        ...prev,
                        targetUsers: e.target.value,
                      }))
                    }
                    options={[
                      { value: "all", label: "Bütün İstifadəçilər" },
                      { value: "verified", label: "Yalnız Təsdiqlənmiş İstifadəçilər" },
                      { value: "specific", label: "Konkret İstifadəçilər" },
                    ]}
                    variant="default"
                  />
                </div>

                {announcementForm.targetUsers === "specific" && (
                  <div>
                    <Input
                      type="text"
                      label="İstifadəçi ID-ləri (vergüllə ayrılmış)"
                      value={announcementForm.userIds}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          userIds: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        "Vergüllə ayrılmış istifadəçi ID-lərini daxil edin..."
                      }
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnnouncementModal(false)}
                  >
                    {"Ləğv Et"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingAnnouncement}
                    variant="primary"
                    size="sm"
                  >
                    {sendingAnnouncement ? (
                      <>
                        <span className="inline-flex items-center gap-2"><Loading size="sm" color="white" />Göndərilir...</span>
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
        </Modal>
      )}

      <AdminActionModal
        isOpen={Boolean(deleteConfirmNotification)}
        onClose={() => setDeleteConfirmNotification(null)}
        title="Bildirişi sil"
        description={
          deleteConfirmNotification
            ? `\"${deleteConfirmNotification.title}\" bildirişini silmək istədiyinizə əminsiniz?`
            : "Bu əməliyyatı təsdiqləyin."
        }
        actions={[
          {
            label: "Sil",
            variant: "danger",
            loading: deletingNotification,
            disabled: deletingNotification || !deleteConfirmNotification,
            onClick: async () => {
              if (!deleteConfirmNotification?._id) return;
              await deleteNotification(deleteConfirmNotification._id);
            },
          },
        ]}
      />
    </AdminListLayout>
    </PageStateGuard>
  );
}
