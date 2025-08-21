'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Eye, Users, Search, Filter, Edit, Trash2, Shield, UserCheck, ChevronDown, Calendar, GraduationCap, Briefcase, Tag, SortAsc, SortDesc, MoreHorizontal, Bell, Send, MessageSquare, AlertCircle, Settings, Save, RotateCcw, History, BookOpen, Building } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })


type Article = {
  _id: string
  title: string
  content: string
  contentHtml: string
  tags: string[]
  abstract?: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  author?: string
  isAnonymous?: boolean
  createdAt: string
}

type Story = {
  _id: string
  title: string
  content: string
  contentHtml: string
  tags: string[]
  abstract?: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  author?: string
  isAnonymous?: boolean
  createdAt: string
}

type User = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin' | 'ngo'
  emailVerified: boolean
  createdAt: string

  profile?: {
    bio?: string
    location?: string
    occupation?: string
  }
  stats: {
    articles: number
    stories: number
    totalContent: number
  }
}

type NGO = {
  _id: string
  name: string
  email: string
  role: 'ngo'
  emailVerified: boolean
  createdAt: string
  ngoProfile: {
    organizationName: string
    description: string
    website?: string
    contactPhone?: string
    address?: string
    registrationNumber?: string
    focusAreas: string[]
    isApproved: boolean
    approvedAt?: string
    approvedBy?: string
    rejectedAt?: string
    rejectionReason?: string
  }
}

type Notification = {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  } | null
  type: string
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
}

type SiteSettings = {
  _id: string
  siteInfo: {
    siteName: string
    siteDescription: string
    siteUrl: string
    logoUrl?: string
    faviconUrl?: string
    contactEmail: string
    supportEmail: string
    socialLinks: {
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
      youtube?: string
    }
  }
  contentPolicies: {
    requireApproval: boolean
    autoApproveVerifiedUsers: boolean
    maxArticleLength: number
    maxStoryLength: number
    allowedFileTypes: string[]
    maxFileSize: number
    moderationKeywords: string[]
    bannedWords: string[]
    enableProfanityFilter: boolean
    enableSpamDetection: boolean
  }
  userManagement: {
    allowRegistration: boolean
    requireEmailVerification: boolean
    defaultUserRole: 'user' | 'contributor'
    maxUsersPerDay: number
    enableUserSuspension: boolean
    suspensionReasons: string[]
    enableUserDeletion: boolean
    dataRetentionDays: number
  }
  notifications: {
    enableEmailNotifications: boolean
    enablePushNotifications: boolean
    emailProvider: 'smtp' | 'sendgrid' | 'mailgun'
    emailConfig: {
      host?: string
      port?: number
      secure?: boolean
      username?: string
      password?: string
      apiKey?: string
    }
    defaultNotificationSettings: {
      articleApproved: boolean
      articleRejected: boolean
      newFollower: boolean
      systemUpdates: boolean
    }
  }
  security: {
    enableTwoFactor: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
    enableCaptcha: boolean
    captchaProvider: 'recaptcha' | 'hcaptcha'
    captchaConfig: {
      siteKey?: string
      secretKey?: string
    }
    enableRateLimit: boolean
    rateLimitConfig: {
      windowMs: number
      maxRequests: number
    }
  }
  features: {
    enableComments: boolean
    enableLikes: boolean
    enableSharing: boolean
    enableBookmarks: boolean
    enableFollowing: boolean
    enableDrafts: boolean
    enableCollaboration: boolean
    enableVersioning: boolean
    enableAI: boolean
    enableTranslation: boolean
  }
  lastUpdated: string
  updatedBy: {
    _id: string
    name: string
    email: string
  }
  version: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('articles')
  const [articles, setArticles] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [ngos, setNgos] = useState<NGO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Article | Story | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [tabLoading, setTabLoading] = useState(false)
  
  // User management states
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userAction, setUserAction] = useState<'role' | 'delete' | null>(null)

  // Content management states
  const [contentSearch, setContentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null)
  const [bulkComment, setBulkComment] = useState('')
  const [availableFilters, setAvailableFilters] = useState<{tags: string[], authors: string[]}>({tags: [], authors: []})
  const [showFilters, setShowFilters] = useState(false)

  // Notification management states
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationStats, setNotificationStats] = useState<{total: number, unread: number, read: number, today: number}>({total: 0, unread: 0, read: 0, today: 0})
  const [ngoStats, setNgoStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [ngoPagination, setNgoPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null)
  const [showNgoModal, setShowNgoModal] = useState(false)
  const [ngoAction, setNgoAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Event management states
  const [events, setEvents] = useState<any[]>([])
  const [eventStats, setEventStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [eventPagination, setEventPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventAction, setEventAction] = useState<'approve' | 'reject' | null>(null)
  const [eventRejectionReason, setEventRejectionReason] = useState('')

  // Training management states
  const [trainings, setTrainings] = useState<any[]>([])
  const [trainingStats, setTrainingStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [trainingPagination, setTrainingPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [trainingAction, setTrainingAction] = useState<'approve' | 'reject' | null>(null)
  const [trainingRejectionReason, setTrainingRejectionReason] = useState('')

  // Vacancy management states
  const [vacancies, setVacancies] = useState<any[]>([])
  const [vacancyStats, setVacancyStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [vacancyPagination, setVacancyPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedVacancy, setSelectedVacancy] = useState<any | null>(null)
  const [showVacancyModal, setShowVacancyModal] = useState(false)
  const [vacancyAction, setVacancyAction] = useState<'approve' | 'reject' | null>(null)
  const [vacancyRejectionReason, setVacancyRejectionReason] = useState('')

  const [notificationPagination, setNotificationPagination] = useState({ page: 1, totalPages: 1 })
  const [notificationFilters, setNotificationFilters] = useState({
    type: 'all',
    userId: '',
    isRead: 'all'
  })
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    type: 'announcement',
    title: '',
    message: '',
    targetUsers: 'all',
    target: 'all',
    userIds: ''
  })
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)

  // Settings management states
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [activeSettingsSection, setActiveSettingsSection] = useState('siteInfo')
  const [settingsChanged, setSettingsChanged] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsHistory, setSettingsHistory] = useState<any[]>([])
  const [showSettingsHistory, setShowSettingsHistory] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'admin') {
      router.push('/')
      return
    }

    loadSubmissions()
  }, [status, session, router])

  // Load data when tab changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      loadSubmissions()
    }
  }, [activeTab])

  // Reload data when filters change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      if (activeTab === 'articles') {
        loadArticles();
      } else if (activeTab === 'stories') {
        loadStories();
      }
    }
  }, [contentSearch, statusFilter, authorFilter, tagFilter, dateFromFilter, dateToFilter, sortBy, sortOrder])

  // Reload users when user filters change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin' && activeTab === 'users') {
      loadUsers();
    }
  }, [userSearch, userRoleFilter, userPagination.page])

  const loadSubmissions = async () => {
    setTabLoading(true);
    try {
      if (activeTab === 'articles') {
        await loadArticles();
      } else if (activeTab === 'stories') {
        await loadStories();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'ngos') {
        await loadNgos();
      } else if (activeTab === 'events') {
        await loadEvents();
      } else if (activeTab === 'trainings') {
        await loadTrainings();
      } else if (activeTab === 'vacancies') {
        await loadVacancies();
      } else if (activeTab === 'notifications') {
        await loadNotifications();
      } else if (activeTab === 'settings') {
        await loadSettings();
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  }

  const loadArticles = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(contentSearch && { search: contentSearch }),
        ...(authorFilter && { author: authorFilter }),
        ...(tagFilter && { tags: tagFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      });
      
      const response = await fetch(`/api/admin/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.results || []);
        setAvailableFilters(data.filters || {tags: [], authors: []});
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  }

  const loadStories = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(contentSearch && { search: contentSearch }),
        ...(authorFilter && { author: authorFilter }),
        ...(tagFilter && { tags: tagFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      });
      
      const response = await fetch(`/api/admin/stories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.results || []);
        setAvailableFilters(data.filters || {tags: [], authors: []});
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userPagination.page.toString(),
        limit: '20',
        ...(userSearch && { search: userSearch }),
        ...(userRoleFilter !== 'all' && { role: userRoleFilter })
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setUserPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  const loadNgos = async () => {
    try {
      const params = new URLSearchParams({
        page: ngoPagination.page.toString(),
        limit: '20',
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      const response = await fetch(`/api/admin/ngos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNgos(data.ngos || []);
        setNgoStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setNgoPagination({
          page: data.pagination.currentPage,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading NGOs:', error);
    }
  }

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams({
        page: eventPagination.page.toString(),
        limit: '20',
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        adminView: 'true'
      });
      
      const response = await fetch(`/api/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEventStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setEventPagination({
          page: data.pagination.currentPage || data.pagination.page,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  const loadTrainings = async () => {
    try {
      const params = new URLSearchParams({
        page: trainingPagination.page.toString(),
        limit: '20',
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        adminView: 'true'
      });
      
      const response = await fetch(`/api/trainings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTrainings(data.trainings || []);
        setTrainingStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setTrainingPagination({
          page: data.pagination.currentPage || data.pagination.page,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading trainings:', error);
    }
  }

  const loadVacancies = async () => {
    try {
      const params = new URLSearchParams({
        page: vacancyPagination.page.toString(),
        limit: '20',
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        adminView: 'true'
      });
      
      const response = await fetch(`/api/vacancies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setVacancyStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setVacancyPagination({
          page: data.pagination.currentPage || data.pagination.page,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading vacancies:', error);
    }
  }

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({
        page: notificationPagination.page.toString(),
        limit: '20',
        ...(notificationFilters.type !== 'all' && { type: notificationFilters.type }),
        ...(notificationFilters.userId && { userId: notificationFilters.userId }),
        ...(notificationFilters.isRead !== 'all' && { isRead: notificationFilters.isRead })
      });
      
      const response = await fetch(`/api/admin/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setNotificationStats(data.stats || {total: 0, unread: 0, read: 0, today: 0});
        setNotificationPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  const sendAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSendingAnnouncement(true);
    try {
      if (editingAnnouncementId) {
        // Edit existing announcement
        const response = await fetch('/api/admin/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: editingAnnouncementId,
            editAnnouncement: true,
            title: announcementForm.title,
            message: announcementForm.message
          })
        });
        
        if (response.ok) {
          alert('Announcement updated successfully');
          setEditingAnnouncementId(null);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to update announcement');
        }
      } else {
        // Create new announcement
        const response = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(announcementForm)
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`Announcement sent to ${data.count} users`);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to send announcement');
        }
      }
      
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        type: 'announcement',
        title: '',
        message: '',
        targetUsers: 'all',
        target: 'all',
        userIds: ''
      });
      loadNotifications();
    } catch (error) {
      console.error('Error with announcement:', error);
      alert('Failed to process announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const response = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadNotifications();
      } else {
        alert('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  }

  const markNotificationAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead })
      });
      
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  }

  // Settings management functions
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }

  const saveSettings = async () => {
    if (!settings) return;
    
    setSavingSettings(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsChanged(false);
        alert('Settings saved successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  const resetSettings = async (section?: string) => {
    const confirmMessage = section 
      ? `Are you sure you want to reset ${section} settings to defaults?`
      : 'Are you sure you want to reset all settings to defaults?';
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsChanged(false);
        alert('Settings reset successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Failed to reset settings');
    }
  }

  const loadSettingsHistory = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettingsHistory(data.history || []);
        setShowSettingsHistory(true);
      }
    } catch (error) {
      console.error('Error loading settings history:', error);
    }
  }

  const updateSettingsField = (section: string, field: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...(settings[section as keyof SiteSettings] as Record<string, any>),
        [field]: value
      }
    });
    setSettingsChanged(true);
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleReview = (item: Article | Story) => {
    setSelectedItem(item)
    setAdminComment(item.adminComment || '')
    setShowModal(true)
  }

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const endpoint = activeTab === 'articles' ? '/api/admin/articles' : '/api/admin/stories';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem._id,
          status: 'approved',
          adminComment: adminComment.trim() || null
        })
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment('');
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setIsProcessing(false);
    }
  } 

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!adminComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      const endpoint = activeTab === 'articles' ? '/api/admin/articles' : '/api/admin/stories';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem._id,
          status: 'rejected',
          adminComment: adminComment.trim()
        })
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment('');
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setIsProcessing(false);
    }
  } 

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

  const getByStatus = (arr: any[], status: string) => arr.filter(s => s.status === status)

  // User management functions
  const handleUserAction = (user: User, action: 'role' | 'delete') => {
    setSelectedUser(user)
    setUserAction(action)
    setShowUserModal(true)
  }

  const executeUserAction = async () => {
    if (!selectedUser || !userAction) return
    setIsProcessing(true)
    
    try {
      let endpoint = '/api/admin/users'
      let body: any = { userId: selectedUser._id }
      
      switch (userAction) {
        case 'role':
          // This would be handled by a role selection in the modal
          break

        case 'delete':
          body.action = 'delete'
          break
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        setShowUserModal(false)
        setSelectedUser(null)
        setUserAction(null)
        await loadUsers()
      }
    } catch (error) {
      console.error('Error executing user action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUserSearch = async () => {
    setUserPagination({ page: 1, totalPages: 1 })
    await loadUsers()
  }

  const handleUserPageChange = async (page: number) => {
    setUserPagination(prev => ({ ...prev, page }))
    await loadUsers()
  }

  // NGO management functions
  const handleNgoAction = (ngo: any, action: 'approve' | 'reject') => {
    setSelectedNgo(ngo)
    setNgoAction(action)
    setShowNgoModal(true)
  }

  const executeNgoAction = async () => {
    if (!selectedNgo || !ngoAction) return
    setIsProcessing(true)
    
    try {
      const body: any = {
        ngoId: selectedNgo._id,
        action: ngoAction
      }
      
      if (ngoAction === 'reject' && rejectionReason.trim()) {
        body.rejectionReason = rejectionReason.trim()
      }
      
      const response = await fetch('/api/admin/ngos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        setShowNgoModal(false)
        setSelectedNgo(null)
        setNgoAction(null)
        setRejectionReason('')
        await loadNgos()
      }
    } catch (error) {
      console.error('Error executing NGO action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNgoPageChange = async (page: number) => {
    setNgoPagination(prev => ({ ...prev, page }))
    await loadNgos()
  }

  // Event management functions
  const handleEventAction = (event: any, action: 'approve' | 'reject') => {
    setSelectedEvent(event)
    setEventAction(action)
    setShowEventModal(true)
  }

  const executeEventAction = async () => {
    if (!selectedEvent || !eventAction) return
    setIsProcessing(true)
    
    try {
      const body: any = {
        action: eventAction
      }
      
      if (eventAction === 'reject' && eventRejectionReason.trim()) {
        body.rejectionReason = eventRejectionReason.trim()
      }
      
      const response = await fetch(`/api/events/${selectedEvent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        setShowEventModal(false)
        setSelectedEvent(null)
        setEventAction(null)
        setEventRejectionReason('')
        await loadEvents()
      }
    } catch (error) {
      console.error('Error executing event action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEventPageChange = async (page: number) => {
    setEventPagination(prev => ({ ...prev, page }))
    await loadEvents()
  }

  // Bulk operations
  const handleBulkAction = (action: 'approve' | 'reject' | 'delete') => {
    if (selectedItems.length === 0) return
    setBulkAction(action)
    setShowBulkModal(true)
  }

  const executeBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return
    setIsProcessing(true)
    
    try {
      const endpoint = activeTab === 'articles' ? '/api/admin/articles' : '/api/admin/stories'
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `bulk_${bulkAction}`,
          ids: selectedItems,
          ...(bulkAction === 'reject' && bulkComment.trim() && { adminComment: bulkComment.trim() })
        })
      })
      
      if (response.ok) {
        setShowBulkModal(false)
        setBulkAction(null)
        setBulkComment('')
        setSelectedItems([])
        loadSubmissions()
      }
    } catch (error) {
      console.error('Error executing bulk action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const currentItems = activeTab === 'articles' ? articles : stories
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(currentItems.map(item => item._id))
    }
  }

  const clearFilters = () => {
    setContentSearch('')
    setStatusFilter('all')
    setAuthorFilter('')
    setTagFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Admin Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">Content Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{session?.user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{session?.user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Enhanced Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <nav className="flex flex-nowrap">
              <button
                onClick={() => handleTabChange('articles')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'articles'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Articles
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {getByStatus(articles, 'pending').length > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {getByStatus(articles, 'pending').length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('stories')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'stories'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Stories
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {getByStatus(stories, 'pending').length > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {getByStatus(stories, 'pending').length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('users')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                </div>
              </button>
              <button
                onClick={() => handleTabChange('ngos')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'ngos'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                NGOs
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {ngoStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {ngoStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('events')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'events'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Events
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {eventStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {eventStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('trainings')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'trainings'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Trainings
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {trainingStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {trainingStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('vacancies')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'vacancies'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Vacancies
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {vacancyStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {vacancyStats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {notificationStats.unread > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {notificationStats.unread}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                </div>
              </button>
            </nav>
          </div>

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              {/* Article Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{getByStatus(articles, 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{getByStatus(articles, 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{getByStatus(articles, 'rejected').length}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Articles</p>
                      <p className="text-3xl font-bold text-blue-600">{articles.length}</p>
                    </div>
                    <Edit className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Enhanced Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search articles by title, content, or tags..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Author Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                      <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Authors</option>
                        {availableFilters.authors.map(author => (
                          <option key={author} value={author}>{author}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                      <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Tags</option>
                        {availableFilters.tags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="createdAt">Date</option>
                          <option value="title">Title</option>
                          <option value="author">Author</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <span className="self-center text-gray-500">to</span>
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mt-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedItems.length} item(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Articles List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Articles ({articles.length})
                  </h2>
                  {articles.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === articles.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                  )}
                </div>
                <div className="px-6 py-6">
                  {articles.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No articles found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div key={article._id} className={`border border-gray-200 rounded-xl p-6 transition-all ${
                          selectedItems.includes(article._id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:shadow-md'
                        }`}>
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(article._id)}
                              onChange={() => toggleItemSelection(article._id)}
                              className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                  article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  article.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {article.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  by {article.isAnonymous ? 'Anonymous' : (article.author?.name || article.author || 'Unknown')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(article.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {article.title}
                              </h3>
                              {article.abstract && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {article.abstract}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {article.tags.map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {article.adminComment && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                  <p className="text-sm font-medium text-red-800 mb-1">Admin Comment:</p>
                                  <p className="text-sm text-red-700">{article.adminComment}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/preview/article/${article._id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              {/* Story Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{getByStatus(stories, 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{getByStatus(stories, 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{getByStatus(stories, 'rejected').length}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Stories</p>
                      <p className="text-3xl font-bold text-blue-600">{stories.length}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Enhanced Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search stories by title, content, or tags..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Author Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                      <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Authors</option>
                        {availableFilters.authors.map(author => (
                          <option key={author} value={author}>{author}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                      <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Tags</option>
                        {availableFilters.tags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="createdAt">Date</option>
                          <option value="title">Title</option>
                          <option value="author">Author</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <span className="self-center text-gray-500">to</span>
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mt-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedItems.length} item(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stories List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Stories ({stories.length})
                  </h2>
                  {stories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === stories.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                  )}
                </div>
                <div className="px-6 py-6">
                  {stories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No stories found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {stories.map((story) => (
                        <div key={story._id} className={`border border-gray-200 rounded-xl p-6 transition-all ${
                          selectedItems.includes(story._id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:shadow-md'
                        }`}>
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(story._id)}
                              onChange={() => toggleItemSelection(story._id)}
                              className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                  story.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  story.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {story.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  by {story.isAnonymous ? 'Anonymous' : (story.author?.name || story.author || 'Unknown')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(story.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {story.title}
                              </h3>
                              {story.abstract && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {story.abstract}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {story.tags.map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {story.adminComment && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                  <p className="text-sm font-medium text-red-800 mb-1">Admin Comment:</p>
                                  <p className="text-sm text-red-700">{story.adminComment}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/preview/story/${story._id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-green-600">{users.length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">NGO Users</p>
                      <p className="text-3xl font-bold text-purple-600">{users.filter(u => u.role === 'ngo').length}</p>
                    </div>
                    <Building className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* User Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Users</option>
                      <option value="ngo">NGOs</option>
                      
                    </select>
                    <button
                      onClick={handleUserSearch}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <Filter className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    User Management <span className="ml-2 text-base font-normal text-gray-500">({users.length} users)</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No users found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user._id} className="border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'ngo' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>

                              {user.emailVerified && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {user.email}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>Articles: {user.stats.articles}</span>
                              <span>Stories: {user.stats.stories}</span>
                              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            {user.profile?.bio && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {user.profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleUserAction(user, 'role')}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </button>

                            <button
                              onClick={() => handleUserAction(user, 'delete')}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {userPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {userPagination.page} of {userPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUserPageChange(userPagination.page - 1)}
                          disabled={userPagination.page === 1}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleUserPageChange(userPagination.page + 1)}
                          disabled={userPagination.page === userPagination.totalPages}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NGOs Tab */}
          {activeTab === 'ngos' && (
            <div className="space-y-6">
              {/* NGO Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{ngoStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{ngoStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{ngoStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total NGOs</p>
                      <p className="text-3xl font-bold text-blue-600">{ngoStats.total}</p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* NGO Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search NGOs by name, organization, or email..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* NGO List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">NGO Registrations</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {ngos.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No NGOs found</h3>
                      <p className="mt-1 text-sm text-gray-500">No NGO registrations match your current filters.</p>
                    </div>
                  ) : (
                    ngos.map((ngo) => {
                      const status = ngo.ngoProfile.rejectedAt ? 'rejected' : 
                                   ngo.ngoProfile.isApproved ? 'approved' : 'pending';
                      return (
                        <div key={ngo._id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  status === 'approved' ? 'bg-green-100 text-green-800' :
                                  status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                   status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> :
                                   <Clock className="w-3 h-3 mr-1" />}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                                {ngo.emailVerified && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Email Verified
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {ngo.ngoProfile.organizationName}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                Contact: {ngo.name} ({ngo.email})
                              </p>
                              <p className="text-sm text-gray-700 mb-3">
                                {ngo.ngoProfile.description}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                                {ngo.ngoProfile.website && (
                                  <span>Website: {ngo.ngoProfile.website}</span>
                                )}
                                {ngo.ngoProfile.contactPhone && (
                                  <span>Phone: {ngo.ngoProfile.contactPhone}</span>
                                )}
                                {ngo.ngoProfile.address && (
                                  <span>Address: {ngo.ngoProfile.address}</span>
                                )}
                                {ngo.ngoProfile.registrationNumber && (
                                  <span>Reg. No: {ngo.ngoProfile.registrationNumber}</span>
                                )}
                              </div>
                              {ngo.ngoProfile.focusAreas.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-500 mb-1">Focus Areas:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {ngo.ngoProfile.focusAreas.map((area: string, index: number) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {ngo.ngoProfile.rejectionReason && (
                                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                                  <p className="text-sm text-red-700">{ngo.ngoProfile.rejectionReason}</p>
                                </div>
                              )}
                              <div className="mt-3 text-xs text-gray-500">
                                Registered: {new Date(ngo.createdAt).toLocaleDateString()}
                                {ngo.ngoProfile.approvedAt && (
                                  <span className="ml-4">Approved: {new Date(ngo.ngoProfile.approvedAt).toLocaleDateString()}</span>
                                )}
                                {ngo.ngoProfile.rejectedAt && (
                                  <span className="ml-4">Rejected: {new Date(ngo.ngoProfile.rejectedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            {status === 'pending' && (
                              <div className="flex flex-col gap-2 ml-4">
                                <button
                                  onClick={() => handleNgoAction(ngo, 'approve')}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleNgoAction(ngo, 'reject')}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* NGO Pagination */}
                {ngoPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {ngoPagination.page} of {ngoPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNgoPageChange(ngoPagination.page - 1)}
                          disabled={ngoPagination.page === 1}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleNgoPageChange(ngoPagination.page + 1)}
                          disabled={ngoPagination.page === ngoPagination.totalPages}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Event Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{eventStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{eventStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{eventStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-3xl font-bold text-blue-600">{eventStats.total}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Event Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search events by title, organization, or description..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Event List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Event Submissions</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {events.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                      <p className="mt-1 text-sm text-gray-500">No event submissions match your current filters.</p>
                    </div>
                  ) : (
                    events.map((event) => {
                      const status = event.rejectedAt ? 'rejected' : 
                                   event.isApproved ? 'approved' : 'pending';
                      return (
                        <div key={event._id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  status === 'approved' ? 'bg-green-100 text-green-800' :
                                  status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                   status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> :
                                   <Clock className="w-3 h-3 mr-1" />}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {event.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{event.description?.substring(0, 150)}...</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>By: {event.creator?.name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                {event.endDate && (
                                  <>
                                    <span>-</span>
                                    <span>{new Date(event.endDate).toLocaleDateString()}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{event.location?.type || 'Unknown location'}</span>
                              </div>
                              {event.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm text-red-700"><strong>Rejection reason:</strong> {event.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleEventAction(event, 'approve')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleEventAction(event, 'reject')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => window.open(`/resources/events/${event._id}`, '_blank')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Event Pagination */}
                {eventPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {eventPagination.page} of {eventPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEventPageChange(eventPagination.page - 1)}
                          disabled={eventPagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleEventPageChange(eventPagination.page + 1)}
                          disabled={eventPagination.page === eventPagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trainings Tab */}
          {activeTab === 'trainings' && (
            <div className="space-y-6">
              {/* Training Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{trainingStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{trainingStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{trainingStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Trainings</p>
                      <p className="text-3xl font-bold text-blue-600">{trainingStats.total}</p>
                    </div>
                    <GraduationCap className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Training Search and Filters */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-purple-500" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Training Management</h2>
                      <p className="text-gray-600">Review and manage training submissions from NGOs</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search trainings by title, description, or NGO..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Training List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                {tabLoading && activeTab === 'trainings' ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <span className="ml-3 text-gray-600">Loading trainings...</span>
                  </div>
                ) : trainings.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings found</h3>
                    <p className="text-gray-500">No training submissions match your current filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {trainings.map((training) => (
                      <div key={training._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{training.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                training.status === 'approved' ? 'bg-green-100 text-green-800' :
                                training.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{training.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Tag className="w-4 h-4" />
                                {training.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(training.startDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {training.creator?.organizationName || 'Unknown NGO'}
                              </span>
                            </div>
                            {training.adminComment && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Admin Comment:</span> {training.adminComment}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedTraining(training);
                                setTrainingAction('approve');
                                setShowTrainingModal(true);
                              }}
                              disabled={training.status === 'approved'}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTraining(training);
                                setTrainingAction('reject');
                                setShowTrainingModal(true);
                              }}
                              disabled={training.status === 'rejected'}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTraining(training);
                                setShowTrainingModal(true);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vacancies Tab */}
          {activeTab === 'vacancies' && (
            <div className="space-y-6">
              {/* Vacancy Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Vacancies</p>
                      <p className="text-3xl font-bold text-blue-600">{vacancyStats.total}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-3xl font-bold text-yellow-600">{vacancyStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{vacancyStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{vacancyStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Vacancy Management */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-8 h-8 text-purple-500" />
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Vacancy Management</h2>
                        <p className="text-gray-600">Review and manage job postings, volunteering opportunities, and internships</p>
                      </div>
                    </div>
                  </div>
                </div>

                {tabLoading && activeTab === 'vacancies' ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {vacancies.map((vacancy) => (
                      <div key={vacancy._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                vacancy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                vacancy.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {vacancy.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                vacancy.type === 'job' ? 'bg-blue-100 text-blue-800' :
                                vacancy.type === 'volunteer' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {vacancy.type}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{vacancy.organization?.name}</p>
                            <p className="text-gray-700 mb-3 line-clamp-2">{vacancy.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>📍 {vacancy.location}</span>
                              {vacancy.deadline && (
                                <span>⏰ Deadline: {new Date(vacancy.deadline).toLocaleDateString()}</span>
                              )}
                              <span>📅 {new Date(vacancy.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedVacancy(vacancy)
                                setVacancyAction('approve')
                                setShowVacancyModal(true)
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVacancy(vacancy)
                                setVacancyAction('reject')
                                setShowVacancyModal(true)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVacancy(vacancy)
                                setVacancyAction(null)
                                setShowVacancyModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
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
            <div className="space-y-6">
              {/* Notification Management Header */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-blue-500" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Announcement Management</h2>
                      <p className="text-gray-600">Send announcements to users and manage sent announcements</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Announcement
                  </button>
                </div>

                {/* Notification Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Announcements</p>
                        <p className="text-3xl font-bold text-blue-600">{notificationStats.total}</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Read</p>
                        <p className="text-3xl font-bold text-green-600">{notificationStats.read}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Unread</p>
                        <p className="text-3xl font-bold text-yellow-600">{notificationStats.unread}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today</p>
                        <p className="text-3xl font-bold text-purple-600">{notificationStats.today}</p>
                      </div>
                      <Bell className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement Creation Form */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Send className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Create New Announcement</h3>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); sendAnnouncement(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter announcement title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <textarea
                      rows={4}
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter announcement message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <select 
                      value={announcementForm.targetUsers}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Users</option>
                      <option value="verified">Verified Users Only</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => setAnnouncementForm({
                        type: 'announcement',
                        title: '',
                        message: '',
                        targetUsers: 'all',
                        target: 'all',
                        userIds: ''
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Clear Form
                    </button>
                    <button 
                      type="submit"
                      disabled={sendingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingAnnouncement ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Announcement
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Announcements List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sent Announcements ({notifications.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage and edit your announcements sent to users
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Filter
                    </button>
                    <button 
                      onClick={() => {
                        // Clear form and scroll to announcement form
                        setAnnouncementForm({
                          type: 'announcement',
                          title: '',
                          message: '',
                          targetUsers: 'all',
                          target: 'all',
                          userIds: ''
                        });
                        // Scroll to form
                        document.querySelector('[data-announcement-form]')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      New Announcement
                    </button>
                  </div>
                </div>
                <div className="px-6 py-6">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No announcements found</p>
                      <p className="text-gray-400 text-sm mt-2">Create your first announcement using the form above</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  ANNOUNCEMENT
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Recipients: {notification.userId ? `${notification.userId.name}` : 'All Users'}</span>
                                <span>•</span>
                                <span>Sent: {new Date(notification.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  // Set editing mode and populate form with announcement data
                                  setEditingAnnouncementId(notification._id);
                                  setAnnouncementForm({
                                    type: 'announcement',
                                    title: notification.title,
                                    message: notification.message,
                                    targetUsers: notification.userId ? 'specific' : 'all',
                                    target: notification.userId ? 'specific' : 'all',
                                    userIds: notification.userId ? notification.userId._id : ''
                                  });
                                  // Scroll to form
                                  document.querySelector('[data-announcement-form]')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit announcement"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteNotification(notification._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete announcement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {notificationPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {notificationPagination.page} of {notificationPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNotificationPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={notificationPagination.page === 1}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setNotificationPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={notificationPagination.page === notificationPagination.totalPages}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {settingsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <span className="ml-2 text-gray-600">Loading settings...</span>
                </div>
              ) : (
                <>
                  {/* Settings Header */}
                  <div className="bg-white shadow-lg rounded-2xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-500" />
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>
                          <p className="text-gray-600">Configure site-wide settings and preferences</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={loadSettingsHistory}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          <History className="w-4 h-4 mr-2" />
                          History
                        </button>
                        <button
                          onClick={() => resetSettings()}
                          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset All
                        </button>
                        <button
                          onClick={saveSettings}
                          disabled={!settingsChanged || savingSettings}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingSettings ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {savingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {settings && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Settings Navigation */}
                      <div className="lg:col-span-1">
                        <div className="bg-white shadow-lg rounded-2xl p-4">
                          <nav className="space-y-2">
                            {[
                              { id: 'siteInfo', label: 'Site Information', icon: '🌐' },
                              { id: 'contentPolicies', label: 'Content Policies', icon: '📝' },
                              { id: 'userManagement', label: 'User Management', icon: '👥' },
                              { id: 'notifications', label: 'Notifications', icon: '🔔' },
                              { id: 'security', label: 'Security', icon: '🔒' },
                              { id: 'features', label: 'Features', icon: '⚡' }
                            ].map((section) => (
                              <button
                                key={section.id}
                                onClick={() => setActiveSettingsSection(section.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  activeSettingsSection === section.id
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className="mr-2">{section.icon}</span>
                                {section.label}
                              </button>
                            ))}
                          </nav>
                        </div>
                      </div>

                      {/* Settings Content */}
                      <div className="lg:col-span-3">
                        <div className="bg-white shadow-lg rounded-2xl p-6">
                          {activeSettingsSection === 'siteInfo' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                                  <input
                                    type="text"
                                    value={settings.siteInfo.siteName}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
                                  <input
                                    type="url"
                                    value={settings.siteInfo.siteUrl}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                                  <textarea
                                    value={settings.siteInfo.siteDescription}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteDescription', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                  <input
                                    type="email"
                                    value={settings.siteInfo.contactEmail}
                                    onChange={(e) => updateSettingsField('siteInfo', 'contactEmail', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                                  <input
                                    type="email"
                                    value={settings.siteInfo.supportEmail}
                                    onChange={(e) => updateSettingsField('siteInfo', 'supportEmail', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'contentPolicies' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Policies</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Require Approval</label>
                                    <p className="text-xs text-gray-500">All content must be approved before publishing</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.contentPolicies.requireApproval}
                                    onChange={(e) => updateSettingsField('contentPolicies', 'requireApproval', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Auto-approve Verified Users</label>
                                    <p className="text-xs text-gray-500">Automatically approve content from verified users</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.contentPolicies.autoApproveVerifiedUsers}
                                    onChange={(e) => updateSettingsField('contentPolicies', 'autoApproveVerifiedUsers', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Article Length</label>
                                    <input
                                      type="number"
                                      value={settings.contentPolicies.maxArticleLength}
                                      onChange={(e) => updateSettingsField('contentPolicies', 'maxArticleLength', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Story Length</label>
                                    <input
                                      type="number"
                                      value={settings.contentPolicies.maxStoryLength}
                                      onChange={(e) => updateSettingsField('contentPolicies', 'maxStoryLength', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'userManagement' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Allow Registration</label>
                                    <p className="text-xs text-gray-500">Allow new users to register</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.userManagement.allowRegistration}
                                    onChange={(e) => updateSettingsField('userManagement', 'allowRegistration', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
                                    <p className="text-xs text-gray-500">Users must verify their email before accessing the site</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.userManagement.requireEmailVerification}
                                    onChange={(e) => updateSettingsField('userManagement', 'requireEmailVerification', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Default User Role</label>
                                  <select
                                    value={settings.userManagement.defaultUserRole}
                                    onChange={(e) => updateSettingsField('userManagement', 'defaultUserRole', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  >
                                    <option value="user">User</option>
                                    <option value="contributor">Contributor</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'security' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</label>
                                    <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.security.enableTwoFactor}
                                    onChange={(e) => updateSettingsField('security', 'enableTwoFactor', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Enable Rate Limiting</label>
                                    <p className="text-xs text-gray-500">Limit API requests to prevent abuse</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.security.enableRateLimit}
                                    onChange={(e) => updateSettingsField('security', 'enableRateLimit', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                                    <input
                                      type="number"
                                      value={settings.security.sessionTimeout}
                                      onChange={(e) => updateSettingsField('security', 'sessionTimeout', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                                    <input
                                      type="number"
                                      value={settings.security.maxLoginAttempts}
                                      onChange={(e) => updateSettingsField('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'features' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Toggles</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(settings.features).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </label>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={value as boolean}
                                      onChange={(e) => updateSettingsField('features', key, e.target.checked)}
                                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative w-full max-w-lg mx-auto p-6 border shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedItem?.title}
                  {selectedItem.title}
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activeTab.slice(0, -1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    by {selectedItem.isAnonymous ? 'Anonymous' : selectedItem.author || 'Unknown'}
                  </span>
                </div>
                {selectedItem.abstract && (
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedItem.abstract}
                  </p>
                )}
                <div className="prose max-w-none max-h-96 overflow-y-auto">
                  {selectedItem.content && typeof selectedItem.content === 'object' ? (
                    <BlocknoteReadOnly initialJSON={selectedItem.content} />
                  ) : selectedItem.contentHtml && selectedItem.contentHtml.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedItem.contentHtml }} />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-sm bg-gray-100 p-2 rounded">
                      {typeof selectedItem.content === 'string'
                        ? selectedItem.content
                        : JSON.stringify(selectedItem.content, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Comment (optional for approval, required for rejection)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Provide feedback or reason for rejection..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {userAction === 'role' && 'Change User Role'}
                {userAction === 'delete' && 'Delete User'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedUser.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedUser.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                    selectedUser.role === 'ngo' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </span>

                </div>
              </div>

              {userAction === 'role' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Role
                  </label>
                  <select
                    defaultValue={selectedUser.role}
                    onChange={(e) => {
                      setSelectedUser({ ...selectedUser, role: e.target.value as 'user' | 'admin' | 'ngo' })
                    }}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="user">User</option>
                    <option value="ngo">NGO</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}



              {userAction === 'delete' && (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Warning: This action cannot be undone
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            This will permanently delete the user account and all associated data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUserAction}
                  disabled={isProcessing}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    userAction === 'delete'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {isProcessing ? 'Processing...' : (
                    userAction === 'role' ? 'Update Role' :
                    'Delete User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk {bulkAction === 'approve' ? 'Approve' : 
                      bulkAction === 'reject' ? 'Reject' : 
                      bulkAction === 'delete' ? 'Delete' : 'Update'} {activeTab}
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You are about to {bulkAction} {selectedItems.length} {activeTab.slice(0, -1)}{selectedItems.length > 1 ? 's' : ''}.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {selectedItems.map(id => {
                    const item = activeTab === 'articles' ? 
                      articles.find(a => a._id === id) : 
                      stories.find(s => s._id === id)
                    return (
                      <div key={id} className="text-sm text-gray-700 mb-1">
                        • {item?.title || 'Unknown'}
                      </div>
                    )
                  })}
                </div>
              </div>

              {(bulkAction === 'reject' || bulkAction === 'approve') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Comment {bulkAction === 'reject' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    value={bulkComment}
                    onChange={(e) => setBulkComment(e.target.value)}
                    placeholder={bulkAction === 'reject' ? 
                      'Please provide a reason for rejection...' : 
                      'Optional comment for approval...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  disabled={isProcessing || (bulkAction === 'reject' && !bulkComment.trim())}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    bulkAction === 'delete' || bulkAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 
                   bulkAction === 'approve' ? 'Approve All' :
                   bulkAction === 'reject' ? 'Reject All' :
                   bulkAction === 'delete' ? 'Delete All' : 'Update All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NGO Action Modal */}
      {showNgoModal && selectedNgo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {ngoAction === 'approve' ? 'Approve NGO Registration' : 'Reject NGO Registration'}
              </h3>
              <button
                onClick={() => setShowNgoModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedNgo.ngoProfile.organizationName}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Contact: {selectedNgo.name} ({selectedNgo.email})
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  {selectedNgo.ngoProfile.description}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                  {selectedNgo.ngoProfile.website && (
                    <span>Website: {selectedNgo.ngoProfile.website}</span>
                  )}
                  {selectedNgo.ngoProfile.contactPhone && (
                    <span>Phone: {selectedNgo.ngoProfile.contactPhone}</span>
                  )}
                  {selectedNgo.ngoProfile.address && (
                    <span>Address: {selectedNgo.ngoProfile.address}</span>
                  )}
                  {selectedNgo.ngoProfile.registrationNumber && (
                    <span>Registration Number: {selectedNgo.ngoProfile.registrationNumber}</span>
                  )}
                </div>
                {selectedNgo.ngoProfile.focusAreas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Focus Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNgo.ngoProfile.focusAreas.map((area: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {ngoAction === 'approve' && (
                <div className="mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Approve NGO Registration
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            This will approve the NGO registration and grant them access to create events, trainings, and job postings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ngoAction === 'reject' && (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Reject NGO Registration
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            This will reject the NGO registration. Please provide a reason for rejection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (Required)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a detailed reason for rejecting this NGO registration..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNgoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeNgoAction}
                  disabled={isProcessing || (ngoAction === 'reject' && !rejectionReason.trim())}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    ngoAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isProcessing ? 'Processing...' : (
                    ngoAction === 'approve' ? 'Approve NGO' : 'Reject NGO'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Action Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {eventAction === 'approve' ? 'Approve Event' : 'Reject Event'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Creator:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.creator?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(selectedEvent.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.location?.type || 'Unknown'}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1 text-gray-600 text-sm">{selectedEvent.description}</p>
                </div>
              </div>

              {eventAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    value={eventRejectionReason}
                    onChange={(e) => setEventRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejecting this event..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeEventAction}
                  disabled={isProcessing || (eventAction === 'reject' && !eventRejectionReason.trim())}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    eventAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isProcessing ? 'Processing...' : (
                    eventAction === 'approve' ? 'Approve Event' : 'Reject Event'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Action Modal */}
          {showTrainingModal && selectedTraining && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Training Details</h3>
                    <button
                      onClick={() => {
                        setShowTrainingModal(false);
                        setSelectedTraining(null);
                        setTrainingAction(null);
                        setTrainingRejectionReason('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{selectedTraining.title}</h4>
                      <p className="text-gray-600">{selectedTraining.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <p className="text-gray-900">{selectedTraining.category}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <p className="text-gray-900">{selectedTraining.type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Start Date:</span>
                        <p className="text-gray-900">{new Date(selectedTraining.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">End Date:</span>
                        <p className="text-gray-900">{new Date(selectedTraining.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Duration:</span>
                        <p className="text-gray-900">{selectedTraining.duration?.value} {selectedTraining.duration?.unit}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Max Participants:</span>
                        <p className="text-gray-900">{selectedTraining.maxParticipants || 'Unlimited'}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">NGO:</span>
                      <p className="text-gray-900">{selectedTraining.creator?.organizationName || 'Unknown'}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">Current Status:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTraining.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedTraining.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedTraining.status.charAt(0).toUpperCase() + selectedTraining.status.slice(1)}
                      </span>
                    </div>

                    {selectedTraining.adminComment && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Previous Admin Comment:</span>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">{selectedTraining.adminComment}</p>
                      </div>
                    )}

                    {trainingAction === 'reject' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                        <textarea
                          value={trainingRejectionReason}
                          onChange={(e) => setTrainingRejectionReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Please provide a reason for rejection..."
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowTrainingModal(false);
                        setSelectedTraining(null);
                        setTrainingAction(null);
                        setTrainingRejectionReason('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {trainingAction && (
                      <button
                        onClick={async () => {
                          if (trainingAction === 'reject' && !trainingRejectionReason.trim()) {
                            alert('Please provide a rejection reason');
                            return;
                          }
                          
                          try {
                            const response = await fetch(`/api/trainings/${selectedTraining._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                status: trainingAction === 'approve' ? 'approved' : 'rejected',
                                adminComment: trainingAction === 'reject' ? trainingRejectionReason : null
                              })
                            });
                            
                            if (response.ok) {
                              setShowTrainingModal(false);
                              setSelectedTraining(null);
                              setTrainingAction(null);
                              setTrainingRejectionReason('');
                              loadTrainings();
                            }
                          } catch (error) {
                            console.error('Error updating training:', error);
                          }
                        }}
                        className={`px-4 py-2 text-white rounded-lg ${
                          trainingAction === 'approve' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {trainingAction === 'approve' ? 'Approve Training' : 'Reject Training'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vacancy Action Modal */}
          {showVacancyModal && selectedVacancy && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="relative w-full max-w-4xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {vacancyAction === 'approve' ? 'Approve Vacancy' : 
                     vacancyAction === 'reject' ? 'Reject Vacancy' : 'Vacancy Details'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowVacancyModal(false)
                      setSelectedVacancy(null)
                      setVacancyAction(null)
                      setVacancyRejectionReason('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Title</h4>
                      <p className="text-gray-700">{selectedVacancy.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Organization</h4>
                      <p className="text-gray-700">{selectedVacancy.organization?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Type</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedVacancy.type === 'job' ? 'bg-blue-100 text-blue-800' :
                        selectedVacancy.type === 'volunteer' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedVacancy.type}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                      <p className="text-gray-700">{selectedVacancy.location}</p>
                    </div>
                    {selectedVacancy.deadline && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Application Deadline</h4>
                        <p className="text-gray-700">{new Date(selectedVacancy.deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedVacancy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedVacancy.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedVacancy.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedVacancy.description}</p>
                    </div>
                  </div>

                  {selectedVacancy.requirements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedVacancy.requirements}</p>
                      </div>
                    </div>
                  )}

                  {selectedVacancy.applicationUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Application URL</h4>
                      <a 
                        href={selectedVacancy.applicationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedVacancy.applicationUrl}
                      </a>
                    </div>
                  )}

                  {vacancyAction === 'reject' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={vacancyRejectionReason}
                        onChange={(e) => setVacancyRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={4}
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowVacancyModal(false)
                        setSelectedVacancy(null)
                        setVacancyAction(null)
                        setVacancyRejectionReason('')
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    {vacancyAction && (
                      <button
                        onClick={async () => {
                          if (vacancyAction === 'reject' && !vacancyRejectionReason.trim()) {
                            alert('Please provide a rejection reason')
                            return
                          }
                          
                          try {
                            const response = await fetch(`/api/vacancies/${selectedVacancy._id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                status: vacancyAction === 'approve' ? 'approved' : 'rejected',
                                adminComment: vacancyAction === 'reject' ? vacancyRejectionReason : undefined
                              })
                            })
                            
                            if (response.ok) {
                              await loadVacancies()
                              setShowVacancyModal(false)
                              setSelectedVacancy(null)
                              setVacancyAction(null)
                              setVacancyRejectionReason('')
                            }
                          } catch (error) {
                            console.error('Error updating vacancy:', error)
                          }
                        }}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${
                          vacancyAction === 'approve' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {vacancyAction === 'approve' ? 'Approve Vacancy' : 'Reject Vacancy'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Announcement Modal */}
          {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Send Announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendAnnouncement(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement message..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={announcementForm.target}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="verified">Verified Users Only</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>

              {announcementForm.target === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User IDs (comma-separated)</label>
                  <input
                    type="text"
                    value={announcementForm.userIds}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, userIds: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter user IDs separated by commas..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnouncement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingAnnouncement ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2 inline" />
                      Send Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
    )
  }
