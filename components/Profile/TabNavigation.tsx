import { Bell, FileText, Settings, User } from "lucide-react";

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
}

export default function TabNavigation({handleTabChange,loadingTab,activeTab,notifications,userRole}: TabNavigationProps){
    return (
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('profile')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
                {loadingTab === 'profile' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                )}
              </button>
              {userRole !== 'ngo' && (
                <>
                  
                  <button
                    onClick={() => handleTabChange('blogs')}
                    disabled={loadingTab !== null}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'blogs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    My Blogs
                    {loadingTab === 'blogs' && (
                      <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => handleTabChange('notifications')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
                {loadingTab === 'notifications' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
                {loadingTab === 'settings' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                )}
              </button>
            </nav>
          </div>
    )
}