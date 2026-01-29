import { Bell } from "lucide-react";
import NotificationModal from "../NotificationModal";
import { useLanguage } from '@/contexts/LanguageContext'
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
  markAllAsRead?: () => Promise<void>;
}

export default function Notifications({
  loadingTab,
  notifications,
  setModalNotification,
  setModalOpen,
  modalNotification,
  modalOpen,
  toggleNotificationRead,
  markAllAsRead
}: NotificationsProps) {

  const unreadCount = notifications.filter(n => !n.isRead).length
  const { t } = useLanguage()


    return (
        <div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
              <div className="relative px-6 py-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b-2 border-gray-100">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
                
                <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <Bell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('profile.tabs.notifications')}</h2>
                  </div>
                  {unreadCount > 0 && markAllAsRead && (
                    <button
                      onClick={markAllAsRead}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      {t('profile.markAllAsRead', { count: unreadCount })}
                    </button>
                  )}
                </div>
              </div>
              <div className="px-6 py-6">
                {loadingTab === 'notifications' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="h-5 bg-gray-300 rounded-lg w-3/5"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/5"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl blur opacity-25"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                        <Bell className="w-10 h-10 text-purple-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('profile.noNotifications')}</h3>
                    <p className="text-base text-gray-600">
                      {t('profile.allCaughtUp')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification, idx) => (
                      <div
                        key={notification.id}
                        className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl animate-fade-in ${
                          !notification.isRead 
                            ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300' 
                            : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-indigo-300'
                        }`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                        onClick={() => { setModalNotification(notification); setModalOpen(true); }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                          !notification.isRead
                            ? 'bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5'
                            : 'bg-gradient-to-br from-gray-500/0 to-indigo-500/0 group-hover:from-gray-500/5 group-hover:to-indigo-500/5'
                        }`}></div>
                        
                        <div className="relative flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md">
                                  {t('profile.new')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
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