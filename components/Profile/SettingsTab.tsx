import { Settings } from "lucide-react"
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsTabProps {
  loadingTab: string | null
}

export default function SettingsTab({ loadingTab }: SettingsTabProps) {
  const { t } = useLanguage()
  return (
    <div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
      {loadingTab === 'settings' ? (
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/3"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-12 text-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          
          <div className="relative flex flex-col items-center justify-center space-y-6">
            {/* Icon container with gradient effect */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl blur opacity-50 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Settings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('profile.settingsComingSoon')}
              </h3>
              <p className="text-base sm:text-lg text-gray-700 max-w-md mx-auto leading-relaxed">
                {t('profile.settingsComingSoonBody')}
              </p>
            </div>
            
            {/* Feature preview badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-indigo-200 text-sm font-semibold text-indigo-700 shadow-md">
                🔒 Privacy Controls
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-purple-200 text-sm font-semibold text-purple-700 shadow-md">
                🔔 Notification Preferences
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-pink-200 text-sm font-semibold text-pink-700 shadow-md">
                🎨 Theme Options
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
                 