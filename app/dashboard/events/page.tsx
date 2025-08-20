'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Event {
  _id: string
  title: string
  description: string
  category: string
  eventDate: string
  endDate?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  isApproved: boolean
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export default function EventsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'ngo') {
      router.push('/dashboard')
      return
    }
    loadEvents()
  }, [session, status, filter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        createdBy: session?.user?.id || '',
        status: filter,
        limit: '50'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/events?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setEvents(data.events)
      } else {
        console.error('Failed to load events:', data.error)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEvents(events.filter(event => event._id !== eventId))
        setShowDeleteModal(false)
        setEventToDelete(null)
      } else {
        const data = await response.json()
        alert('Failed to delete event: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (event: Event) => {
    if (event.rejectedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      )
    }
    if (event.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending Review
      </span>
    )
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
              <p className="mt-2 text-gray-600">Create and manage your organization's events</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/events/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No events match your search criteria.' : 'You haven\'t created any events yet.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/dashboard/events/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                        {getStatusBadge(event)}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location.type === 'online' ? 'Online' : event.location.city || 'Physical'}
                        </div>
                        {event.maxParticipants && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {event.currentParticipants}/{event.maxParticipants}
                          </div>
                        )}
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.category}</span>
                      </div>
                      
                      {event.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {event.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/dashboard/events/${event._id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/events/${event._id}/edit`)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                        title="Edit Event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEventToDelete(event._id)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setEventToDelete(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => eventToDelete && handleDelete(eventToDelete)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}