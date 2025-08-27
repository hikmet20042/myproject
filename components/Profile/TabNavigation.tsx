import { BarChart3, Bell, FileText, Settings, User } from "lucide-react";

interface Notification {
  id?: string
  _id?: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface Draft {
  _id: string
  title: string
  content: string
  type: string
  createdAt: string
  updatedAt: string
}

interface TabNavigationProps {
  handleTabChange: (tab: string) => void
  loadingTab: string | null
  activeTab: string
  drafts: Draft[]
  notifications: Notification[]
}

export default function TabNavigation({handleTabChange,loadingTab,activeTab,drafts,notifications}: TabNavigationProps){
    return (
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('profile')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
                {loadingTab === 'profile' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('drafts')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'drafts'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Drafts
                {drafts.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-1">
                    {drafts.length}
                  </span>
                )}
                {loadingTab === 'drafts' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('articles')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'articles'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                My Articles
                {loadingTab === 'articles' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('stories')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'stories'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                My Stories
                {loadingTab === 'stories' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('analytics')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
                {loadingTab === 'analytics' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notifications'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
                {loadingTab === 'notifications' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                disabled={loadingTab !== null}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${loadingTab !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
                {loadingTab === 'settings' && (
                  <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                )}
              </button>
            </nav>
          </div>
    )
}