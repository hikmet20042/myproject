import { Save, Lock, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from '@/components/ui'

interface Preferences {
  privacy?: {
    publicProfile?: boolean
    showEmail?: boolean
    showStats?: boolean
  }
  notifications?: {
    email?: {
      enabled?: boolean
    }
    push?: {
      enabled?: boolean
    }
    inApp?: {
      enabled?: boolean
    }
  }
  writing?: {
    defaultPrivacy?: string
  }
}

interface SettingsTabProps {
  loadingTab: string | null
  preferences: Preferences | null
  setPreferences: (preferences: Preferences) => void
  savePreferences: (section?: string) => void
}

export default function SettingsTab({loadingTab, preferences, setPreferences,savePreferences}: SettingsTabProps){

    return (
        <div className="bg-white shadow rounded-lg">
              {loadingTab === 'settings' ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your privacy, notifications, and writing preferences</p>
                  </div>
                  <div className="px-6 py-4 space-y-6">
                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Public Profile</label>
                          <p className="text-sm text-gray-500">Allow others to view your profile</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.privacy?.publicProfile || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              privacy: {
                                ...preferences?.privacy,
                                publicProfile: e.target.checked
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Show Email</label>
                          <p className="text-sm text-gray-500">Display email on public profile</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.privacy?.showEmail || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              privacy: {
                                ...preferences?.privacy,
                                showEmail: e.target.checked
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Show Statistics</label>
                          <p className="text-sm text-gray-500">Display writing stats on profile</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.privacy?.showStats || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              privacy: {
                                ...preferences?.privacy,
                                showStats: e.target.checked
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.notifications?.email?.enabled || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              notifications: {
                                ...preferences?.notifications,
                                email: {
                                  ...preferences?.notifications?.email,
                                  enabled: e.target.checked
                                }
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                          <p className="text-sm text-gray-500">Receive browser notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.notifications?.push?.enabled || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              notifications: {
                                ...preferences?.notifications,
                                push: {
                                  ...preferences?.notifications?.push,
                                  enabled: e.target.checked
                                }
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">In-App Notifications</label>
                          <p className="text-sm text-gray-500">Show notifications in the app</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences?.notifications?.inApp?.enabled || false}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              notifications: {
                                ...preferences?.notifications,
                                inApp: {
                                  ...preferences?.notifications?.inApp,
                                  enabled: e.target.checked
                                }
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Writing Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Writing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Privacy</label>
                        <select
                          value={preferences?.writing?.defaultPrivacy || 'public'}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferences,
                              writing: {
                                ...preferences?.writing,
                                defaultPrivacy: e.target.value
                              }
                            }
                            setPreferences(newPrefs)
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="anonymous">Anonymous</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Change Password */}
                  <ChangePasswordSection />

                  {/* Save Settings */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => savePreferences()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save All Settings
                      </Button>
                      <Button
                        onClick={() => savePreferences('privacy')}
                        variant="outline"
                      >
                        Save Privacy Only
                      </Button>
                    </div>
                    </div>
                  </div>
                </>
              )}
            </div>
    )
}

function ChangePasswordSection() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validation
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setIsChangingPassword(false)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!isChangingPassword ? (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Lock className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-500">Change your account password</p>
            </div>
          </div>
          <Button
            onClick={() => setIsChangingPassword(true)}
            variant="outline"
          >
            Change Password
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
            <Button
              onClick={() => {
                setIsChangingPassword(false)
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setError('')
                setMessage('')
              }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter current password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                type="submit"
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}