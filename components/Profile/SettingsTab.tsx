import { Settings } from "lucide-react"

interface SettingsTabProps { loadingTab: string | null }

export default function SettingsTab({ loadingTab }: SettingsTabProps) { return (
  <div className="bg-white shadow-md rounded-2xl border-2 border-blue-100 overflow-hidden">
      {loadingTab === 'settings' ? (
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gradient-to-r from-slate-200 to-blue-200 rounded-xl w-1/3"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 bg-gradient-to-r from-slate-100 to-blue-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-12 text-center bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          
          <div className="relative flex flex-col items-center justify-center space-y-6">
            {/* Icon container with gradient effect */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-emerald-600 rounded-3xl blur opacity-50 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-md">
                <Settings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                {'Tənzimləmələr Tezliklə'}
              </h3>
              <p className="text-base sm:text-lg text-gray-700 max-w-md mx-auto leading-relaxed">
                {'İstifadəçi üstünlükləri və tənzimləmələrin idarə edilməsi gələcək yeniləmədə mövcud olacaq.'}
              </p>
            </div>
            
            {/* Feature preview badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-sm font-semibold text-blue-700 shadow-md">
                🔒 Privacy Controls
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-cyan-200 text-sm font-semibold text-cyan-700 shadow-md">
                🔔 Notification Preferences
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-sm font-semibold text-emerald-700 shadow-md">
                🎨 Theme Options
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  ) }
                 