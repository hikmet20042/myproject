'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Shield,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
  Edit3,
  Mail,
  AlertCircle
} from 'lucide-react'
import Stats from '@/components/Profile/Stats'
import TabNavigation from '@/components/Profile/TabNavigation'
import Profile from '@/components/Profile/Profile'
import Blogs from '@/components/Profile/Blogs'
import Notifications from '@/components/Profile/Notifications'
import SettingsTab from '@/components/Profile/SettingsTab'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState, AnimatedBackground, StatusBadge } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

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
  const { t } = useLanguage();
  const localePath = useLocalizedPath();

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
    const tab = searchParams?.get('tab')
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

  // Main loading state
  const [loading, setLoading] = useState(true)

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
  }, [blogs.length, profile?.user?.createdAt])




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
    }
  }, [blogs.length, notifications.length, loadUserBlogs, loadNotifications])

  // Handle tab change - just update URL, let effect handle loading
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab || loadingTab) return
    const newUrl = tab === 'profile' ? '/profile' : `/profile?tab=${tab}`
    router.push(newUrl)
  }, [activeTab, loadingTab, router])

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

  const loadedTabsRef = useRef(new Set<string>());

  // Sync activeTab with URL and load data
  useEffect(() => {
    const newTab = getActiveTabFromUrl()

    // If tab changed via URL (or initial load), update state
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }

    // Load data if not already loaded based on our ref tracking
    if (status === 'authenticated') {
      const shouldLoad = (newTab === 'blogs' || newTab === 'notifications') && !loadedTabsRef.current.has(newTab);

      if (shouldLoad && !loadingTab) {
        setLoadingTab(newTab)
        loadTabData(newTab).finally(() => {
          // Mark as loaded regardless of success/empty result to prevent loops
          loadedTabsRef.current.add(newTab)
          setLoadingTab(null)
        })
      }
    }
  }, [getActiveTabFromUrl, activeTab, status, loadTabData, loadingTab]) // Removed data lengths from dependencies

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
        alert(data.error || t('profile.deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert(t('profile.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  // Handle notification parameter from URL (when coming from header dropdown)
  useEffect(() => {
    const notificationId = searchParams?.get('notification')
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
      router.push(localePath("/auth/signin"))
      return
    }

    // Allow NGO users to access profile page
    // NGO users can view their profile alongside their dashboard

    // Load essential data first (profile, preferences, and stats)
    const loadEssentialData = async () => {
      // Only load if we haven't loaded yet or if forced
      if (!profile) {
        await loadProfile()
      }
      // Always reload stats to ensure freshness
      await loadProfileStats()
    }

    loadEssentialData()
  }, [status, session?.user?.email, router]) // Use primitive dependency for session

  const loadProfile = useCallback(async () => {
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
  }, [])




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
        alert(t('profile.profileUpdated'))
      } else {
        console.error('Save failed:', result)
        alert(`${t('profile.failedToSave')}: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert(t('profile.failedToSave'))
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

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
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
      <LoadingState
        text={t('common.loading')}
        gradientFrom="from-blue-50"
        gradientVia="via-indigo-50"
        gradientTo="to-purple-50"
        spinnerColor="border-blue-600"
      />
    )
  }

  if (!profile) {
    return (
      <ErrorState
        title={t('profile.profileNotFound')}
        message={t('profile.profileNotFoundMessage') || 'Unable to load profile information.'}
        onRetry={() => router.push(localePath("/"))}
        retryText={t('common.backToHome')}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
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
        setResendSuccess(t('profile.verificationEmailSent'));
      } else {
        setResendError(data.error || t('profile.failedToSend'));
      }
    } catch (e) {
      setResendError(t('profile.failedToSend'));
    } finally {
      setResendLoading(false);
    }
  };





  // Block submit if not verified
  const isUnverified = profile && !profile.user.emailVerified;

  // Only one main return at the end of the component
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Engaging Hero Header with Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900">
        {/* Animated Background */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-pink-500',
            blob2: 'bg-blue-400',
            blob3: 'bg-purple-500'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group animate-fade-in">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl sm:text-5xl font-black shadow-2xl ring-4 ring-white">
                {profile.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {profile.user.role === 'admin' && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 animate-fade-in animation-delay-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
                    {profile.user.name}
                  </h1>
                  <p className="text-sm sm:text-base text-blue-100 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.user.email}
                  </p>
                </div>
              </div>

              {profile.profile?.bio && (
                <p className="text-sm sm:text-base text-blue-100 mb-4 max-w-2xl leading-relaxed">
                  {profile.profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {t('profile.active')}
                </span>
                {profile.user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-purple-100 text-purple-800">
                    <Shield className="w-4 h-4" />
                    {t('profile.admin')}
                  </span>
                )}
                {session?.user?.isApprovedNGO && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-indigo-100 text-indigo-800">
                    <Award className="w-4 h-4" />
                    {t('profile.ngoAccount')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white/20 backdrop-blur-md text-white">
                  {t('profile.joined')} {new Date(profileStats.joinedDate || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>


        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6">
        <div className="pb-6 sm:pb-12">
          {/* Email Verification Banner */}
          {isUnverified && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base text-yellow-900">
                    <strong className="font-bold">{t('profile.emailNotVerified')}</strong>
                    <span className="block mt-1">{t('profile.cannotSubmitBlogs')}</span>
                    <span className="block mt-1 text-yellow-800">{t('profile.checkInbox')}</span>
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    variant="primary"
                    size="sm"
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600"
                  >
                    {resendLoading ? t('profile.sending') : t('profile.resendVerificationEmail')}
                  </Button>
                  {resendSuccess && <div className="mt-2 text-sm text-green-700 font-medium">{resendSuccess}</div>}
                  {resendError && <div className="mt-2 text-sm text-blue-700 font-medium">{resendError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation handleTabChange={handleTabChange} loadingTab={loadingTab} activeTab={activeTab} notifications={notifications} userRole={profile?.user?.role} isNGO={session?.user?.isApprovedNGO} />

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Profile loading={loading} setEditing={setEditing} editing={editing} formData={formData} profile={profile} setFormData={setFormData} handleSaveProfile={handleSaveProfile} />

          )}



          {/* Blogs Tab */}
          {activeTab === 'blogs' && !session?.user?.isApprovedNGO && (
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
              markAllAsRead={markAllAsRead}
              loadingTab={loadingTab}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab
              loadingTab={loadingTab}


            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="relative w-full max-w-md mx-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced modal with gradient border effect */}
            <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
              {/* Gradient header */}
              <div className="relative h-32 bg-gradient-to-br from-red-600 via-red-700 to-pink-800 overflow-hidden">
                {/* Animated background blobs */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>

                {/* Icon container */}
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                    <Trash2 className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">
                    {t('profile.deleteBlog')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed px-2">
                    {t('profile.deleteConfirmation', { title: deleteConfirm.title })}
                  </p>
                </div>

                {/* Warning badge */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    This action cannot be undone. All data will be permanently deleted.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <Button
                    onClick={() => setDeleteConfirm(null)}
                    variant="secondary"
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    {t('profile.cancel')}
                  </Button>
                  <Button
                    onClick={() => deleteBlog(deleteConfirm.id)}
                    disabled={deleting}
                    variant="danger"
                    className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 disabled:from-gray-400 disabled:to-gray-500"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {t('profile.deleting')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('profile.delete')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const localePath = useLocalizedPath()
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProfilePageContent />
    </Suspense>
  )
}
