'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import EnhancedDraftManager from '@/components/EnhancedDraftManager'
import DraftAnalytics from '@/components/DraftAnalytics'
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
import Articles from '@/components/Profile/Articles'
import Stories from '@/components/Profile/Stories'
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
    dateOfBirth: string
    gender: string
    occupation: string
    organization: string
    interests: string
    avatar: string
    avatarUrl?: string // Virtual field from UserProfile model
    socialLinks: string
    socialMedia?: {
      facebook: string
      twitter: string
      instagram: string
      linkedin: string
      youtube: string
      website: string
    }
  } | null
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
    if (tab && ['profile', 'drafts', 'analytics', 'articles', 'stories', 'notifications', 'settings'].includes(tab)) {
      return tab
    }
    return 'profile'
  }, [searchParams])

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl())
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileStats, setProfileStats] = useState({
    totalArticles: 0,
    totalStories: 0,
    totalDrafts: 0,
    totalViews: 0,
    totalLikes: 0,
    joinedDate: '',
    lastActive: '',
    writingStreak: 0,
    completedDrafts: 0,
    avgWordsPerDraft: 0
  })

  const [achievements, setAchievements] = useState<any[]>([])
  const [preferences, setPreferences] = useState<any>(null)

  // Main loading state
  const [loading, setLoading] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(true)

  // Tab switching state - track which tab is being loaded
  const [loadingTab, setLoadingTab] = useState<string | null>(null)

  // State for tab content
  const [articles, setArticles] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [drafts, setDrafts] = useState<any[]>([])

  // Load functions
  const loadDrafts = useCallback(async () => {
    try {
      const response = await fetch('/api/drafts')
      if (response.ok) {
        const data = await response.json()
        setDrafts(data.drafts || [])
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }, [])

  const loadProfileStats = useCallback(async () => {
    try {
      const response = await fetch('/api/users/profile/stats')
      if (response.ok) {
        const data = await response.json()
        setProfileStats(data.stats)
        setAchievements(data.stats.achievements || [])
      } else {
        // Fallback to calculated stats
        const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0)
        const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0)

        setProfileStats({
          totalArticles: articles.length,
          totalStories: stories.length,
          totalDrafts: drafts.length,
          totalViews,
          totalLikes,
          joinedDate: profile?.user?.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          writingStreak: Math.floor(Math.random() * 30) + 1,
          completedDrafts: drafts.filter(d => d.status === 'completed').length,
          avgWordsPerDraft: drafts.length > 0 ? Math.floor(Math.random() * 500) + 200 : 0
        })
      }
    } catch (error) {
      console.error('Error loading profile stats:', error)
    }
  }, [articles, stories, drafts, profile])

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

  const loadUserArticles = useCallback(async () => {
    try {
      const response = await fetch('/api/articles/user')
      if (response.ok) {
        const data = await response.json()
        // Only show articles with a status (pending, approved, or rejected)
        const submittedArticles = (data.results || []).filter((article: any) =>
          ['pending', 'approved', 'rejected'].includes(article.status)
        )
        setArticles(submittedArticles)
      }
    } catch (error) {
      console.error('Error loading user articles:', error)
    }
  }, [])

  const loadUserStories = useCallback(async () => {
    try {
      const response = await fetch('/api/stories/user')
      if (response.ok) {
        const data = await response.json()
        setStories(data.results || [])
      }
    } catch (error) {
      console.error('Error loading user stories:', error)
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
      case 'articles':
        if (articles.length === 0) {
          await loadUserArticles()
        }
        break
      case 'stories':
        if (stories.length === 0) {
          await loadUserStories()
        }
        break
      case 'notifications':
        if (notifications.length === 0) {
          await loadNotifications()
        }
        break
      case 'drafts':
        if (drafts.length === 0) {
          await loadDrafts()
        }
        break
      case 'analytics':
        await loadProfileStats()
        break

      case 'settings':
        if (!preferences) {
          await loadPreferences()
        }
        break
    }
  }, [articles.length, stories.length, notifications.length, drafts.length, preferences, loadUserArticles, loadUserStories, loadNotifications, loadDrafts, loadProfileStats, loadPreferences])

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'draft' | 'article' | 'story', id: string, title: string } | null>(null)
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
    }
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

  const deleteDraft = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/drafts?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setDrafts(drafts.filter(draft => draft._id !== id))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete draft')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert('Failed to delete draft')
    } finally {
      setDeleting(false)
    }
  }

  const bulkDeleteDrafts = async (draftIds: string[]) => {
    try {
      // Use bulk delete API
      const response = await fetch('/api/drafts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ draftIds })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete drafts')
      }

      const result = await response.json()
      console.log(`Successfully deleted ${result.deletedCount} drafts`)

      // Update local state to remove deleted drafts
      setDrafts(prev => prev.filter(draft => !draftIds.includes(draft._id)))

    } catch (error) {
      console.error('Error in bulk delete:', error)
      throw error // Re-throw to let the component handle the error display
    }
  }

  const deleteArticle = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setArticles(articles.filter(article => article._id !== id))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete article')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article')
    } finally {
      setDeleting(false)
    }
  }

  const deleteStory = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/stories?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setStories(stories.filter(story => story._id !== id))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Failed to delete story')
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
  }, [getActiveTabFromUrl, loadTabData, searchParams, activeTab, loadingTab])

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
  }, [activeTab, loadProfileStats, loadTabData, loadPreferences, status, session, router])

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
          socialLinks: data.profile?.socialLinks || ''
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
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
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

  const handleDraftEdit = (draftId: string) => {
    // Navigate directly to the edit page for the draft
    router.push(`/edit/article/${draftId}/step1`);
  };


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

  const handleEditRejectedArticle = async (articleId: string) => {
    try {
      // Call API to convert rejected article to draft
      const response = await fetch('/api/articles/edit-rejected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any existing draft data from localStorage
        localStorage.removeItem('draftArticle');
        localStorage.removeItem('currentDraftId');
        localStorage.removeItem('currentEditId');
        localStorage.removeItem('articleStep1Data');
        localStorage.removeItem('articleStep2Data');

        // Set the ID of the article to be edited
        localStorage.setItem('currentEditId', articleId);

        // Refresh articles list to show updated status
        await loadUserArticles();

        // Navigate to the edit page for the article
        router.push(`/edit/article/${articleId}`);
      } else {
        alert(data.error || 'Failed to convert article to draft');
      }
    } catch (error) {
      console.error('Error converting rejected article to draft:', error);
      alert('Failed to convert article to draft. Please try again.');
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
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
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
                  <strong>Your email is not verified.</strong> You cannot submit articles or stories until you verify your email.<br />
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
                {resendError && <div className="mt-2 text-red-700">{resendError}</div>}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation handleTabChange={handleTabChange} loadingTab= {loadingTab } activeTab={activeTab} drafts={drafts} notifications={notifications}/>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
           <Profile loading={loading} setEditing={setEditing} editing={editing} formData={formData}  profile={profile} setFormData={setFormData}  handleSaveProfile={handleSaveProfile}/>

          )}

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Draft Management</h2>
                    <p className="text-gray-600">Organize, search, and manage your drafts efficiently</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="/submit/article/step1"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Article
                    </a>
                    <a
                      href="/submit/story"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Story
                    </a>
                  </div>
                </div>

                {loadingTab === 'drafts' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EnhancedDraftManager
                    initialDrafts={drafts}
                    onDraftEdit={handleDraftEdit}
                    onDraftDelete={(draftId) => {
                      const draft = drafts.find(d => d._id === draftId)
                      setDeleteConfirm({ type: 'draft', id: draftId, title: draft?.title || 'Untitled' })
                    }}
                    onBulkDelete={bulkDeleteDrafts}
                  />
                )}
              </div>
            </div>
          )}



          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {loadingTab === 'analytics' ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <DraftAnalytics userId={session?.user?.id} />
              )}
            </div>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <Articles loadingTab={loadingTab} articles={articles} isUnverified={isUnverified} getStatusIcon={getStatusIcon} handleEditRejectedArticle={handleEditRejectedArticle} getStatusColor={getStatusColor} setDeleteConfirm={setDeleteConfirm} />

          )}


          {/* Stories Tab */}
          {activeTab === 'stories' && (
           <Stories loadingTab={loadingTab} stories={stories} isUnverified={isUnverified} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} setDeleteConfirm={setDeleteConfirm} />

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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete {deleteConfirm.type === 'draft' ? 'Draft' : deleteConfirm.type === 'article' ? 'Article' : 'Story'}
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
                  onClick={() => {
                    if (deleteConfirm.type === 'draft') {
                      deleteDraft(deleteConfirm.id)
                    } else if (deleteConfirm.type === 'article') {
                      deleteArticle(deleteConfirm.id)
                    } else {
                      deleteStory(deleteConfirm.id)
                    }
                  }}
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
