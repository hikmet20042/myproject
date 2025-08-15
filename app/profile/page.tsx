'use client'

import { useState, useEffect } from 'react'
import NotificationModal from '@/components/NotificationModal'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, User, Settings, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

interface UserProfile {
  user: {
    id: string
    email: string
    name: string
    image: string
    role: string
    emailVerified: string
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
    socialLinks: string
  } | null
}

interface Submission {
  id: string
  type: 'story' | 'article'
  title: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment: string
  createdAt: string
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
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
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

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    loadProfile()
    loadUserArticles()
    loadUserStories()
    loadNotifications()
    loadDrafts()
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
      const response = await fetch('/api/articles/user')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.results || [])
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
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
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drafts'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Drafts
                {drafts.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-1">
                    {drafts.length}
                  </span>
                )}
              </button>
          
              <button
                onClick={() => setActiveTab('articles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'articles'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                My Articles
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stories'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                My Stories
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
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
                  <button
                    onClick={() => setEditing(!editing)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {editing ? (
                  <div className="space-y-6">
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
                )}
              </div>
            </div>
          )}

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Drafts</h2>
              </div>
              <div className="px-6 py-4">
                {drafts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start writing an article or story to see your drafts here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drafts.map((draft) => (
                      <div key={draft._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Draft
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{draft.title || '(Untitled Draft)'}</h3>
                            <p className="text-sm text-gray-500">
                              Last edited {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : ''}
                            </p>
                            {draft.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {draft.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2">
                              <a
                                href={draft.category === 'story' ? `/submit/story?draft=${draft._id}` : `/submit/article?draft=${draft._id}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              >
                                Edit Draft
                              </a>
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

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Articles</h2>
              </div>
              <div className="px-6 py-4">
                {articles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No articles yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by submitting an article.
                    </p>
                    <div className="mt-6">
                      <a
                        href="#"
                        onClick={e => { if (isUnverified) { e.preventDefault(); } }}
                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isUnverified ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                        tabIndex={isUnverified ? -1 : 0}
                        aria-disabled={isUnverified}
                      >
                        Submit an Article
                      </a>
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
                            {/* Allow editing only if status is pending */}
                            {article.status === 'pending' && (
                              <div className="mt-2">
                                <a
                                  href={`/submit/article?edit=${article._id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Article
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {stories.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No stories yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by submitting a story.
                    </p>
                    <div className="mt-6">
                      <a
                        href="#"
                        onClick={e => { if (isUnverified) { e.preventDefault(); } }}
                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isUnverified ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                        tabIndex={isUnverified ? -1 : 0}
                        aria-disabled={isUnverified}
                      >
                        Submit a Story
                      </a>
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
                            {/* Allow editing only if status is pending */}
                            {story.status === 'pending' && (
                              <div className="mt-2">
                                <a
                                  href={`/submit/story?edit=${story._id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Story
                                </a>
                              </div>
                            )}
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
                {notifications.length === 0 ? (
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
                        className={`border border-gray-200 rounded-lg p-4 ${
                          !notification.isRead ? 'bg-blue-50' : ''
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
        </div>
      </div>
    </div>

  )
}
