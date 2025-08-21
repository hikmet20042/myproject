'use client'

import { useState, useEffect } from 'react'
import NotificationModal from '@/components/NotificationModal'
import EnhancedDraftManager from '@/components/EnhancedDraftManager'
import DraftAnalytics from '@/components/DraftAnalytics'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Bell,
  User,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  BarChart3,
  Shield,
  Download,
  Upload,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Bookmark,
  Archive,
  Star,

  Zap,
  Globe,
  Lock,
  Camera,
  Edit3,
  Save,
  X,
  Plus,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react'

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

export default function ProfilePage() {
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
  const pathname = usePathname()

  // Get active tab from URL, default to 'profile'
  const getActiveTabFromUrl = () => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'drafts', 'analytics', 'articles', 'stories', 'notifications', 'settings'].includes(tab)) {
      return tab
    }
    return 'profile'
  }

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

  // Load data for specific tab
  const loadTabData = async (tab: string) => {
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
  }

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

  const [articles, setArticles] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
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
    socialLinks: ''
  })

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/drafts')
      if (response.ok) {
        const data = await response.json()
        setDrafts(data.drafts || [])
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }

  const loadProfileStats = async () => {
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
  }



  const loadPreferences = async () => {
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
            showStats: true,
            showActivity: true,
          },
          notifications: {
            email: { enabled: true },
            push: { enabled: true },
            inApp: { enabled: true }
          },
          writing: {
            defaultPrivacy: 'public'
          },
          interface: {
            theme: 'light'
          }
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      // Set default preferences on error
      setPreferences({
        privacy: {
          publicProfile: true,
          showEmail: false,
          showStats: true,
          showActivity: true,
        },
        notifications: {
          email: { enabled: true },
          push: { enabled: true },
          inApp: { enabled: true }
        },
        writing: {
          defaultPrivacy: 'public'
        },
        interface: {
          theme: 'light'
        }
      })
    } finally {
      setPreferencesLoading(false)
    }
  }

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
  }, [searchParams, activeTab, loadingTab])

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
  }, [status, session, router])

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
          avatar: data.profile?.avatar || '',
          socialLinks: data.profile?.socialLinks || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }


  const loadUserArticles = async () => {
    try {
      const response = await fetch('/api/articles/user?status=submitted')
      if (response.ok) {
        const data = await response.json()
        // Only show articles with a status (submitted, approved, or rejected)
        const submittedArticles = (data.results || []).filter((article: any) =>
          ['pending', 'approved', 'rejected'].includes(article.status)
        )
        setArticles(submittedArticles)
      }
    } catch (error) {
      console.error('Error loading user articles:', error)
    }
  }

  const loadUserStories = async () => {
    try {

      const response = await fetch('/api/stories/user')
      if (response.ok) {
        const data = await response.json()
        setStories(data.results || [])
      }
    } catch (error) {
      console.error('Error loading user stories:', error)
    } finally {

    }
  }

  const loadNotifications = async () => {
    try {

      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditing(false)
        loadProfile()
      }
    } catch (error) {
      console.error('Error saving profile:', error)
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
    router.push(`/edit/article/${draftId}`);
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

  const handleEditRejectedStory = async (storyId: string) => {
    try {
      // Call API to convert rejected story to draft
      const response = await fetch('/api/stories/edit-rejected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any existing draft data from localStorage
        localStorage.removeItem('draftStory');
        localStorage.removeItem('currentStoryDraftId');
        localStorage.removeItem('currentStoryEditId');
        localStorage.removeItem('storyStep1Data');
        localStorage.removeItem('storyStep2Data');

        // Set the ID of the story to be edited
        localStorage.setItem('currentStoryEditId', storyId);

        // Refresh stories list to show updated status
        await loadUserStories();

        // Navigate to the edit page for the story
        router.push(`/edit/story/${storyId}`);
      } else {
        alert(data.error || 'Failed to convert story to draft');
      }
    } catch (error) {
      console.error('Error converting rejected story to draft:', error);
      alert('Failed to convert story to draft. Please try again.');
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
              <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profileStats.totalDrafts}</div>
                  <div className="text-sm text-gray-500">Drafts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profileStats.totalArticles}</div>
                  <div className="text-sm text-gray-500">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{profileStats.totalStories}</div>
                  <div className="text-sm text-gray-500">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{profileStats.totalViews}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{profileStats.totalLikes}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
              </div>
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
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
                {resendSuccess && <div className="mt-2 text-green-700">{resendSuccess}</div>}
                {resendError && <div className="mt-2 text-red-700">{resendError}</div>}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  {!loading && (
                    <button
                      onClick={() => setEditing(!editing)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {editing ? 'Cancel' : 'Edit Profile'}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-4">
                {loading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  editing ? (
                    <div className="space-y-6">
                      {/* Avatar Upload Section */}
                      <div className="flex items-center space-x-6">
                        <div className="shrink-0">
                          <img
                            className="h-20 w-20 rounded-full object-cover"
                            src={
                              formData.avatar ||
                              profile.profile?.avatarUrl ||
                              profile.profile?.avatar ||
                              profile.user.image ||
                              '/default-avatar.png'
                            }
                            alt="Profile"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Picture
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const uploadFormData = new FormData();
                                uploadFormData.append('file', file);
                                uploadFormData.append('alt', 'Profile picture');
                                uploadFormData.append('description', 'User profile avatar');
                                uploadFormData.append('context', 'profile'); // Use blob storage for privacy

                                try {
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: uploadFormData,
                                  });
                                  const data = await response.json();
                                  if (data.url) {
                                    // Store the blob URL instead of file path
                                    setFormData(prev => ({ ...prev, avatar: data.url }));
                                  } else {
                                    console.error('Upload failed:', data.error);
                                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                                  }
                                } catch (error) {
                                  console.error('Upload failed:', error);
                                  alert('Upload failed. Please try again.');
                                }
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB. Images are stored securely in the database.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={profile.user.email}
                            disabled
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Occupation</label>
                          <input
                            type="text"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <input
                            type="text"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          rows={4}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Interests</label>
                        <input
                          type="text"
                          value={formData.interests}
                          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                          placeholder="e.g., Gender equality, Women's rights, Activism"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Social Links</label>
                        <input
                          type="text"
                          value={formData.socialLinks}
                          onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                          placeholder="e.g., https://twitter.com/username, https://linkedin.com/in/username"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.user.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {profile.profile?.website ? (
                              <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500">
                                {profile.profile.website}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.dateOfBirth || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.gender || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Occupation</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.occupation || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.organization || 'Not specified'}</p>
                        </div>
                      </div>
                      {profile.profile?.bio && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bio</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile.bio}</p>
                        </div>
                      )}
                      {profile.profile?.interests && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Interests</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile.interests}</p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
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
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Submitted Articles</h2>
                <p className="text-sm text-gray-600 mt-1">Track the status of your submitted articles</p>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'articles' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                articles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No submitted articles</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't submitted any articles for review yet. Start by creating and submitting your first article.
                    </p>
                    <div className="mt-6">
                      {isUnverified ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                          tabIndex={-1}
                          aria-disabled="true"
                        >
                          Submit an Article
                        </button>
                      ) : (
                        <a
                          href="/submit/article"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                          Submit an Article
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div key={article._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                                {getStatusIcon(article.status)}
                                <span className="ml-1 capitalize">{article.status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{article.title}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted on {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}
                            </p>
                            {article.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {article.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex space-x-2">
                              {/* Allow editing for pending and rejected articles */}
                              {article.status === 'pending' && (
                                <a
                                  href={`/edit/article/${article._id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Article
                                </a>
                              )}
                              {article.status === 'rejected' && (
                                <button
                                  onClick={() => handleEditRejectedArticle(article._id)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Edit & Resubmit
                                </button>
                              )}
                              {article.status === 'approved' && (
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                                  Published (Cannot Edit)
                                </span>
                              )}
                              {/* Allow deletion for all user's articles */}
                              <button
                                onClick={() => setDeleteConfirm({ type: 'article', id: article._id, title: article.title })}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                
              </div>
            </div>
          )}


          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Stories</h2>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'stories' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No stories yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by submitting a story.
                    </p>
                    <div className="mt-6">
                      {isUnverified ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                          tabIndex={-1}
                          aria-disabled="true"
                        >
                          Submit a Story
                        </button>
                      ) : (
                        <a
                          href="/submit/story"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                          Submit a Story
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <div key={story._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                                {getStatusIcon(story.status)}
                                <span className="ml-1 capitalize">{story.status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{story.title}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted on {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ''}
                            </p>
                            {story.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {story.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex space-x-2">
                              {/* Allow editing for pending and rejected stories */}
                              {story.status === 'pending' && (
                                <a
                                  href={`/edit/story/${story._id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Story
                                </a>
                              )}
                              {story.status === 'rejected' && (
                                <button
                                  onClick={() => handleEditRejectedStory(story._id)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Edit & Resubmit
                                </button>
                              )}
                              {story.status === 'approved' && (
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                                  Published (Cannot Edit)
                                </span>
                              )}
                              {/* Allow deletion for all user's stories */}
                              <button
                                onClick={() => setDeleteConfirm({ type: 'story', id: story._id, title: story.title })}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'notifications' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border border-gray-200 rounded-lg p-4 ${!notification.isRead ? 'bg-blue-50' : ''
                          } cursor-pointer`}
                        onClick={() => { setModalNotification(notification); setModalOpen(true); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Only show mark as read/unread in modal, not in list, to avoid double request */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
              {/* Notification Modal */}
              <NotificationModal
                open={modalOpen && !!modalNotification}
                onClose={() => setModalOpen(false)}
                title={modalNotification?.title || ''}
                message={modalNotification?.message || ''}
                createdAt={modalNotification?.createdAt || ''}
                isRead={modalNotification?.isRead}
                onMarkRead={modalNotification && !modalNotification.isRead ? () => {
                  const notifId = modalNotification.id || modalNotification._id;
                  if (notifId) toggleNotificationRead(notifId, true);
                  setModalOpen(false);
                } : undefined}
                onMarkUnread={modalNotification && modalNotification.isRead ? () => {
                  const notifId = modalNotification.id || modalNotification._id;
                  if (notifId) toggleNotificationRead(notifId, false);
                  setModalOpen(false);
                } : undefined}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
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
                                ...preferences.privacy,
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
                                ...preferences.privacy,
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
                                ...preferences.privacy,
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
                                ...preferences.notifications,
                                email: {
                                  ...preferences.notifications?.email,
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
                                ...preferences.notifications,
                                push: {
                                  ...preferences.notifications?.push,
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
                                ...preferences.notifications,
                                inApp: {
                                  ...preferences.notifications?.inApp,
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
                                ...preferences.writing,
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

                  {/* Save Settings */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => savePreferences()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save All Settings
                      </button>
                      <button
                        onClick={() => savePreferences('privacy')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Save Privacy Only
                      </button>
                    </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
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
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
