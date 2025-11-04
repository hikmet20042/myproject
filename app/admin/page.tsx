'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Eye, Users, Search, Filter, Edit, Trash2, Shield, UserCheck, ChevronDown, Calendar, GraduationCap, Briefcase, Tag, SortAsc, SortDesc, MoreHorizontal, Bell, Send, AlertCircle, Settings, Save, RotateCcw, History, BookOpen, Building, FileText } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Container } from '@/components/layout/Container'
import { Tabs } from '@/components/ui/Tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ImageUpload } from '@/components/shared'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DraggableMaterialRow from '@/components/admin/DraggableMaterialRow'
import Image from 'next/image'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })


type Blog = {
  _id: string
  title: string
  content: string
  contentHtml: string
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
  role: 'user' | 'admin'
  emailVerified: boolean
  createdAt: string

  profile?: {
    bio?: string
    location?: string
    occupation?: string
  }
  stats?: {
    blogs: number
  }
}

type NGO = {
  _id: string
  organizationName: string
  email: string
  description: string
  website?: string
  contactPhone?: string
  address?: string
  registrationNumber?: string
  focusAreas?: string[]
  status: 'pending' | 'approved' | 'rejected'
  approvedAt?: string
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  adminComment?: string
  contactPerson: {
    name: string
    email: string
    phone?: string
    position?: string
  }
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
  createdAt: string
  updatedAt: string
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

type Material = {
  _id: string
  title: string
  description: string
  category: 'toolkit' | 'course' | 'video' | 'guide' | 'document' | 'emergency' | 'other'
  type: string
  url: string
  imageUrl?: string
  provider?: string
  duration?: string
  language: string[]
  tags: string[]
  featured: boolean
  isPublished: boolean
  order: number
  views: number
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
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
    maxBlogLength: number
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
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('blogs')
  const [blogs, setBlogs] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [ngos, setNgos] = useState<NGO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Blog | null>(null)
  const [showModal, setShowModal] = useState(false)
  const localePath = useLocalizedPath()
  const [adminComment, setAdminComment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [tabLoading, setTabLoading] = useState(false)
  
  // User management states
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [userStats, setUserStats] = useState({ total: 0, verified: 0, admin: 0 })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userAction, setUserAction] = useState<'role' | 'delete' | null>(null)

  // Content management states
  const [contentSearch, setContentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('')

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
  const [showNgoDetailModal, setShowNgoDetailModal] = useState(false)
  const [ngoAction, setNgoAction] = useState<'approve' | 'reject' | null>(null)
  
  // Event management states (unified for all event types)
  const [events, setEvents] = useState<any[]>([])
  const [eventStats, setEventStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [eventPagination, setEventPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventAction, setEventAction] = useState<'approve' | 'reject' | null>(null)
  const [eventRejectionReason, setEventRejectionReason] = useState('')

  // Material management states
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialStats, setMaterialStats] = useState({ total: 0, published: 0, unpublished: 0, featured: 0 })
  const [materialPagination, setMaterialPagination] = useState({ page: 1, totalPages: 1 })
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showMaterialFormModal, setShowMaterialFormModal] = useState(false)
  const [materialAction, setMaterialAction] = useState<'edit' | 'delete' | null>(null)
  const [materialFormData, setMaterialFormData] = useState<Partial<Material>>({
    title: '',
    description: '',
    category: 'other',
    type: '',
    url: '',
    imageUrl: '',
    provider: '',
    duration: '',
    language: ['en'],
    tags: [],
    featured: false,
    isPublished: true,
    order: 0
  })
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all')
  const [materialSearch, setMaterialSearch] = useState('')

  // Vacancy management states
  const [vacancies, setVacancies] = useState<any[]>([])
  const [vacancyStats, setVacancyStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [vacancyPagination, setVacancyPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
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

  // Load functions - defined before useEffect hooks
  const loadSubmissions = async () => {
    setTabLoading(true);
    try {
      if (activeTab === 'blogs') {
        await loadBlogs();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'ngos') {
        await loadNgos();
      } else if (activeTab === 'events') {
        await loadEvents();
      } else if (activeTab === 'vacancies') {
        await loadVacancies();
      } else if (activeTab === 'notifications') {
        await loadNotifications();
      } else if (activeTab === 'materials') {
        await loadMaterials();
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
  
  // Ensure we load data when the user session is ready and when the active tab changes.
  useEffect(() => {
    // Only attempt to load when session is authenticated. If unauthenticated, redirect to signin.
    if (status === 'authenticated') {
      setLoading(true);
      loadSubmissions();
      // Load NGO stats on initial load for the badge
      loadNgoStats();
    } else if (status === 'unauthenticated') {
      // if user is not signed in, send them to the signin page
      router.push(localePath("/signin"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeTab]);

  const loadBlogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(contentSearch && { search: contentSearch }),
        ...(authorFilter && { author: authorFilter }),

        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      });
      
      const response = await fetch(`/api/admin/blogs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.results || []);
        setAvailableFilters(data.filters || {tags: [], authors: []});
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
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
          totalPages: data.pagination.totalPages,
          total: data.pagination.total || 0
        });
        
        // Set user stats from API response
        if (data.stats) {
          setUserStats({
            total: data.stats.total || 0,
            verified: data.stats.verified || 0,
            admin: data.stats.admin || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  const loadNgoStats = async () => {
    try {
      // Load just the stats without full NGO list
      const response = await fetch('/api/admin/ngos?limit=1');
      if (response.ok) {
        const data = await response.json();
        setNgoStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error loading NGO stats:', error);
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
        sortOrder: 'desc'
      });
      
      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEventStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setEventPagination({
          page: data.pagination.page,
          totalPages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
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
      alert(t('admin.notifications.errors.fillRequired'));
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
          alert(t('admin.notifications.updatedSuccess'));
          setEditingAnnouncementId(null);
        } else {
          const error = await response.json();
          alert(error.error || t('admin.notifications.errors.updateFailed'));
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
          alert(t('admin.notifications.sentSuccess', { count: data.count }));
        } else {
          const error = await response.json();
          alert(error.error || t('admin.notifications.errors.sendFailed'));
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
      alert(t('admin.notifications.errors.processFailed'));
    } finally {
      setSendingAnnouncement(false);
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!confirm(t('admin.notifications.confirmDelete'))) return;

    try {
      const response = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadNotifications();
      } else {
        alert(t('admin.notifications.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert(t('admin.notifications.deleteFailed'));
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
        alert(t('admin.settings.savedSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('admin.settings.saveFailed'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('admin.settings.saveFailed'));
    } finally {
      setSavingSettings(false);
    }
  }

  const resetSettings = async (section?: string) => {
    const confirmMessage = section 
      ? t('admin.settings.resetSectionConfirm', { section })
      : t('admin.settings.resetAllConfirm');

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
        alert(t('admin.settings.resetSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('admin.settings.resetFailed'));
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert(t('admin.settings.resetFailed'));
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

  const handleReview = (item: Blog) => {
    setSelectedItem(item)
    setAdminComment(item.adminComment || '')
    setShowModal(true)
  }

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const endpoint = '/api/admin/blogs';
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
      alert(t('admin.modals.rejectReasonRequired'));
      return;
    }
    setIsProcessing(true);
    try {
      const endpoint = '/api/admin/blogs';
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
      let method = 'PUT'
      let body: any = { userId: selectedUser._id }
      
      switch (userAction) {
        case 'role':
          body.action = 'updateRole'
          body.updates = { role: selectedUser.role }
          break

        case 'delete':
          method = 'DELETE'
          endpoint = `/api/admin/users?userId=${selectedUser._id}`
          body = undefined
          break
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body && { body: JSON.stringify(body) })
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
    setUserPagination({ page: 1, totalPages: 1, total: 0 })
    await loadUsers()
  }

  const handleUserPageChange = async (page: number) => {
    // Update pagination state first
    setUserPagination(prev => ({ ...prev, page }))
    
    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
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
          totalPages: data.pagination.totalPages,
          total: data.pagination.total || 0
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
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
      
      if (ngoAction === 'reject' && adminComment.trim()) {
        body.rejectionReason = adminComment.trim()
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
        setAdminComment('')
        await loadNgos()
      }
    } catch (error) {
      console.error('Error executing NGO action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNgoPageChange = async (page: number) => {
    // Update pagination state first
    setNgoPagination(prev => ({ ...prev, page }))
    
    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
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
        body.adminComment = eventRejectionReason.trim()
      }
      
      const response = await fetch(`/api/admin/events/${selectedEvent._id}`, {
        method: 'PATCH',
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
    // Update pagination state first
    setEventPagination(prev => ({ ...prev, page }))
    
    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEventStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setEventPagination({
          page: data.pagination.page,
          totalPages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  // Vacancy management functions
  const handleVacancyAction = (vacancy: any, action: 'approve' | 'reject') => {
    setSelectedVacancy(vacancy)
    setVacancyAction(action)
    setShowVacancyModal(true)
  }

  const executeVacancyAction = async () => {
    if (!selectedVacancy || !vacancyAction) return
    setIsProcessing(true)
    
    try {
      const body: any = {
        action: vacancyAction
      }
      
      if (vacancyAction === 'reject' && vacancyRejectionReason.trim()) {
        body.adminComment = vacancyRejectionReason.trim()
      }
      
      const response = await fetch(`/api/vacancies/${selectedVacancy._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        setShowVacancyModal(false)
        setSelectedVacancy(null)
        setVacancyAction(null)
        setVacancyRejectionReason('')
        await loadVacancies()
      }
    } catch (error) {
      console.error('Error executing vacancy action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVacancyPageChange = async (page: number) => {
    // Update pagination state first
    setVacancyPagination(prev => ({ ...prev, page }))
    
    // Fetch with the new page directly (don't wait for state update)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: 'true'
      })
      
      if (contentSearch.trim()) {
        params.append('search', contentSearch.trim())
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/vacancies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVacancies(data.vacancies || [])
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10
        })
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0
        })
      }
    } catch (error) {
      console.error('Error loading vacancies:', error)
    }
  }

  const loadVacancies = async () => {
    try {
      const params = new URLSearchParams({
        page: vacancyPagination.page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: 'true'
      })
      
      if (contentSearch.trim()) {
        params.append('search', contentSearch.trim())
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/vacancies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVacancies(data.vacancies || [])
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10
        })
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0
        })
      }
    } catch (error) {
      console.error('Error loading vacancies:', error)
    }
  }

  const loadMaterials = async () => {
    try {
      setTabLoading(true)
      const params = new URLSearchParams({
        page: materialPagination.page.toString(),
        limit: '20'
      })
      
      if (materialSearch.trim()) {
        params.append('search', materialSearch.trim())
      }
      
      if (materialCategoryFilter !== 'all') {
        params.append('category', materialCategoryFilter)
      }
      
      const response = await fetch(`/api/admin/materials?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials || [])
        setMaterialPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1
        })
        
        // Calculate stats
        const published = data.materials.filter((m: Material) => m.isPublished).length
        const featured = data.materials.filter((m: Material) => m.featured).length
        setMaterialStats({
          total: data.total || 0,
          published,
          unpublished: data.total - published,
          featured
        })
      }
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setTabLoading(false)
    }
  }

  // Delete functions for events, vacancies, NGOs, and blogs
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadEvents()
      } else {
        alert('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const handleDeleteVacancy = async (vacancyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this vacancy? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadVacancies()
      } else {
        alert('Failed to delete vacancy')
      }
    } catch (error) {
      console.error('Error deleting vacancy:', error)
      alert('Failed to delete vacancy')
    }
  }

  const handleDeleteNgo = async (ngoId: string) => {
    if (!confirm('Are you sure you want to permanently delete this NGO registration? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/admin/ngos/${ngoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadNgos()
      } else {
        alert('Failed to delete NGO')
      }
    } catch (error) {
      console.error('Error deleting NGO:', error)
      alert('Failed to delete NGO')
    }
  }

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to permanently delete this blog? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadSubmissions()
      } else {
        alert('Failed to delete blog')
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('Failed to delete blog')
    }
  }

  // Material CRUD functions
  const handleCreateMaterial = () => {
    setMaterialFormData({
      title: '',
      description: '',
      category: 'other',
      type: '',
      url: '',
      imageUrl: '',
      provider: '',
      duration: '',
      language: ['en'],
      tags: [],
      featured: false,
      isPublished: true,
      order: 0
    })
    setSelectedMaterial(null)
    setShowMaterialFormModal(true)
  }

  const handleEditMaterial = (material: Material) => {
    setMaterialFormData(material)
    setSelectedMaterial(material)
    setShowMaterialFormModal(true)
  }

  const handleSaveMaterial = async () => {
    if (!materialFormData.title || !materialFormData.description || !materialFormData.url) {
      alert('Please fill in required fields: title, description, and URL')
      return
    }

    setIsProcessing(true)
    try {
      const url = selectedMaterial ? `/api/materials/${selectedMaterial._id}` : '/api/materials'
      const method = selectedMaterial ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialFormData)
      })
      
      if (response.ok) {
        setShowMaterialFormModal(false)
        setSelectedMaterial(null)
        await loadMaterials()
        alert(selectedMaterial ? 'Material updated successfully' : 'Material created successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save material')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      alert('Failed to save material')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadMaterials()
        alert('Material deleted successfully')
      } else {
        alert('Failed to delete material')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material')
    }
  }

  const handleToggleMaterialPublish = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...material,
          isPublished: !material.isPublished
        })
      })
      
      if (response.ok) {
        await loadMaterials()
      } else {
        alert('Failed to toggle publish status')
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to toggle publish status')
    }
  }

  const handleToggleMaterialFeatured = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...material,
          featured: !material.featured
        })
      })
      
      if (response.ok) {
        await loadMaterials()
      } else {
        alert('Failed to toggle featured status')
      }
    } catch (error) {
      console.error('Error toggling featured status:', error)
      alert('Failed to toggle featured status')
    }
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
      const endpoint = '/api/admin/blogs'
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
    const currentItems = blogs
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(currentItems.map((item: Blog) => item._id))
    }
  }

  const clearFilters = () => {
    setContentSearch('')
    setStatusFilter('all')
    setAuthorFilter('')

    setDateFromFilter('')
    setDateToFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  if (loading) {
    return (
      <LoadingState 
        text={t('admin.loading') || 'Loading admin panel...'}
        gradientFrom="from-red-50"
        gradientVia="via-pink-50"
        gradientTo="to-purple-50"
        spinnerColor="border-red-600"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <Container size="xl" padding="none">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
                  <p className="text-gray-600">{t('admin.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{t('admin.systemOnline')}</span>
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
        </Container>
      </div>

      <Container size="xl" padding="lg">
        <div className="py-6">
          {/* Enhanced Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-md mb-8 overflow-hidden">
            <nav className="flex flex-nowrap">
              <button
                onClick={() => handleTabChange('blogs')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'blogs'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t('admin.tabs.blogs')}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {getByStatus(blogs, 'pending').length > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {getByStatus(blogs, 'pending').length}
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
                {t('admin.tabs.users')}
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
                <Building className="w-4 h-4 mr-2" />
                {t('admin.tabs.ngos')}
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
                {t('admin.tabs.events')}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {eventStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {eventStats.pending}
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
                {t('admin.tabs.vacancies')}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {vacancyStats.pending > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {vacancyStats.pending}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTabChange('materials')}
                disabled={tabLoading}
                className={`relative flex items-center px-2 sm:px-3 py-2 sm:py-3 font-medium text-xs transition-all duration-200 disabled:opacity-50 border-b-4 whitespace-nowrap ${
                  activeTab === 'materials'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('admin.tabs.materials') || 'Materials'}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                  {materialStats.total > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full px-2 py-1 font-semibold shadow-sm">
                      {materialStats.total}
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
                {t('admin.tabs.notifications')}
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
                {t('admin.tabs.settings')}
                <div className="ml-2 w-6 h-4 flex items-center justify-center">
                </div>
              </button>
            </nav>
          </div>

          {/* Blogs Tab */}
          {activeTab === 'blogs' && (
            <div className="space-y-6">
              {/* Blogs Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.pending')}</p>
                      <p className="text-3xl font-bold text-yellow-600">{getByStatus(blogs, 'pending').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.approved')}</p>
                      <p className="text-3xl font-bold text-green-600">{getByStatus(blogs, 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.rejected')}</p>
                      <p className="text-3xl font-bold text-red-600">{getByStatus(blogs, 'rejected').length}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalBlogs')}</p>
                      <p className="text-3xl font-bold text-blue-600">{blogs.length}</p>
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
                        placeholder={t('admin.search.blogs')}
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Toggle */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="md"
                    className="flex items-center gap-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    <Filter className="w-4 h-4" />
                    {t('admin.filters.filters')}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.filters.status')}</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="all">{t('admin.filters.allStatus')}</option>
                        <option value="pending">{t('admin.stats.pending')}</option>
                        <option value="approved">{t('admin.stats.approved')}</option>
                        <option value="rejected">{t('admin.stats.rejected')}</option>
                      </select>
                    </div>

                    {/* Author Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.filters.author')}</label>
                      <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">{t('admin.filters.allAuthors')}</option>
                        {availableFilters.authors.map(author => (
                          <option key={author} value={author}>{author}</option>
                        ))}
                      </select>
                    </div>



                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.filters.sortBy')}</label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="createdAt">{t('admin.filters.date')}</option>
                          <option value="title">{t('admin.filters.title')}</option>
                          <option value="author">{t('admin.filters.author')}</option>
                        </select>
                        <Button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                        >
                          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.filters.dateRange')}</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <span className="self-center text-gray-500">{t('admin.filters.to')}</span>
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="md"
                        className="w-full text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-600 transition-all"
                      >
                        {t('admin.filters.clearAll')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mt-4">
                    <span className="text-sm font-medium text-blue-800">
                      {t('admin.bulkActions.itemsSelected', { count: selectedItems.length })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBulkAction('approve')}
                        variant="primary"
                        size="sm"
                      >
                        {t('admin.bulkActions.approve')}
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('reject')}
                        variant="danger"
                        size="sm"
                      >
                        {t('admin.bulkActions.reject')}
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('delete')}
                        variant="secondary"
                        size="sm"
                      >
                        {t('admin.bulkActions.delete')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Blogs List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('admin.blogs.count', { count: blogs.length })}
                  </h2>
                  {blogs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === blogs.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-600">{t('admin.list.selectAll')}</span>
                    </div>
                  )}
                </div>
                <div className="px-6 py-6">
                  {blogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {t('admin.list.noBlogs')}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {blogs.map((blog) => (
                        <div key={blog._id} className={`border border-gray-200 rounded-xl p-6 transition-all ${
                          selectedItems.includes(blog._id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:shadow-md'
                        }`}>
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(blog._id)}
                              onChange={() => toggleItemSelection(blog._id)}
                              className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                  blog.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  blog.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {blog.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {t('blogs.by')}{' '}
                                  {blog.isAnonymous ? (
                                    t('common.anonymous')
                                  ) : blog.author?._id ? (
                                    <Link 
                                      href={`/profile/${blog.author._id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      target="_blank"
                                    >
                                      {blog.author.name || blog.author.email || t('common.unknown')}
                                    </Link>
                                  ) : (
                                    blog.author?.name || blog.author || t('common.unknown')
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(blog.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {blog.title}
                              </h3>
                              {blog.abstract && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {blog.abstract}
                                </p>
                              )}

                              {blog.adminComment && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                  <p className="text-sm font-medium text-red-800 mb-1">{t('admin.ngos.adminComment')}:</p>
                                  <p className="text-sm text-red-700">{blog.adminComment}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/preview/blog/${blog._id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </Link>
                              {blog.status !== 'pending' && (
                                <Button
                                  onClick={() => handleDeleteBlog(blog._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t('admin.actions.delete')}
                                </Button>
                              )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalUsers')}</p>
                      <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.verifiedUsers')}</p>
                      <p className="text-3xl font-bold text-green-600">{userStats.verified}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.adminUsers')}</p>
                      <p className="text-3xl font-bold text-purple-600">{userStats.admin}</p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* User Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={t('admin.search.users')}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{t('admin.filters.allRoles')}</option>
                      <option value="user">{t('admin.users.users')}</option>
                      <option value="admin">{t('admin.roles.admin')}</option>
                    </select>
                    <Button
                      onClick={handleUserSearch}
                      variant="primary"
                      size="md"
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {t('admin.actions.search')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('admin.users.management')} <span className="ml-2 text-base font-normal text-gray-500">({t('admin.users.count', { count: userPagination.total })})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {t('admin.list.noUsers')}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user._id} className="border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>

                              {user.emailVerified && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {t('admin.users.verified')}
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
                              <span>{t('admin.users.blogs')}: {user.stats?.blogs || 0}</span>
                              <span>{t('admin.users.joined')}: {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            {user.profile?.bio && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {user.profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => handleUserAction(user, 'role')}
                              variant="secondary"
                              size="sm"
                              className="inline-flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t('admin.users.editRole')}
                            </Button>

                            <Button
                              onClick={() => handleUserAction(user, 'delete')}
                              variant="danger"
                              size="sm"
                              className="inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('admin.actions.delete')}
                            </Button>
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
                        {t('admin.actions.page')} {userPagination.page} {t('admin.actions.of')} {userPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUserPageChange(userPagination.page - 1)}
                          disabled={userPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.previous')}
                        </Button>
                        <Button
                          onClick={() => handleUserPageChange(userPagination.page + 1)}
                          disabled={userPagination.page === userPagination.totalPages}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.next')}
                        </Button>
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
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.pending')}</p>
                      <p className="text-3xl font-bold text-yellow-600">{ngoStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.approved')}</p>
                      <p className="text-3xl font-bold text-green-600">{ngoStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.rejected')}</p>
                      <p className="text-3xl font-bold text-red-600">{ngoStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalNGOs')}</p>
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
                        placeholder={t('admin.search.ngos')}
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{t('admin.filters.allStatus')}</option>
                      <option value="pending">{t('admin.stats.pending')}</option>
                      <option value="approved">{t('admin.stats.approved')}</option>
                      <option value="rejected">{t('admin.stats.rejected')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* NGO List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{t('admin.ngos.registrations')}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {ngos.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.list.noNGOs')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('admin.list.noNGOsDescription')}</p>
                    </div>
                  ) : (
                    ngos.map((ngo) => {
                      const status = ngo.status || 'pending';
                      return (
                        <div key={ngo._id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  status === 'approved' ? 'bg-green-100 text-green-800' :
                                  status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                   status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> :
                                   <Clock className="w-3 h-3 mr-1" />}
                                  {status === 'approved' ? t('admin.stats.approved') : status === 'rejected' ? t('admin.stats.rejected') : t('admin.stats.pending')}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                {ngo.organizationName}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {ngo.email}
                              </p>
                              <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                {ngo.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{t('admin.ngos.registered')}: {new Date(ngo.createdAt).toLocaleDateString()}</span>
                                {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                                  <span>{ngo.focusAreas.length} {t('admin.ngos.focusAreas')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Button
                                onClick={() => {
                                  setSelectedNgo(ngo);
                                  setShowNgoDetailModal(true);
                                }}
                                variant="secondary"
                                size="sm"
                                className="inline-flex items-center whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {t('admin.actions.viewDetails')}
                              </Button>
                              {status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleNgoAction(ngo, 'approve')}
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center whitespace-nowrap"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t('admin.actions.approve')}
                                  </Button>
                                  <Button
                                    onClick={() => handleNgoAction(ngo, 'reject')}
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center whitespace-nowrap"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {t('admin.actions.reject')}
                                  </Button>
                                </>
                              )}
                              {status !== 'pending' && (
                                <Button
                                  onClick={() => handleDeleteNgo(ngo._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center whitespace-nowrap"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('admin.actions.delete')}
                                </Button>
                              )}
                            </div>
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
                        {t('admin.actions.page')} {ngoPagination.page} {t('admin.actions.of')} {ngoPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleNgoPageChange(ngoPagination.page - 1)}
                          disabled={ngoPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.previous')}
                        </Button>
                        <Button
                          onClick={() => handleNgoPageChange(ngoPagination.page + 1)}
                          disabled={ngoPagination.page === ngoPagination.totalPages}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.next')}
                        </Button>
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
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.pending')}</p>
                      <p className="text-3xl font-bold text-yellow-600">{eventStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.approved')}</p>
                      <p className="text-3xl font-bold text-green-600">{eventStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.rejected')}</p>
                      <p className="text-3xl font-bold text-red-600">{eventStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalEvents')}</p>
                      <p className="text-3xl font-bold text-blue-600">{eventStats.total}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Event Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={t('admin.search.events')}
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{t('admin.filters.allStatus')}</option>
                      <option value="pending">{t('admin.stats.pending')}</option>
                      <option value="approved">{t('admin.stats.approved')}</option>
                      <option value="rejected">{t('admin.stats.rejected')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Event List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{t('admin.events.submissions')}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {events.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.list.noEvents')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('admin.list.noEventsDescription')}</p>
                    </div>
                  ) : (
                    events.map((event) => {
                      const status = event.status || 'pending';
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
                                  {status === 'approved' ? t('admin.stats.approved') : status === 'rejected' ? t('admin.stats.rejected') : t('admin.stats.pending')}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 capitalize">
                                  {event.eventType || 'Event'}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {event.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{event.description?.substring(0, 150)}...</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>{t('admin.events.organizer')}: {event.organizationName || 'Unknown'}</span>
                                <span>•</span>
                                  <span>{t('admin.events.date')}: {new Date(event.eventDate).toLocaleDateString()}</span>
                                {event.endDate && (
                                  <>
                                    <span>-</span>
                                    <span>{new Date(event.endDate).toLocaleDateString()}</span>
                                  </>
                                )}
                                <span>•</span>
                                  <span>{t('admin.events.location')}: {event.location?.type || 'Unknown location'}</span>
                              </div>
                              {event.adminComment && status === 'rejected' && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700"><strong>{t('admin.events.adminComment')}:</strong> {event.adminComment}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleEventAction(event, 'approve')}
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                      {t('admin.actions.approve')}
                                  </Button>
                                  <Button
                                    onClick={() => handleEventAction(event, 'reject')}
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                      {t('admin.actions.reject')}
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() => window.open(`/admin/preview/events/${event._id}`, '_blank')}
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center text-xs"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                  {t('admin.actions.view')}
                              </Button>
                              {status !== 'pending' && (
                                <Button
                                  onClick={() => handleDeleteEvent(event._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center text-xs"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t('admin.actions.delete')}
                                </Button>
                              )}
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
                        {t('admin.actions.page')} {eventPagination.page} {t('admin.actions.of')} {eventPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEventPageChange(eventPagination.page - 1)}
                          disabled={eventPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.previous')}
                        </Button>
                        <Button
                          onClick={() => handleEventPageChange(eventPagination.page + 1)}
                          disabled={eventPagination.page === eventPagination.totalPages}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.next')}
                        </Button>
                      </div>
                    </div>
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
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t('admin.stats.pending')}</p>
                      <p className="text-3xl font-bold text-yellow-600">{vacancyStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t('admin.stats.approved')}</p>
                      <p className="text-3xl font-bold text-green-600">{vacancyStats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t('admin.stats.rejected')}</p>
                      <p className="text-3xl font-bold text-red-600">{vacancyStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalVacancies')}</p>
                      <p className="text-3xl font-bold text-blue-600">{vacancyStats.total}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Vacancy Search and Filter Controls */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={t('admin.search.vacancies')}
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                    >
                      <option value="all">{t('admin.filters.allStatus')}</option>
                      <option value="pending">{t('admin.stats.pending')}</option>
                      <option value="approved">{t('admin.stats.approved')}</option>
                      <option value="rejected">{t('admin.stats.rejected')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vacancy List */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{t('admin.vacancies.submissions')}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {vacancies.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.list.noVacancies')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('admin.list.noVacanciesDescription')}</p>
                    </div>
                  ) : (
                    vacancies.map((vacancy) => {
                      const status = vacancy.status || 'pending';
                      return (
                        <div key={vacancy._id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
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
                                  {vacancy.category}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{vacancy.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{vacancy.description?.substring(0, 150)}...</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>{t('admin.vacancies.organization')}: {vacancy.organizationName || 'Unknown'}</span>
                                <span>•</span>
                                  <span>{t('admin.vacancies.deadline')}: {new Date(vacancy.applicationDeadline).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{vacancy.location?.isRemote ? 'Remote' : `${vacancy.location?.city || ''} ${vacancy.location?.country || ''}`.trim() || t('admin.vacancies.locationTBD')}</span>
                                <span>•</span>
                                <span>{vacancy.compensation?.type}: {vacancy.compensation?.amount ? `${vacancy.compensation.amount} ${vacancy.compensation.currency || ''}` : t('admin.vacancies.notSpecified')}</span>
                              </div>
                              {vacancy.adminComment && status === 'rejected' && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700"><strong>{t('admin.vacancies.adminComment')}:</strong> {vacancy.adminComment}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleVacancyAction(vacancy, 'approve')}
                                    variant="primary"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                      {t('admin.actions.approve')}
                                  </Button>
                                  <Button
                                    onClick={() => handleVacancyAction(vacancy, 'reject')}
                                    variant="danger"
                                    size="sm"
                                    className="inline-flex items-center text-xs"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                      {t('admin.actions.reject')}
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() => window.open(`/admin/preview/vacancies/${vacancy._id}`, '_blank')}
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center text-xs"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                  {t('admin.actions.view')}
                              </Button>
                              {status !== 'pending' && (
                                <Button
                                  onClick={() => handleDeleteVacancy(vacancy._id)}
                                  variant="danger"
                                  size="sm"
                                  className="inline-flex items-center text-xs"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t('admin.actions.delete')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Vacancy Pagination */}
                {vacancyPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {t('admin.actions.page')} {vacancyPagination.page} {t('admin.actions.of')} {vacancyPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVacancyPageChange(vacancyPagination.page - 1)}
                          disabled={vacancyPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.previous')}
                        </Button>
                        <Button
                          onClick={() => handleVacancyPageChange(vacancyPagination.page + 1)}
                          disabled={vacancyPagination.page === vacancyPagination.totalPages}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.next')}
                        </Button>
                      </div>
                    </div>
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
                        <h2 className="text-2xl font-bold text-gray-900">{t('admin.notifications.title')}</h2>
                        <p className="text-gray-600">{t('admin.notifications.description')}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowAnnouncementModal(true)}
                    variant="primary"
                    size="md"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                      {t('admin.notifications.sendAnnouncement')}
                  </Button>
                </div>

                {/* Notification Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-gray-600">{t('admin.notifications.total')}</p>
                        <p className="text-3xl font-bold text-blue-600">{notificationStats.total}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-gray-600">{t('admin.notifications.read')}</p>
                        <p className="text-3xl font-bold text-green-600">{notificationStats.read}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-gray-600">{t('admin.stats.unread')}</p>
                        <p className="text-3xl font-bold text-yellow-600">{notificationStats.unread}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-gray-600">{t('admin.notifications.today')}</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">{t('admin.notifications.createNew')}</h3>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); sendAnnouncement(); }} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.titleLabel')} *</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t('admin.notifications.titlePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.messageLabel')} *</label>
                    <textarea
                      rows={4}
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder={t('admin.notifications.messagePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.targetAudience')}</label>
                    <Select 
                      value={announcementForm.targetUsers}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                      options={[
                          { value: "all", label: t('admin.notifications.allUsers') },
                        { value: "verified", label: t('admin.notifications.verifiedOnly') }
                      ]}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setAnnouncementForm({
                        type: 'announcement',
                        title: '',
                        message: '',
                        targetUsers: 'all',
                        target: 'all',
                        userIds: ''
                      })}
                    >
                      {t('admin.notifications.clearForm')}
                    </Button>
                    <Button 
                      type="submit"
                      variant="primary"
                      disabled={sendingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim()}
                      loading={sendingAnnouncement}
                      icon={sendingAnnouncement ? undefined : Send}
                    >
                      {sendingAnnouncement ? t('admin.notifications.sending') : t('admin.notifications.sendButton')}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Announcements List */}
              <div className="bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('admin.notifications.sentList', { count: notifications.length })}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('admin.notifications.sentDescription')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="px-3 py-2 text-sm">
                      {t('admin.filters.filters')}
                    </Button>
                    <Button 
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
                      className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {t('admin.notifications.newAnnouncement')}
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-6">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">{t('admin.notifications.noAnnouncements')}</p>
                      <p className="text-gray-400 text-sm mt-2">{t('admin.notifications.createFirst')}</p>
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
                                  {t('admin.notifications.badge')}
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
                                <span>{t('admin.notifications.recipients')}: {notification.userId ? `${notification.userId.name}` : t('admin.notifications.allUsers')}</span>
                                <span>•</span>
                                <span>{t('admin.notifications.sentAt')}: {new Date(notification.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
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
                                variant="ghost"
                                size="sm"
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title={t('admin.notifications.editTitle')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => deleteNotification(notification._id)}
                                variant="ghost"
                                size="sm"
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={t('admin.notifications.deleteTitle')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                        {t('admin.actions.page')} {notificationPagination.page} {t('admin.actions.of')} {notificationPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            const newPage = notificationPagination.page - 1;
                            setNotificationPagination(prev => ({ ...prev, page: newPage }));
                            // Fetch new page data
                            try {
                              const params = new URLSearchParams({
                                page: newPage.toString(),
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
                          }}
                          disabled={notificationPagination.page === 1}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.previous')}
                        </Button>
                        <Button
                          onClick={async () => {
                            const newPage = notificationPagination.page + 1;
                            setNotificationPagination(prev => ({ ...prev, page: newPage }));
                            // Fetch new page data
                            try {
                              const params = new URLSearchParams({
                                page: newPage.toString(),
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
                          }}
                          disabled={notificationPagination.page === notificationPagination.totalPages}
                          variant="secondary"
                          size="sm"
                        >
                          {t('admin.actions.next')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black">Materials Management</h2>
                        <p className="text-blue-100 mt-1">Organize and manage educational resources</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateMaterial}
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 py-3"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Add New Material
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total</p>
                        <p className="text-3xl font-bold mt-1">{materialStats.total}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Published</p>
                        <p className="text-3xl font-bold mt-1">{materialStats.published}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-300" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Draft</p>
                        <p className="text-3xl font-bold mt-1">{materialStats.unpublished}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-300" />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Featured</p>
                        <p className="text-3xl font-bold mt-1">{materialStats.featured}</p>
                      </div>
                      <Tag className="w-8 h-8 text-purple-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Materials</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by title, description, or provider..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={materialCategoryFilter}
                      onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="all">All Categories</option>
                      <option value="toolkit">🛠️ Toolkit</option>
                      <option value="course">📚 Course</option>
                      <option value="video">🎥 Video</option>
                      <option value="guide">📖 Guide</option>
                      <option value="document">📄 Document</option>
                      <option value="emergency">🚨 Emergency</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setMaterialSearch('')
                        setMaterialCategoryFilter('all')
                        loadMaterials()
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Materials Table */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Materials List ({materials.length})
                    </h3>
                    <div className="text-sm text-gray-500">
                      {materialCategoryFilter !== 'all' && `Filtered by: ${materialCategoryFilter}`}
                    </div>
                  </div>
                </div>
                
                {tabLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Loading materials...</span>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
                    <p className="text-gray-500 mb-6">
                      {materialSearch || materialCategoryFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Get started by adding your first material'}
                    </p>
                    {!materialSearch && materialCategoryFilter === 'all' && (
                      <Button onClick={handleCreateMaterial} variant="primary">
                        <FileText className="w-4 h-4 mr-2" />
                        Add First Material
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Engagement
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {materials.map((material) => (
                          <tr key={material._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                {material.imageUrl && (
                                  <Image
                                    src={material.imageUrl}
                                    alt={material.title}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                    {material.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">
                                    {material.description}
                                  </div>
                                  {material.provider && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      by {material.provider}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {material.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{material.type || 'N/A'}</div>
                              {material.duration && (
                                <div className="text-xs text-gray-500">{material.duration}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {material.views || 0}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleToggleMaterialPublish(material)}
                                  className={`px-3 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full transition-all ${
                                    material.isPublished
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                  title="Click to toggle publish status"
                                >
                                  {material.isPublished ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Published
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Draft
                                    </>
                                  )}
                                </button>
                                {material.featured && (
                                  <span className="px-3 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    <Tag className="w-3 h-3 mr-1" />
                                    Featured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleMaterialFeatured(material)}
                                  className={`p-2 rounded-lg transition-all ${
                                    material.featured
                                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                  title={material.featured ? 'Remove from featured' : 'Add to featured'}
                                >
                                  <Tag className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditMaterial(material)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                  title="Edit material"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMaterial(material._id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                  title="Delete material"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  <span className="ml-2 text-gray-600">{t('admin.settings.loadingSettings')}</span>
                </div>
              ) : (
                <>
                  {/* Settings Header */}
                  <div className="bg-white shadow-lg rounded-2xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-500" />
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{t('admin.settings.title')}</h2>
                          <p className="text-gray-600">{t('admin.settings.description')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={loadSettingsHistory}
                          variant="secondary"
                          size="md"
                          className="inline-flex items-center bg-gray-600 text-white hover:bg-gray-700"
                        >
                          <History className="w-4 h-4 mr-2" />
                          {t('admin.settings.history')}
                        </Button>
                        <Button
                          onClick={() => resetSettings()}
                          variant="danger"
                          size="md"
                          className="inline-flex items-center"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {t('admin.settings.resetToDefaults')}
                        </Button>
                        <Button
                          onClick={saveSettings}
                          disabled={!settingsChanged || savingSettings}
                          variant="primary"
                          size="md"
                          className="inline-flex items-center"
                        >
                          {savingSettings ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {savingSettings ? t('admin.settings.savingSettings') : t('admin.settings.saveSettings')}
                        </Button>
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
                              { id: 'siteInfo', label: t('admin.settings.nav.siteInfo'), icon: '🌐' },
                              { id: 'contentPolicies', label: t('admin.settings.nav.contentPolicies'), icon: '📝' },
                              { id: 'userManagement', label: t('admin.settings.nav.userManagement'), icon: '👥' },
                              { id: 'notifications', label: t('admin.settings.nav.notifications'), icon: '🔔' },
                              { id: 'security', label: t('admin.settings.nav.security'), icon: '🔒' },
                              { id: 'features', label: t('admin.settings.nav.features'), icon: '⚡' }
                            ].map((section) => (
                              <Button
                                key={section.id}
                                onClick={() => setActiveSettingsSection(section.id)}
                                variant={activeSettingsSection === section.id ? 'primary' : 'ghost'}
                                size="sm"
                                className={`w-full text-left justify-start ${
                                  activeSettingsSection === section.id
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className="mr-2">{section.icon}</span>
                                {section.label}
                              </Button>
                            ))}
                          </nav>
                        </div>
                      </div>

                      {/* Settings Content */}
                      <div className="lg:col-span-3">
                        <div className="bg-white shadow-lg rounded-2xl p-6">
                          {activeSettingsSection === 'siteInfo' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.nav.siteInfo')}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.siteName')}</label>
                                  <input
                                    type="text"
                                    value={settings.siteInfo.siteName}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.siteUrl')}</label>
                                  <input
                                    type="url"
                                    value={settings.siteInfo.siteUrl}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.siteDescription')}</label>
                                  <textarea
                                    value={settings.siteInfo.siteDescription}
                                    onChange={(e) => updateSettingsField('siteInfo', 'siteDescription', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.contactEmail')}</label>
                                  <input
                                    type="email"
                                    value={settings.siteInfo.contactEmail}
                                    onChange={(e) => updateSettingsField('siteInfo', 'contactEmail', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.supportEmail')}</label>
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
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.nav.contentPolicies')}</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.requireApproval')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.requireApprovalDescription')}</p>
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
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.autoApproveVerifiedUsers')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.autoApproveVerifiedUsersDescription')}</p>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.maxArticleLength')}</label>
                                    <input
                                      type="number"
                                      value={settings.contentPolicies.maxArticleLength}
                                      onChange={(e) => updateSettingsField('contentPolicies', 'maxArticleLength', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.maxBlogLength')}</label>
                                    <input
                                      type="number"
                                      value={settings.contentPolicies.maxBlogLength}
                                      onChange={(e) => updateSettingsField('contentPolicies', 'maxBlogLength', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'userManagement' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.nav.userManagement')}</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.registrationEnabled')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.registrationEnabledDescription')}</p>
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
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.requireEmailVerification')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.requireEmailVerificationDescription')}</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={settings.userManagement.requireEmailVerification}
                                    onChange={(e) => updateSettingsField('userManagement', 'requireEmailVerification', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.defaultUserRole')}</label>
                                  <select
                                    value={settings.userManagement.defaultUserRole}
                                    onChange={(e) => updateSettingsField('userManagement', 'defaultUserRole', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  >
                                    <option value="user">{t('admin.settings.roles.user')}</option>
                                    <option value="contributor">{t('admin.settings.roles.contributor')}</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSettingsSection === 'security' && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.securitySettings')}</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.enableTwoFactor')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.enableTwoFactorDescription')}</p>
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
                                    <label className="text-sm font-medium text-gray-700">{t('admin.settings.enableRateLimit')}</label>
                                    <p className="text-xs text-gray-500">{t('admin.settings.enableRateLimitDescription')}</p>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.sessionTimeout')}</label>
                                    <input
                                      type="number"
                                      value={settings.security.sessionTimeout}
                                      onChange={(e) => updateSettingsField('security', 'sessionTimeout', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.maxLoginAttempts')}</label>
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
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.featuresTitle')}</h3>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative w-full max-w-lg mx-auto p-6 border shadow-2xl rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                </h3>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
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
                  {t('admin.modals.comment')}
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder={t('admin.modals.commentPlaceholder')}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  variant="danger"
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : t('admin.actions.reject')}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  variant="primary"
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : t('admin.actions.approve')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowUserModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {userAction === 'role' && t('admin.users.changeRole')}
                {userAction === 'delete' && t('admin.users.deleteUser')}
              </h3>
              <Button
                onClick={() => setShowUserModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
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
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {t(`admin.roles.${selectedUser.role}`)}
                  </span>

                </div>
              </div>

              {userAction === 'role' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.selectNewRole')}
                  </label>
                  <select
                    defaultValue={selectedUser.role}
                    onChange={(e) => {
                      setSelectedUser({ ...selectedUser, role: e.target.value as 'user' | 'admin' })
                    }}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="user">{t('admin.roles.user')}</option>
                    <option value="admin">{t('admin.roles.admin')}</option>
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
                          {t('admin.users.deleteWarningTitle')}
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            {t('admin.users.deleteWarningBody')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowUserModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={executeUserAction}
                  disabled={isProcessing}
                  variant={userAction === 'delete' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : (
                    userAction === 'role' ? t('admin.users.updateRole') :
                    t('admin.users.deleteUser')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowBulkModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
        {t('admin.bulkActions.bulk')} {bulkAction === 'approve' ? t('admin.bulkActions.approve') : 
          bulkAction === 'reject' ? t('admin.bulkActions.reject') : 
          bulkAction === 'delete' ? t('admin.bulkActions.delete') : t('admin.actions.edit')} {activeTab}
              </h3>
              <Button
                onClick={() => setShowBulkModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {t('admin.bulkActions.confirm', { action: t(`admin.bulkActions.${bulkAction}`), count: selectedItems.length, type: activeTab.slice(0, -1) })}
                </p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {selectedItems.map(id => {
                    const item = blogs.find((b: Blog) => b._id === id)
                    return (
                      <div key={id} className="text-sm text-gray-700 mb-1">
                        • {item?.title || t('common.unknown')}
                      </div>
                    )
                  })}
                </div>
              </div>

              {(bulkAction === 'reject' || bulkAction === 'approve') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.modals.comment')} {bulkAction === 'reject' ? `(${t('admin.common.required')})` : `(${t('admin.common.optional')})`}
                  </label>
                  <textarea
                    value={bulkComment}
                    onChange={(e) => setBulkComment(e.target.value)}
                    placeholder={t('admin.modals.commentPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowBulkModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={executeBulkAction}
                  disabled={isProcessing || (bulkAction === 'reject' && !bulkComment.trim())}
                  variant={bulkAction === 'delete' || bulkAction === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : 
                   bulkAction === 'approve' ? t('admin.bulkActions.approveAll') :
                   bulkAction === 'reject' ? t('admin.bulkActions.rejectAll') :
                   bulkAction === 'delete' ? t('admin.bulkActions.deleteAll') : t('admin.bulkActions.updateAll')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NGO Action Modal */}
      {/* NGO Detail Modal */}
      {showNgoDetailModal && selectedNgo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNgoDetailModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('admin.ngos.registrationDetails')}
              </h3>
              <Button
                onClick={() => setShowNgoDetailModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedNgo.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedNgo.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedNgo.status === 'approved' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                   selectedNgo.status === 'rejected' ? <XCircle className="w-4 h-4 mr-1" /> :
                   <Clock className="w-4 h-4 mr-1" />}
                  {selectedNgo.status === 'approved' ? t('admin.stats.approved') : 
                   selectedNgo.status === 'rejected' ? t('admin.stats.rejected') : 
                   t('admin.stats.pending')}
                </span>
              </div>

              {/* Organization Name */}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedNgo.organizationName}
                </h4>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold text-gray-900 mb-3">{t('admin.ngos.contactInformation')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.ngos.email')}:</span>
                    <p className="text-gray-600">{selectedNgo.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.ngos.contactPerson')}:</span>
                    <p className="text-gray-600">{selectedNgo.contactPerson.name}</p>
                  </div>
                  {selectedNgo.contactPerson.position && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.position')}:</span>
                      <p className="text-gray-600">{selectedNgo.contactPerson.position}</p>
                    </div>
                  )}
                  {selectedNgo.contactPhone && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.phone')}:</span>
                      <p className="text-gray-600">{selectedNgo.contactPhone}</p>
                    </div>
                  )}
                  {selectedNgo.contactPerson.phone && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.contactPhone')}:</span>
                      <p className="text-gray-600">{selectedNgo.contactPerson.phone}</p>
                    </div>
                  )}
                  {selectedNgo.contactPerson.email && selectedNgo.contactPerson.email !== selectedNgo.email && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.contactEmail')}:</span>
                      <p className="text-gray-600">{selectedNgo.contactPerson.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">{t('admin.ngos.description')}</h5>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNgo.description}
                </p>
              </div>

              {/* Organization Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold text-gray-900 mb-3">{t('admin.ngos.organizationDetails')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedNgo.website && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.website')}:</span>
                      <a href={selectedNgo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                        {selectedNgo.website}
                      </a>
                    </div>
                  )}
                  {selectedNgo.address && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.address')}:</span>
                      <p className="text-gray-600">{selectedNgo.address}</p>
                    </div>
                  )}
                  {selectedNgo.registrationNumber && (
                    <div>
                      <span className="font-medium text-gray-700">{t('admin.ngos.registrationNumber')}:</span>
                      <p className="text-gray-600">{selectedNgo.registrationNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Focus Areas */}
              {selectedNgo.focusAreas && selectedNgo.focusAreas.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">{t('admin.ngos.focusAreas')}</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedNgo.focusAreas.map((area: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {selectedNgo.socialMedia && Object.values(selectedNgo.socialMedia).some(val => val) && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">{t('admin.ngos.socialMedia')}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {selectedNgo.socialMedia.facebook && (
                      <a href={selectedNgo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Facebook
                      </a>
                    )}
                    {selectedNgo.socialMedia.twitter && (
                      <a href={selectedNgo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Twitter
                      </a>
                    )}
                    {selectedNgo.socialMedia.instagram && (
                      <a href={selectedNgo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Instagram
                      </a>
                    )}
                    {selectedNgo.socialMedia.linkedin && (
                      <a href={selectedNgo.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {selectedNgo.socialMedia.youtube && (
                      <a href={selectedNgo.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Comment (if rejected) */}
              {selectedNgo.adminComment && selectedNgo.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-900 mb-2">{t('admin.ngos.adminComment')}</h5>
                  <p className="text-red-700 text-sm">{selectedNgo.adminComment}</p>
                </div>
              )}

              {/* Registration Date */}
              <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                <p>{t('admin.ngos.registered')}: {new Date(selectedNgo.createdAt).toLocaleDateString()} {new Date(selectedNgo.createdAt).toLocaleTimeString()}</p>
                {selectedNgo.approvedAt && (
                  <p>{t('admin.ngos.approved')}: {new Date(selectedNgo.approvedAt).toLocaleDateString()} {new Date(selectedNgo.approvedAt).toLocaleTimeString()}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedNgo.status === 'pending' && (
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <Button
                  onClick={() => {
                    setShowNgoDetailModal(false);
                    handleNgoAction(selectedNgo, 'reject');
                  }}
                  variant="danger"
                  size="md"
                  className="inline-flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('admin.actions.reject')}
                </Button>
                <Button
                  onClick={() => {
                    setShowNgoDetailModal(false);
                    handleNgoAction(selectedNgo, 'approve');
                  }}
                  variant="primary"
                  size="md"
                  className="inline-flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('admin.actions.approve')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NGO Approve/Reject Modal */}
      {showNgoModal && selectedNgo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowNgoModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {ngoAction === 'approve' ? t('admin.ngos.approveRegistration') : t('admin.ngos.rejectRegistration')}
              </h3>
              <Button
                onClick={() => setShowNgoModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedNgo.organizationName}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {t('admin.ngos.contact')}: {selectedNgo.contactPerson.name} ({selectedNgo.email})
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  {selectedNgo.description}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                  {selectedNgo.website && (
                    <span>{t('admin.ngos.website')}: {selectedNgo.website}</span>
                  )}
                  {selectedNgo.contactPhone && (
                    <span>{t('admin.ngos.phone')}: {selectedNgo.contactPhone}</span>
                  )}
                  {selectedNgo.address && (
                    <span>{t('admin.ngos.address')}: {selectedNgo.address}</span>
                  )}
                  {selectedNgo.registrationNumber && (
                    <span>{t('admin.ngos.registrationNumber')}: {selectedNgo.registrationNumber}</span>
                  )}
                </div>
                {selectedNgo.focusAreas && selectedNgo.focusAreas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">{t('admin.ngos.focusAreas')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNgo.focusAreas.map((area: string, index: number) => (
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
                          {t('admin.ngos.approveRegistration')}
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            {t('admin.ngos.approveDescription')}
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
                          {t('admin.ngos.rejectRegistration')}
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            {t('admin.ngos.rejectDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.ngos.adminComment')} ({t('admin.common.required')})
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder={t('admin.ngos.rejectReasonPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowNgoModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={executeNgoAction}
                  disabled={isProcessing || (ngoAction === 'reject' && !adminComment.trim())}
                  variant={ngoAction === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : (
                    ngoAction === 'approve' ? t('admin.actions.approve') : t('admin.actions.reject')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Action Modal */}
      {showEventModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowEventModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {eventAction === 'approve' ? t('admin.events.approveTitle') : t('admin.events.rejectTitle')}
              </h3>
              <Button
                onClick={() => setShowEventModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.events.category')}:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.events.creator')}:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.organizationName || t('common.unknown')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.events.startDate')}:</span>
                    <span className="ml-2 text-gray-600">{new Date(selectedEvent.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.events.location')}:</span>
                    <span className="ml-2 text-gray-600">{selectedEvent.location?.type || t('common.unknown')}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">{t('admin.events.description')}:</span>
                  <p className="mt-1 text-gray-600 text-sm">{selectedEvent.description}</p>
                </div>
              </div>

              {eventAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.events.adminComment')} ({t('admin.common.required')})
                  </label>
                  <textarea
                    value={eventRejectionReason}
                    onChange={(e) => setEventRejectionReason(e.target.value)}
                    placeholder={t('admin.events.rejectPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowEventModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={executeEventAction}
                  disabled={isProcessing || (eventAction === 'reject' && !eventRejectionReason.trim())}
                  variant={eventAction === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : (
                    eventAction === 'approve' ? t('admin.events.approveTitle') : t('admin.events.rejectTitle')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vacancy Modal */}
      {showVacancyModal && selectedVacancy && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowVacancyModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {vacancyAction === 'approve' ? t('admin.vacancies.approveTitle') : t('admin.vacancies.rejectTitle')}
              </h3>
              <Button
                onClick={() => setShowVacancyModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedVacancy.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.category')}:</span>
                    <span className="ml-2 text-gray-600">{selectedVacancy.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.organization')}:</span>
                    <span className="ml-2 text-gray-600">{selectedVacancy.organizationName || t('common.unknown')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.deadline')}:</span>
                    <span className="ml-2 text-gray-600">{new Date(selectedVacancy.applicationDeadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.location')}:</span>
                    <span className="ml-2 text-gray-600">{selectedVacancy.location?.isRemote ? t('admin.vacancies.remote') : `${selectedVacancy.location?.city || ''} ${selectedVacancy.location?.country || ''}`.trim() || t('admin.vacancies.locationTBD')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.compensation')}:</span>
                    <span className="ml-2 text-gray-600">{selectedVacancy.compensation?.type}: {selectedVacancy.compensation?.amount ? `${selectedVacancy.compensation.amount} ${selectedVacancy.compensation.currency || ''}` : t('admin.vacancies.notSpecified')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('admin.vacancies.type')}:</span>
                    <span className="ml-2 text-gray-600">{selectedVacancy.type}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">{t('admin.vacancies.description')}:</span>
                  <p className="mt-1 text-gray-600 text-sm">{selectedVacancy.description}</p>
                </div>
                {selectedVacancy.requirements && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">{t('admin.vacancies.requirements')}:</span>
                    <p className="mt-1 text-gray-600 text-sm">{selectedVacancy.requirements}</p>
                  </div>
                )}
              </div>

              {vacancyAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.vacancies.adminComment')} ({t('admin.common.required')})
                  </label>
                  <textarea
                    value={vacancyRejectionReason}
                    onChange={(e) => setVacancyRejectionReason(e.target.value)}
                    placeholder={t('admin.vacancies.rejectPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowVacancyModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  onClick={executeVacancyAction}
                  disabled={isProcessing || (vacancyAction === 'reject' && !vacancyRejectionReason.trim())}
                  variant={vacancyAction === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {isProcessing ? t('admin.modals.processing') : (
                    vacancyAction === 'approve' ? t('admin.vacancies.approveTitle') : t('admin.vacancies.rejectTitle')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Announcement Modal */}
          {showAnnouncementModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl mx-auto p-6 border shadow-2xl rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('admin.notifications.sendAnnouncement')}</h3>
              <Button
                onClick={() => setShowAnnouncementModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendAnnouncement(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.formTitle')}</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('admin.notifications.titlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.message')}</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('admin.notifications.messagePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.targetAudience')}</label>
                <select
                  value={announcementForm.target}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('admin.notifications.allUsers')}</option>
                  <option value="verified">{t('admin.notifications.verifiedUsersOnly')}</option>
                  <option value="specific">{t('admin.notifications.specificUsers')}</option>
                </select>
              </div>

              {announcementForm.target === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.notifications.userIdsLabel')}</label>
                  <input
                    type="text"
                    value={announcementForm.userIds}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, userIds: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('admin.notifications.userIdsPlaceholder')}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('admin.modals.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={sendingAnnouncement}
                  variant="primary"
                  size="sm"
                >
                  {sendingAnnouncement ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                      {t('admin.notifications.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2 inline" />
                      {t('admin.notifications.sendAnnouncement')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Form Modal */}
      {showMaterialFormModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setShowMaterialFormModal(false)
            setSelectedMaterial(null)
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMaterial ? 'Edit Material' : 'Add New Material'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <Input
                    type="text"
                    value={materialFormData.title || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, title: e.target.value })}
                    placeholder="Material title"
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <TextArea
                    value={materialFormData.description || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                    placeholder="Detailed description of the material"
                    rows={3}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={materialFormData.category || 'other'}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="toolkit">Toolkit</option>
                    <option value="course">Course</option>
                    <option value="video">Video</option>
                    <option value="guide">Guide</option>
                    <option value="document">Document</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <Input
                    type="text"
                    value={materialFormData.type || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, type: e.target.value })}
                    placeholder="e.g., PDF, Video Course, Interactive Tool"
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                  <Input
                    type="url"
                    value={materialFormData.url || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, url: e.target.value })}
                    placeholder="https://example.com/resource"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <Input
                    type="text"
                    value={materialFormData.provider || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, provider: e.target.value })}
                    placeholder="Organization or provider name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <Input
                    type="text"
                    value={materialFormData.duration || ''}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, duration: e.target.value })}
                    placeholder="e.g., 4 weeks, 30 minutes"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma-separated)</label>
                  <Input
                    type="text"
                    value={materialFormData.language?.join(', ') || ''}
                    onChange={(e) => setMaterialFormData({ 
                      ...materialFormData, 
                      language: e.target.value.split(',').map(l => l.trim()).filter(Boolean) 
                    })}
                    placeholder="en, fr, es"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    type="text"
                    value={materialFormData.tags?.join(', ') || ''}
                    onChange={(e) => setMaterialFormData({ 
                      ...materialFormData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                    })}
                    placeholder="gender-equality, education, toolkit"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <Input
                    type="number"
                    value={materialFormData.order || 0}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Image</label>
                  <ImageUpload
                    value={materialFormData.imageUrl || ''}
                    onChange={(url) => setMaterialFormData({ ...materialFormData, imageUrl: url })}
                    context="material"
                    maxSize={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image or leave empty for default
                  </p>
                </div>

                <div className="md:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialFormData.featured || false}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialFormData.isPublished !== false}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowMaterialFormModal(false)
                  setSelectedMaterial(null)
                }}
                variant="outline"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMaterial}
                variant="primary"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 inline" />
                    {selectedMaterial ? 'Update Material' : 'Create Material'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </Container>
    </div>
  )
}
