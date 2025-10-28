'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/Textarea'
import { Building2, Edit, Save, X, Phone, Mail, Globe, MapPin, FileText, Users, Calendar, Settings, Plus, Trash2, Eye } from 'lucide-react'

interface NGOProfile {
  _id: string
  organizationName: string
  email: string
  description: string
  website?: string
  contactPhone?: string
  address?: string
  registrationNumber?: string
  focusAreas: string[]
  status: 'pending' | 'approved' | 'rejected'
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
}

export default function NGODashboard() {
  const router = useRouter()
  const [ngoProfile, setNgoProfile] = useState<NGOProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [events, setEvents] = useState([])
  const [vacancies, setVacancies] = useState([])

  useEffect(() => {
    fetchNGOProfile()
  }, [])

  const fetchNGOProfile = async () => {
    try {
      const response = await fetch('/api/ngo/profile')
      if (response.ok) {
        const data = await response.json()
        setNgoProfile(data.ngo)
      } else if (response.status === 401) {
        router.push('/auth/ngo-login')
      } else {
        setError('Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching NGO profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/ngo-logout', { method: 'POST' })
      router.push('/auth/ngo-login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-600 mb-4">{error}</p>
          <Button onClick={fetchNGOProfile}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!ngoProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{ngoProfile.organizationName}</h1>
                <p className="text-sm text-gray-500">NGO Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ngoProfile.status === 'approved' ? 'bg-green-100 text-green-800' :
                  ngoProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {ngoProfile.status.charAt(0).toUpperCase() + ngoProfile.status.slice(1)}
                </span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Status Alert */}
        {ngoProfile.status === 'pending' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Registration Pending
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your NGO registration is currently under review. You'll receive an email notification once it's approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {ngoProfile.status === 'rejected' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Registration Rejected
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your NGO registration has been rejected. Please contact support for more information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Organization Profile</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                disabled={ngoProfile.status !== 'approved'}
              >
                {editing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <p className="text-gray-900">{ngoProfile.organizationName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{ngoProfile.email}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-gray-900">{ngoProfile.description}</p>
              </div>
              
              {ngoProfile.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <a href={ngoProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                    {ngoProfile.website}
                  </a>
                </div>
              )}
              
              {ngoProfile.contactPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <p className="text-gray-900">{ngoProfile.contactPhone}</p>
                </div>
              )}
              
              {ngoProfile.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <p className="text-gray-900">{ngoProfile.address}</p>
                </div>
              )}
              
              {ngoProfile.focusAreas.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Areas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ngoProfile.focusAreas.map((area, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Person Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Contact Person</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <p className="text-gray-900">{ngoProfile.contactPerson.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{ngoProfile.contactPerson.email}</p>
              </div>
              
              {ngoProfile.contactPerson.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <p className="text-gray-900">{ngoProfile.contactPerson.phone}</p>
                </div>
              )}
              
              {ngoProfile.contactPerson.position && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <p className="text-gray-900">{ngoProfile.contactPerson.position}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Events</h3>
                <p className="text-sm text-gray-500">Create and manage your events</p>
              </div>
            </div>
            <Button className="mt-4 w-full" disabled={ngoProfile.status !== 'approved'}>
              View Events
            </Button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Vacancies</h3>
                <p className="text-sm text-gray-500">Post and manage job openings</p>
              </div>
            </div>
            <Button className="mt-4 w-full" disabled={ngoProfile.status !== 'approved'}>
              View Vacancies
            </Button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Resources</h3>
                <p className="text-sm text-gray-500">Access helpful resources</p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline">
              Browse Resources
            </Button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-500">Manage your account settings</p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline">
              Account Settings
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              {ngoProfile?.status === 'approved' && (
                <>
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'events'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => setActiveTab('vacancies')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'vacancies'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Vacancies
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'events' && ngoProfile?.status === 'approved' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Event Management</h2>
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                  <p className="text-gray-500 mb-4">Create your first event to start engaging with volunteers.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {events.map((event: any, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {event.date}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vacancies' && ngoProfile?.status === 'approved' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Vacancy Management</h2>
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Post Vacancy
              </Button>
            </div>
            
            <div className="space-y-4">
              {vacancies.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No vacancies posted</h3>
                  <p className="text-gray-500 mb-4">Post your first job vacancy to find qualified candidates.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Vacancy
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {vacancies.map((vacancy: any, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{vacancy.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{vacancy.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {vacancy.applicants || 0} applicants
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}