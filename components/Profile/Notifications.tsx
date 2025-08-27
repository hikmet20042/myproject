import { Bell } from "lucide-react";
import NotificationModal from "../NotificationModal";
import { Dispatch, SetStateAction } from "react";

interface Notification {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsProps {
  loadingTab: string | null;
  notifications: Notification[];
  setModalNotification: Dispatch<SetStateAction<Notification | null>>;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  modalNotification: Notification | null;
  modalOpen: boolean;
  toggleNotificationRead: (notifId: string, isRead: boolean) => Promise<void>;
}

export default function Notifications({
  loadingTab,
  notifications,
  setModalNotification,
  setModalOpen,
  modalNotification,
  modalOpen,
  toggleNotificationRead
}: NotificationsProps) {


    return (
        <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'notifications' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border border-gray-200 rounded-lg p-4 ${!notification.isRead ? 'bg-blue-50' : ''
                          } cursor-pointer`}
                        onClick={() => { setModalNotification(notification); setModalOpen(true); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Only show mark as read/unread in modal, not in list, to avoid double request */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
              {/* Notification Modal */}
              <NotificationModal
                open={modalOpen && !!modalNotification}
                onClose={() => setModalOpen(false)}
                title={modalNotification?.title || ''}
                message={modalNotification?.message || ''}
                createdAt={modalNotification?.createdAt || ''}
                isRead={modalNotification?.isRead}
                onMarkRead={modalNotification && !modalNotification.isRead ? () => {
                  const notifId = modalNotification.id || modalNotification._id;
                  if (notifId) toggleNotificationRead(notifId, true);
                  setModalOpen(false);
                } : undefined}
                onMarkUnread={modalNotification && modalNotification.isRead ? () => {
                  const notifId = modalNotification.id || modalNotification._id;
                  if (notifId) toggleNotificationRead(notifId, false);
                  setModalOpen(false);
                } : undefined}
              />
            </div>
    )
}