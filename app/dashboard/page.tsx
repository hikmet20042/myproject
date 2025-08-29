'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Briefcase, BookOpen, Plus, Eye, Edit, Trash2, Settings, User, BarChart3 } from 'lucide-react'
import { IEvent } from '@/lib/models/Event'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import EventManagement from '@/components/dashboard/EventManagement'
import VacancyManagement from '@/components/dashboard/VacancyManagement'

interface DashboardItem {
  _id: string
  title: string
  createdAt: string
  status?: string
  type: 'event' | 'training' | 'vacancy'
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<DashboardItem[]>([])
  const [vacancies, setVacancies] = useState<DashboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ngoProfile, setNgoProfile] = useState<any>(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user?.role !== 'ngo') {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
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

      // Fetch NGO profile
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setNgoProfile(profileData.user?.ngoProfile || null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, type: 'event' | 'training' | 'vacancy') => {
    if (!confirm('Are you sure you want to delete this item?')) return

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
        alert('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Check if user has access - only NGO role allowed
  if (session?.user?.role !== 'ngo') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be an approved NGO to access this page.</p>
        </div>
      </div>
    )
  }

  // Note: NGO dashboard is accessible only by the person who registered the NGO
  // This is automatically ensured since each NGO account is tied to one user

  const NGOProfileDisplay = ({ ngoProfile }: { ngoProfile: any }) => {
    if (!ngoProfile) {
      return (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p>No profile information available</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Organization Name</h3>
          <p className="text-gray-600">{ngoProfile.organizationName || 'Not specified'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Contact Phone</h3>
          <p className="text-gray-600">{ngoProfile.contactPhone || 'Not specified'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600">{ngoProfile.description || 'Not specified'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Website</h3>
          <p className="text-gray-600">{ngoProfile.website || 'Not specified'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Registration Number</h3>
          <p className="text-gray-600">{ngoProfile.registrationNumber || 'Not specified'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">Address</h3>
          <p className="text-gray-600">{ngoProfile.address || 'Not specified'}</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-900 mb-2">Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {ngoProfile.focusAreas?.length > 0 ? (
              ngoProfile.focusAreas.map((area: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {area}
                </span>
              ))
            ) : (
              <span className="text-gray-600">No focus areas specified</span>
            )}
          </div>
        </div>
        {ngoProfile.socialMedia && Object.values(ngoProfile.socialMedia).some((link: any) => link) && (
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900 mb-2">Social Media</h3>
            <div className="flex flex-wrap gap-3">
              {ngoProfile.socialMedia.facebook && (
                <a href={ngoProfile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                  Facebook
                </a>
              )}
              {ngoProfile.socialMedia.twitter && (
                <a href={ngoProfile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Twitter
                </a>
              )}
              {ngoProfile.socialMedia.instagram && (
                <a href={ngoProfile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-500">
                  Instagram
                </a>
              )}
              {ngoProfile.socialMedia.linkedin && (
                <a href={ngoProfile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-600">
                  LinkedIn
                </a>
              )}
              {ngoProfile.socialMedia.youtube && (
                <a href={ngoProfile.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500">
                  YouTube
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
      'Human Rights', 'Women Rights', 'Children Rights', 'Education', 'Healthcare',
      'Environment', 'Poverty Alleviation', 'Legal Aid', 'Community Development',
      'Youth Development', 'Elderly Care', 'Disability Rights'
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
          alert('Failed to update profile')
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        alert('Error updating profile')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Areas
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {focusAreaOptions.map((area) => (
              <label key={area} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.focusAreas.includes(area)}
                  onChange={(e) => handleFocusAreaChange(area, e.target.checked)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{area}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Social Media Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={formData.socialMedia?.facebook || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="url"
                value={formData.socialMedia?.twitter || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={formData.socialMedia?.instagram || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                value={formData.socialMedia?.linkedin || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube
              </label>
              <input
                type="url"
                value={formData.socialMedia?.youtube || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.organizationName || !formData.description}
            variant="primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Icon className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <Link
          href={createPath}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create
        </Link>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Icon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p>No {title.toLowerCase()} created yet</p>
          <Link
            href={createPath}
            className="mt-2 inline-flex items-center text-red-600 hover:text-red-700"
          >
            Create your first {type}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 5).map((item) => {
            const getStatusBadge = (status: string) => {
              switch (status) {
                case 'approved':
                  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
                case 'rejected':
                  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>
                default:
                  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
              }
            }
            
            return (
            <div key={item._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                  {getStatusBadge(item.status || 'pending')}
                </div>
                <p className="text-sm text-gray-500">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/resources/${type}s/${item._id}`}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/${type}s/${item._id}/edit`}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <Button
                  onClick={() => handleDelete(item._id, type)}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )
          })}
          {items.length > 5 && (
            <div className="text-center pt-2">
              <Link
                href={`/dashboard/${type}s`}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                View all {items.length} {title.toLowerCase()}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session.user?.name}!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vacancies</p>
                <p className="text-2xl font-bold text-gray-900">{vacancies.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Organization Profile</h2>
            </div>
            <Button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              variant="primary"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-1" />
              {showProfileEdit ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
          
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
        </div>

        {/* Management Tabs */}
        <Tabs
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              icon: BarChart3,
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DashboardCard
                    title="Events"
                    items={events}
                    type="event"
                    icon={Calendar}
                    createPath="/dashboard/events/create"
                  />
                  <DashboardCard
                    title="Vacancies"
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
              label: 'Event Management',
              icon: Calendar,
              badge: events.length,
              content: <EventManagement />
            },
            {
              id: 'vacancies',
              label: 'Vacancy Management',
              icon: Briefcase,
              badge: vacancies.length,
              content: <VacancyManagement />
            }
          ]}
          defaultTab="overview"
          variant="default"
          size="md"
          className="bg-white rounded-lg shadow-md"
          tabsClassName="px-6 pt-6"
          contentClassName="p-6"
        />
      </div>
    </div>
  )
}