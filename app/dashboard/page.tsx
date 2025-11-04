'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Calendar, Users, Briefcase, BookOpen, Plus, Eye, Edit, Trash2, Settings, User, BarChart3, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Sparkles, Shield } from 'lucide-react'
import { IEvent } from '@/lib/models/Event'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/Textarea'
import EventManagement from '@/components/dashboard/EventManagement'
import VacancyManagement from '@/components/dashboard/VacancyManagement'
import { Roles } from '@/lib/roles'
import { LoadingState, ErrorState, AnimatedBackground, StatusBadge } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface DashboardItem {
  _id: string
  title: string
  createdAt: string
  status?: string
  type: 'event' | 'training' | 'vacancy'
}

export default function Dashboard() {
  const { t, language } = useLanguage()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<DashboardItem[]>([])
  const [vacancies, setVacancies] = useState<DashboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ngoProfile, setNgoProfile] = useState<any>(null)
  const localePath = useLocalizedPath()
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all events (including all event types)
      const eventsRes = await fetch('/api/events?author=me')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        const allEvents = eventsData.events || []
        
        // Set all events together
        setEvents(allEvents)
      }

      // Fetch vacancies
      const vacanciesRes = await fetch('/api/vacancies?author=me')
      if (vacanciesRes.ok) {
        const vacanciesData = await vacanciesRes.json()
        setVacancies(vacanciesData.vacancies || [])
      }

      // Fetch NGO profile from dedicated endpoint
      const profileRes = await fetch('/api/ngo/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setNgoProfile(profileData.ngo || null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push(localePath("/auth/signin"))
      return
    }

    // Check if user is an NGO (using isApprovedNGO flag, not role)
    if (!session.user?.isApprovedNGO) {
      router.push(localePath("/"))
      return
    }

    fetchDashboardData()
  }, [session, status, router, localePath, fetchDashboardData])

  const handleDelete = async (id: string, type: 'event' | 'training' | 'vacancy') => {
    if (!confirm(t('dashboard.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        if (type === 'event' || type === 'training') {
          setEvents(prev => prev.filter(item => item._id !== id))
        } else if (type === 'vacancy') {
          setVacancies(prev => prev.filter(item => item._id !== id))
        }
      } else {
        alert(t('dashboard.failedToDelete'))
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(t('dashboard.errorDeleting'))
    }
  }

  if (status === 'loading' || loading) {
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

  // Check if user has access - only NGO accounts allowed
  if (!session?.user?.isApprovedNGO) {
    return (
      <ErrorState
        title={t('dashboard.accessDenied')}
        message={t('dashboard.needNGORole')}
        onRetry={() => router.push(localePath("/"))}
        retryText={t('common.backToHome')}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    )
  }

  // Note: NGO dashboard is accessible only by the person who registered the NGO
  // This is automatically ensured since each NGO account is tied to one user

  const NGOProfileDisplay = ({ ngoProfile }: { ngoProfile: any }) => {
    if (!ngoProfile) {
      return (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p>{t('dashboard.profile.noProfile')}</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.organizationName')}</h3>
          <p className="text-gray-600">{ngoProfile.organizationName || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.contactPhone')}</h3>
          <p className="text-gray-600">{ngoProfile.contactPhone || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.description')}</h3>
          <p className="text-gray-600">{ngoProfile.description || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.website')}</h3>
          <p className="text-gray-600">{ngoProfile.website || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.registrationNumber')}</h3>
          <p className="text-gray-600">{ngoProfile.registrationNumber || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.address')}</h3>
          <p className="text-gray-600">{ngoProfile.address || t('dashboard.profile.notSpecified')}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.focusAreas')}</h3>
          <div className="flex flex-wrap gap-2">
            {ngoProfile.focusAreas?.length > 0 ? (
              ngoProfile.focusAreas.map((area: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {area}
                </span>
              ))
            ) : (
              <span className="text-gray-600">{t('dashboard.profile.noFocusAreas')}</span>
            )}
          </div>
        </div>
        {ngoProfile.socialMedia && Object.values(ngoProfile.socialMedia).some((link: any) => link) && (
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900 mb-2">{t('dashboard.profile.socialMedia')}</h3>
            <div className="flex flex-wrap gap-3">
              {ngoProfile.socialMedia.facebook && (
                <a href={ngoProfile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                  {t('profile.social_facebook')}
                </a>
              )}
              {ngoProfile.socialMedia.twitter && (
                <a href={ngoProfile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  {t('profile.social_twitter')}
                </a>
              )}
              {ngoProfile.socialMedia.instagram && (
                <a href={ngoProfile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-500">
                  {t('profile.social_instagram')}
                </a>
              )}
              {ngoProfile.socialMedia.linkedin && (
                <a href={ngoProfile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-600">
                  {t('profile.social_linkedin')}
                </a>
              )}
              {ngoProfile.socialMedia.youtube && (
                <a href={ngoProfile.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500">
                  {t('profile.social_youtube')}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const NGOProfileEditForm = ({ ngoProfile, onSave, onCancel }: {
    ngoProfile: any
    onSave: (profile: any) => void
    onCancel: () => void
  }) => {
    const [formData, setFormData] = useState({
      organizationName: ngoProfile?.organizationName || '',
      description: ngoProfile?.description || '',
      website: ngoProfile?.website || '',
      contactPhone: ngoProfile?.contactPhone || '',
      address: ngoProfile?.address || '',
      registrationNumber: ngoProfile?.registrationNumber || '',
      focusAreas: ngoProfile?.focusAreas || [],
      socialMedia: ngoProfile?.socialMedia || {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        website: ''
      }
    })
    const [saving, setSaving] = useState(false)

    const focusAreaOptions = [
      { key: 'humanRights', label: t('dashboard.focusAreaOptions.humanRights') },
      { key: 'womenRights', label: t('dashboard.focusAreaOptions.womenRights') },
      { key: 'childrenRights', label: t('dashboard.focusAreaOptions.childrenRights') },
      { key: 'education', label: t('dashboard.focusAreaOptions.education') },
      { key: 'healthcare', label: t('dashboard.focusAreaOptions.healthcare') },
      { key: 'environment', label: t('dashboard.focusAreaOptions.environment') },
      { key: 'povertyAlleviation', label: t('dashboard.focusAreaOptions.povertyAlleviation') },
      { key: 'legalAid', label: t('dashboard.focusAreaOptions.legalAid') },
      { key: 'communityDevelopment', label: t('dashboard.focusAreaOptions.communityDevelopment') },
      { key: 'youthDevelopment', label: t('dashboard.focusAreaOptions.youthDevelopment') },
      { key: 'elderlyCare', label: t('dashboard.focusAreaOptions.elderlyCare') },
      { key: 'disabilityRights', label: t('dashboard.focusAreaOptions.disabilityRights') }
    ]

    const handleFocusAreaChange = (area: string, checked: boolean) => {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          focusAreas: [...prev.focusAreas, area]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          focusAreas: prev.focusAreas.filter((a: string) => a !== area)
        }))
      }
    }

    const handleSave = async () => {
      try {
        setSaving(true)
        const response = await fetch('/api/profile/ngo', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const updatedProfile = await response.json()
          onSave(updatedProfile.ngoProfile)
        } else {
          alert(t('dashboard.profile.failedToUpdate'))
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        alert(t('dashboard.profile.errorUpdating'))
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={`${t('dashboard.profile.organizationName')} ${t('dashboard.profile.required')}`}
              type="text"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: (e.target as HTMLInputElement).value }))}
              required
            />
          </div>
          <div>
            <Input
              label={t('dashboard.profile.contactPhone')}
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: (e.target as HTMLInputElement).value }))}
            />
          </div>
        </div>

        <div>
          <TextArea
            label={`${t('dashboard.profile.description')} ${t('dashboard.profile.required')}`}
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: (e.target as HTMLTextAreaElement).value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={t('dashboard.profile.website')}
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: (e.target as HTMLInputElement).value }))}
              placeholder={t('auth.websitePlaceholder')}
            />
          </div>
          <div>
            <Input
              label={t('dashboard.profile.registrationNumber')}
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: (e.target as HTMLInputElement).value }))}
            />
          </div>
        </div>

        <div>
          <TextArea
            label={t('dashboard.profile.address')}
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: (e.target as HTMLTextAreaElement).value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard.profile.focusAreas')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {focusAreaOptions.map((area) => (
              <label key={area.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.focusAreas.includes(area.label)}
                  onChange={(e) => handleFocusAreaChange(area.label, e.target.checked)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{area.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Social Media Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.profile.socialMediaAccounts')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('profile.social_facebook')}
                type="url"
                value={formData.socialMedia?.facebook || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, facebook: (e.target as HTMLInputElement).value }
                }))}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <Input
                label={t('profile.social_twitter')}
                type="url"
                value={formData.socialMedia?.twitter || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, twitter: (e.target as HTMLInputElement).value }
                }))}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div>
              <Input
                label={t('profile.social_instagram')}
                type="url"
                value={formData.socialMedia?.instagram || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, instagram: (e.target as HTMLInputElement).value }
                }))}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <Input
                label={t('profile.social_linkedin')}
                type="url"
                value={formData.socialMedia?.linkedin || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, linkedin: (e.target as HTMLInputElement).value }
                }))}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            <div>
              <Input
                label={t('profile.social_youtube')}
                type="url"
                value={formData.socialMedia?.youtube || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, youtube: (e.target as HTMLInputElement).value }
                }))}
                placeholder="https://youtube.com/channel/yourchannel"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={saving}
          >
            {t('dashboard.profile.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.organizationName || !formData.description}
            variant="primary"
          >
            {saving ? t('dashboard.profile.saving') : t('dashboard.profile.saveChanges')}
          </Button>
        </div>
      </div>
    )
  }

  const DashboardCard = ({ title, items, type, icon: Icon, createPath }: {
    title: string
    items: DashboardItem[]
    type: 'event' | 'training' | 'vacancy'
    icon: any
    createPath: string
  }) => (
    <div className="group relative bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all duration-500 rounded-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{items.length} {t('dashboard.cards.total')}</p>
            </div>
          </div>
          <Link href={createPath}>
            <Button variant="primary" size="sm" className="group/btn">
              <Plus className="h-4 w-4 mr-1 group-hover/btn:rotate-90 transition-transform" />
              {t('dashboard.cards.create')}
            </Button>
          </Link>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 mb-4">{t('dashboard.cards.noItems', { type: title.toLowerCase() })}</p>
            <Link href={createPath}>
              <Button variant="outline" size="sm">
                {t('dashboard.cards.createFirst', { type })}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item, idx) => {
            
            return (
            <div 
              key={item._id} 
              className="group/item flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 truncate group-hover/item:text-blue-600 transition-colors">{item.title}</h3>
                  <StatusBadge 
                    status={item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending'} 
                    size="sm"
                  />
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleDateString(language || undefined)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/resources/${type}s/${item._id}`}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title={t('dashboard.cards.view')}
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/${type}s/${item._id}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                  title={t('dashboard.cards.edit')}
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(item._id, type)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title={t('dashboard.cards.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            )
            })}
            {items.length > 5 && (
              <div className="text-center pt-4">
                <Link
                  href={`/dashboard/${type}s`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm group/link"
                >
                  <span>{t('dashboard.cards.viewAll', { count: items.length, type: title.toLowerCase() })}</span>
                  <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Engaging Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white">
        {/* Animated Background */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-pink-500',
            blob2: 'bg-blue-400',
            blob3: 'bg-purple-500'
          }}
        />

        <Container size="xl" padding="lg" className="relative z-10 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">{t('dashboard.welcome')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2 sm:mb-3">
                {t('dashboard.welcomeBack', { name: session.user?.name || ngoProfile?.organizationName || '' })}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-blue-100 max-w-2xl">
                {t('dashboard.subtitle')}
              </p>
            </div>

            {/* Quick Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-3 animate-fade-in animation-delay-200">
              <Link href={localePath("/dashboard/events/create")}>
                <Button variant="secondary" size="lg" className="group">
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                  {t('dashboard.quickActions.createEvent')}
                </Button>
              </Link>
              <Link href={localePath("/dashboard/vacancies/create")}>
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('dashboard.quickActions.createVacancy')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Approval Status Banner */}
          {!session.user?.isApprovedNGO && (
            <div className="mt-6 rounded-xl border-2 border-yellow-300 bg-yellow-50/90 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-yellow-900 animate-fade-in animation-delay-400">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">{t('dashboard.pendingApproval')}</strong>
                  <p className="mt-1">{t('dashboard.ngoNotApproved') || 'Your NGO registration is pending approval. Some actions may be restricted.'}</p>
                </div>
              </div>
            </div>
          )}
        </Container>

        
        
      </div>

      <Container size="xl" padding="lg" className="-mt-8 sm:-mt-12 relative z-10">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {[
            {
              icon: Calendar,
              title: t('dashboard.stats.totalEvents'),
              value: events.length,
              color: 'blue',
              trend: '+12%',
              bgGradient: 'from-blue-500 to-blue-700'
            },
            {
              icon: Briefcase,
              title: t('dashboard.stats.totalVacancies'),
              value: vacancies.length,
              color: 'purple',
              trend: '+8%',
              bgGradient: 'from-purple-500 to-purple-700'
            },
            {
              icon: CheckCircle,
              title: t('dashboard.stats.approved'),
              value: [...events, ...vacancies].filter(item => item.status === 'approved').length,
              color: 'green',
              trend: '',
              bgGradient: 'from-green-500 to-green-700'
            },
            {
              icon: Clock,
              title: t('dashboard.stats.pending'),
              value: [...events, ...vacancies].filter(item => item.status === 'pending').length,
              color: 'yellow',
              trend: '',
              bgGradient: 'from-yellow-500 to-yellow-700'
            }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group relative bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all duration-500 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  {stat.trend && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Management Section */}
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.profile.title')}</h2>
            </div>
            <Button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              variant="primary"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-1" />
              {showProfileEdit ? t('dashboard.profile.cancel') : t('dashboard.profile.editProfile')}
            </Button>
          </CardHeader>
          <CardContent>
            {showProfileEdit ? (
              <NGOProfileEditForm 
                ngoProfile={ngoProfile} 
                onSave={(updatedProfile) => {
                  setNgoProfile(updatedProfile)
                  setShowProfileEdit(false)
                }}
                onCancel={() => setShowProfileEdit(false)}
              />
            ) : (
              <NGOProfileDisplay ngoProfile={ngoProfile} />
            )}
          </CardContent>
        </Card>

        {/* Management Tabs */}
        <Tabs
          tabs={[
            {
              id: 'overview',
              label: t('dashboard.tabs.overview'),
              icon: BarChart3,
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DashboardCard
                    title={t('dashboard.cards.events')}
                    items={events}
                    type="event"
                    icon={Calendar}
                    createPath="/dashboard/events/create"
                  />
                  <DashboardCard
                    title={t('dashboard.cards.vacancies')}
                    items={vacancies}
                    type="vacancy"
                    icon={Briefcase}
                    createPath="/dashboard/vacancies/create"
                  />
                </div>
              )
            },
            {
              id: 'events',
              label: t('dashboard.tabs.eventManagement'),
              icon: Calendar,
              badge: events.length,
              content: <EventManagement />
            },
            {
              id: 'vacancies',
              label: t('dashboard.tabs.vacancyManagement'),
              icon: Briefcase,
              badge: vacancies.length,
              content: <VacancyManagement />
            }
          ]}
          defaultTab="overview"
          variant="default"
          size="md"
          className="bg-white rounded-2xl shadow-md"
          tabsClassName="px-6 pt-6"
          contentClassName="p-6"
        />
      </Container>
    </div>
  )
}