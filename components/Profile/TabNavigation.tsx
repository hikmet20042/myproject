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

export default function TabNavigation({handleTabChange,loadingTab,activeTab,notifications,userRole,isNGO}: TabNavigationProps){
    const { t } = useLanguage();
    
    return (
        <div className="relative mb-8">
          {/* Gradient Border Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
          
          <nav className="flex flex-wrap gap-2 sm:gap-4 border-b-2 border-gray-100">
            <button
              onClick={() => handleTabChange('profile')}
              disabled={loadingTab !== null}
              className={`group relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                }`}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline">{t('profile.tabs.profile')}</span>
                {loadingTab === 'profile' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                )}
              </div>
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
              )}
            </button>

            {!isNGO && (
              <button
                onClick={() => handleTabChange('blogs')}
                disabled={loadingTab !== null}
                className={`group relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-sm sm:text-base transition-all duration-300 ${
                  activeTab === 'blogs'
                    ? 'text-pink-600'
                    : 'text-gray-600 hover:text-pink-600'
                } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    activeTab === 'blogs'
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-pink-50 group-hover:text-pink-600'
                  }`}>
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="hidden sm:inline">{t('profile.tabs.myBlogs')}</span>
                  {loadingTab === 'blogs' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-600 border-t-transparent"></div>
                  )}
                </div>
                {activeTab === 'blogs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-t-full"></div>
                )}
              </button>
            )}

            <button
              onClick={() => handleTabChange('notifications')}
              disabled={loadingTab !== null}
              className={`group relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'notifications'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600'
                }`}>
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">{t('profile.tabs.notifications')}</span>
                {loadingTab === 'notifications' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                )}
              </div>
              {activeTab === 'notifications' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              disabled={loadingTab !== null}
              className={`group relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                }`}>
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline">{t('profile.tabs.settings')}</span>
                {loadingTab === 'settings' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                )}
              </div>
              {activeTab === 'settings' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full"></div>
              )}
            </button>
          </nav>
        </div>
    )
}