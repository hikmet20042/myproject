'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
 
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
 
  Shield,
 
  Plus,
  
  Loader2,
} from 'lucide-react'
import Stats from '@/components/Profile/Stats'
import TabNavigation from '@/components/Profile/TabNavigation'
import Profile from '@/components/Profile/Profile'
import Blogs from '@/components/Profile/Blogs'
import Notifications from '@/components/Profile/Notifications'
import SettingsTab from '@/components/Profile/SettingsTab'
import { Button } from '@/components/ui/Button'

interface UserProfile {
  user: {
    id: string
    email: string
    name: string
    image: string
    role: string
    emailVerified: string
    createdAt: string
  }
  profile: {
    bio: string
    location: string
    website: string
    phone: string
    dateOfBirth?: string
    gender?: string
    occupation?: string
    organization: string
    interests?: string
    avatar?: string
    avatarUrl?: string // Virtual field from UserProfile model
    socialLinks?: string
    socialMedia?: {
      facebook: string
      twitter: string
      instagram: string
      linkedin: string
      youtube: string
      website: string
    }
    // NGO-specific fields
    registrationNumber?: string
    focusAreas?: string[]
    status?: string
    contactPerson?: string
  } | null
  isNGO?: boolean
}

interface Notification {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function ProfilePageContent() {
  // Notification modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);
  // Email verification resend state (must be at the very top, before any conditional returns)
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get active tab from URL, default to 'profile'
  const getActiveTabFromUrl = useCallback(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'blogs', 'notifications', 'settings'].includes(tab)) {
      return tab
    }
    return 'profile'
  }, [searchParams])

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl())
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileStats, setProfileStats] = useState({
    totalBlogs: 0,
    joinedDate: '',
    lastActive: '',
    writingStreak: 0
  })

  const [achievements, setAchievements] = useState<any[]>([])
  const [preferences, setPreferences] = useState<any>(null)

  // Main loading state
  const [loading, setLoading] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(true)

  // Tab switching state - track which tab is being loaded
  const [loadingTab, setLoadingTab] = useState<string | null>(null)

  // State for tab content
    const [blogs, setBlogs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load functions
  const loadProfileStats = useCallback(async () => {
    try {
      const response = await fetch('/api/users/profile/stats')
      if (response.ok) {
        const data = await response.json()
        setProfileStats(data.stats)
        setAchievements(data.stats.achievements || [])
      } else {
        // Fallback to calculated stats


        setProfileStats({
          totalBlogs: blogs.length,
          joinedDate: profile?.user?.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          writingStreak: Math.floor(Math.random() * 30) + 1
        })
      }
    } catch (error) {
      console.error('Error loading profile stats:', error)
    }
  }, [])

  const loadPreferences = useCallback(async () => {
    try {
      setPreferencesLoading(true)
      const response = await fetch('/api/users/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      } else {
        // Set default preferences if API fails
        setPreferences({
          privacy: {
            publicProfile: true,
            showEmail: false,
            showPhone: false,
            showLocation: true
          },
          notifications: {
            email: true,
            push: true,
            marketing: false
          },
          display: {
            theme: 'light',
            language: 'en'
          }
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setPreferencesLoading(false)
    }
  }, [])

  
  const loadUserBlogs = useCallback(async () => {
    try {
      const response = await fetch('/api/blogs/user')
      if (response.ok) {
        const data = await response.json()
        setBlogs(data.results || [])
      }
    } catch (error) {
      console.error('Error loading user blogs:', error)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [])

  // Load data for specific tab
  const loadTabData = useCallback(async (tab: string) => {
    switch (tab) {
            case 'blogs':
        if (blogs.length === 0) {
          await loadUserBlogs()
        }
        break
      case 'notifications':
        if (notifications.length === 0) {
          await loadNotifications()
        }
        break
      case 'settings':
        if (!preferences) {
          await loadPreferences()
        }
        break
    }
  }, [blogs.length, notifications.length, preferences, loadUserBlogs, loadNotifications])

  // Handle tab change with URL update and loading state
  const handleTabChange = (tab: string) => {
    if (tab === activeTab || loadingTab) return // Don't switch if already on the tab or currently switching

    setLoadingTab(tab)

    // Load data for the new tab first
    loadTabData(tab).finally(() => {
      // Update URL and active tab only after data is loaded
      const newUrl = tab === 'profile' ? '/profile' : `/profile?tab=${tab}`
      router.push(newUrl)
      setActiveTab(tab)
      setLoadingTab(null)
    })
  }

  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'blog', id: string, title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    organization: '',
    interests: '',
    avatar: '',
    socialLinks: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      website: ''
    },
    // NGO-specific fields
    registrationNumber: '',
    focusAreas: [] as string[],
    status: '',
    contactPerson: ''
  })



  const savePreferences = async (section?: string) => {
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: section ? preferences[section] : preferences,
          section
        }),
      })

      if (response.ok) {
        // Show success message
        console.log('Preferences saved successfully')
      } else {
        console.error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const deleteBlog = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/blogs?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setBlogs(blogs.filter(blog => blog._id !== id))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete blog')
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('Failed to delete blog')
    } finally {
      setDeleting(false)
    }
  }

  // Update active tab when URL changes (browser navigation or direct URL access)
  useEffect(() => {
    const newTab = getActiveTabFromUrl()
    if (newTab !== activeTab && !loadingTab) {
      setActiveTab(newTab)
      // Load data for the new tab
      loadTabData(newTab)
    }
  }, [getActiveTabFromUrl, searchParams, activeTab, loadingTab])

  // Handle notification parameter from URL (when coming from header dropdown)
  useEffect(() => {
    const notificationId = searchParams.get('notification')
    if (notificationId && notifications.length > 0) {
      const notification = notifications.find(n => (n.id || n._id) === notificationId)
      if (notification) {
        setModalNotification(notification)
        setModalOpen(true)
        // Remove notification parameter from URL without page reload
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('notification')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, [searchParams, notifications])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Allow NGO users to access profile page
    // NGO users can view their profile alongside their dashboard

    // Load essential data first (profile, preferences, and stats)
    const loadEssentialData = async () => {
      await Promise.all([
        loadProfile(),
        loadPreferences(),
        loadProfileStats() // Load stats initially for the profile tab
      ])

      // Then load data for the current tab
      loadTabData(activeTab)
    }

    loadEssentialData()
  }, [status, session, router]) // Removed activeTab, loadProfileStats, loadTabData, loadPreferences from dependencies

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.user.name || '',
          bio: data.profile?.bio || '',
          location: data.profile?.location || '',
          website: data.profile?.website || '',
          phone: data.profile?.phone || '',
          dateOfBirth: data.profile?.dateOfBirth || '',
          gender: data.profile?.gender || '',
          occupation: data.profile?.occupation || '',
          organization: data.profile?.organization || '',
          interests: data.profile?.interests || '',
          avatar: data.profile?.avatarUrl || data.profile?.avatar || '',
          socialMedia: {
            facebook: data.profile?.socialMedia?.facebook || '',
            twitter: data.profile?.socialMedia?.twitter || '',
            instagram: data.profile?.socialMedia?.instagram || '',
            linkedin: data.profile?.socialMedia?.linkedin || '',
            youtube: data.profile?.socialMedia?.youtube || '',
            website: data.profile?.socialMedia?.website || ''
          },
          socialLinks: data.profile?.socialLinks || '',
          // NGO-specific fields
          registrationNumber: data.profile?.registrationNumber || '',
          focusAreas: data.profile?.focusAreas || [],
          status: data.profile?.status || '',
          contactPerson: data.profile?.contactPerson || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }




  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile with data:', formData)
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      console.log('Save response:', result)

      if (response.ok) {
        setEditing(false)
        await loadProfile()
        // Show success message
        alert('Profile updated successfully!')
      } else {
        console.error('Save failed:', result)
        alert(`Failed to save profile: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    }
  }

  // Toggle notification read/unread
  const toggleNotificationRead = async (notificationId: string, isRead: boolean) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notification) {
          setNotifications((prev) => prev.map(n => (n.id === data.notification._id || n._id === data.notification._id) ? { ...n, isRead: data.notification.isRead } : n));
        } else {
          loadNotifications();
        }
      } else {
        loadNotifications();
      }
    } catch (error) {
      // Optionally show error
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          </div>
        </div>
      </div>
    )
  }


  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setResendError('');
    try {
      const res = await fetch('/api/auth/verify-request', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResendSuccess('Verification email sent! Please check your inbox.');
      } else {
        setResendError(data.error || 'Failed to send verification email');
      }
    } catch (e) {
      setResendError('Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  



  // Block submit if not verified
  const isUnverified = profile && !profile.user.emailVerified;

  // Only one main return at the end of the component
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Enhanced Profile Header */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-8">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.user.name}</h1>
                  <p className="text-gray-600">{profile.user.email}</p>
                  {profile.profile?.bio && (
                    <p className="text-gray-700 mt-2">{profile.profile.bio}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      Active
                    </span>
                    {profile.user.role === 'admin' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      Joined {new Date(profileStats.joinedDate || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <Stats profileStats={profileStats}/>
            </div>
          </div>
          {isUnverified && (
            <div className="mb-8 bg-yellow-50 border border-yellow-300 rounded-md p-4 flex items-center">
              <svg className="h-6 w-6 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <div className="flex-1">
                <div className="text-sm text-yellow-800">
                  <strong>Your email is not verified.</strong> You cannot submit blogs until you verify your email.<br />
                  <span className="block mt-1">Please check your inbox (and spam folder) for a verification email.</span>
                </div>
                <Button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-3 bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                {resendSuccess && <div className="mt-2 text-green-700">{resendSuccess}</div>}
                {resendError && <div className="mt-2 text-blue-700">{resendError}</div>}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation handleTabChange={handleTabChange} loadingTab= {loadingTab } activeTab={activeTab} notifications={notifications} userRole={profile?.user?.role}/>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
           <Profile loading={loading} setEditing={setEditing} editing={editing} formData={formData}  profile={profile} setFormData={setFormData}  handleSaveProfile={handleSaveProfile}/>

          )}



          {/* Blogs Tab */}
          {activeTab === 'blogs' && profile?.user?.role !== 'ngo' && (
           <Blogs loadingTab={loadingTab} blogs={blogs} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} setDeleteConfirm={setDeleteConfirm} />

          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Notifications 
            notifications={notifications}
            setModalNotification={setModalNotification}
            setModalOpen={setModalOpen}
            modalNotification={modalNotification}
            modalOpen={modalOpen}
            toggleNotificationRead={toggleNotificationRead}
            loadingTab={loadingTab}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab
            loadingTab={loadingTab}
            preferences={preferences}
            setPreferences={setPreferences}
            savePreferences={savePreferences}
            

            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Trash2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Blog
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteBlog(deleteConfirm.id)}
                  disabled={deleting}
                  variant="danger"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProfilePageContent />
    </Suspense>
  )
}
