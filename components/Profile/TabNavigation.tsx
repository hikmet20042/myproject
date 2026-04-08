'use client';

import { Bell, FileText, Settings, User } from "lucide-react";

interface Notification { id?: string
  _id?: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string }

interface TabNavigationProps { handleTabChange: (tab: string) => void
  loadingTab: string | null
  activeTab: string
  notifications: Notification[]
  userRole?: string
  isOrganization?: boolean }

export default function TabNavigation({ handleTabChange, loadingTab, activeTab, notifications, userRole, isOrganization }: TabNavigationProps) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-2 mb-8">
      <nav className="flex flex-wrap gap-2">
        <button
          onClick={() => handleTabChange('profile')}
          disabled={loadingTab !== null}
            className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'profile'
              ? 'brand-active-state'
              : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900' } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'profile'
                ? 'brand-gradient text-white shadow-md'
                : 'bg-white border border-blue-100 text-gray-500 group-hover:border-blue-200 group-hover:text-blue-600' }`}>
              <User className="w-4 h-4" />
            </div>
            <span>{'Profil'}</span>
            {loadingTab === 'profile' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>
        </button>

        {!isOrganization && (
          <button
            onClick={() => handleTabChange('blogs')}
            disabled={loadingTab !== null}
              className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'blogs'
                ? 'brand-active-state'
                : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900' } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'blogs'
                  ? 'brand-gradient text-white shadow-md'
                  : 'bg-white border border-blue-100 text-gray-500 group-hover:border-emerald-200 group-hover:text-emerald-600' }`}>
                <FileText className="w-4 h-4" />
              </div>
              <span>{'Mənim Bloqlarım'}</span>
              {loadingTab === 'blogs' && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-600 border-t-transparent"></div>
              )}
            </div>
          </button>
        )}

        <button
          onClick={() => handleTabChange('notifications')}
          disabled={loadingTab !== null}
          className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'notifications'
              ? 'brand-active-state'
              : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900' } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'notifications'
                ? 'brand-gradient text-white shadow-md'
                : 'bg-white border border-blue-100 text-gray-500 group-hover:border-cyan-200 group-hover:text-cyan-600' }`}>
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <span>{'Bildirişlər'}</span>
            {loadingTab === 'notifications' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-600 border-t-transparent"></div>
            )}
          </div>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          disabled={loadingTab !== null}
          className={`flex-1 min-w-[120px] group relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'settings'
              ? 'brand-active-state'
              : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900' } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'settings'
                ? 'brand-gradient text-white shadow-md'
                : 'bg-white border border-blue-100 text-gray-500 group-hover:border-teal-200 group-hover:text-teal-600' }`}>
              <Settings className="w-4 h-4" />
            </div>
            <span>{'Tənzimləmələr'}</span>
            {loadingTab === 'settings' && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-600 border-t-transparent"></div>
            )}
          </div>
        </button>
      </nav>
    </div>
  ) }
