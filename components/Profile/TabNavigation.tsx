'use client';

import { Bell, FileText, Settings, User } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id?: string
  _id?: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface TabNavigationProps {
  handleTabChange: (tab: string) => void
  loadingTab: string | null
  activeTab: string
  notifications: Notification[]
  userRole?: string
  isNGO?: boolean
}

export default function TabNavigation({ handleTabChange, loadingTab, activeTab, notifications, userRole, isNGO }: TabNavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-8">
      <nav className="flex flex-wrap gap-2">
        <button
          onClick={() => handleTabChange('profile')}
          disabled={loadingTab !== null}
          className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'profile'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-500 group-hover:border-blue-200 group-hover:text-blue-600'
              }`}>
              <User className="w-4 h-4" />
            </div>
            <span>{t('profile.tabs.profile')}</span>
            {loadingTab === 'profile' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>
        </button>

        {!isNGO && (
          <button
            onClick={() => handleTabChange('blogs')}
            disabled={loadingTab !== null}
            className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'blogs'
                ? 'bg-pink-50 text-pink-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'blogs'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-500 group-hover:border-pink-200 group-hover:text-pink-600'
                }`}>
                <FileText className="w-4 h-4" />
              </div>
              <span>{t('profile.tabs.myBlogs')}</span>
              {loadingTab === 'blogs' && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-pink-600 border-t-transparent"></div>
              )}
            </div>
          </button>
        )}

        <button
          onClick={() => handleTabChange('notifications')}
          disabled={loadingTab !== null}
          className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'notifications'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'notifications'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-500 group-hover:border-purple-200 group-hover:text-purple-600'
              }`}>
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <span>{t('profile.tabs.notifications')}</span>
            {loadingTab === 'notifications' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-600 border-t-transparent"></div>
            )}
          </div>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          disabled={loadingTab !== null}
          className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'settings'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-500 group-hover:border-indigo-200 group-hover:text-indigo-600'
              }`}>
              <Settings className="w-4 h-4" />
            </div>
            <span>{t('profile.tabs.settings')}</span>
            {loadingTab === 'settings' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></div>
            )}
          </div>
        </button>
      </nav>
    </div>
  )
}