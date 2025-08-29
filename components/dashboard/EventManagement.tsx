'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  endDate?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  category: string
  eventType: string
  maxParticipants?: number
  applicationDeadline?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    name: string
    organizationName?: string
  }
}

const eventCategories = [
  'Workshop',
  'Conference',
  'Seminar',
  'Art Performance',
  'Cultural Event',
  'Fundraising',
  'Community Gathering',
  'Awareness Campaign',
  'Protest/Rally',
  'Educational Event',
  'Networking',
  'Celebration',
  'Other'
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
]

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  ...eventCategories.map(cat => ({ value: cat, label: cat }))
]

export default function EventManagement() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events?author=me`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (event: Event) => {
    setEventToDelete(event)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/events/${eventToDelete._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEvents(events.filter(e => e._id !== eventToDelete._id))
        setDeleteModalOpen(false)
        setEventToDelete(null)
      } else {
        console.error('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusIcon = (event: Event) => {
    if (event.status === 'approved' && event.isPublished) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (event.status === 'rejected') {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (event: Event) => {
    if (event.status === 'approved' && event.isPublished) {
      return <Badge variant="success">Approved</Badge>
    } else if (event.status === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>
    } else {
      return <Badge variant="warning">Pending</Badge>
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'approved') {
      matchesStatus = event.status === 'approved' && event.isPublished
    } else if (statusFilter === 'pending') {
      matchesStatus = event.status === 'pending' || (event.status === 'approved' && !event.isPublished)
    } else if (statusFilter === 'rejected') {
      matchesStatus = event.status === 'rejected'
    }
    
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
          <p className="text-gray-600">Manage your organization's events</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button
            variant="primary"
            icon={Plus}
          >
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filter by status"
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Filter by category"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                {events.length === 0 
                  ? "You haven't created any events yet." 
                  : "No events match your current filters."}
              </p>
              {events.length === 0 && (
                <Link href="/dashboard/events/create">
                  <Button
                    variant="primary"
                    icon={Plus}
                  >
                    Create Your First Event
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card key={event._id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      {getStatusIcon(event)}
                      {getStatusBadge(event)}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {event.location.type === 'online' ? 'Online' : 
                           event.location.type === 'hybrid' ? 'Hybrid' :
                           `${event.location.city || ''} ${event.location.country || ''}`.trim() || 'Physical'}
                        </span>
                      </div>
                      {event.maxParticipants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Max {event.maxParticipants}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">{event.category}</Badge>
                      {event.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                      {event.tags.length > 2 && (
                        <Badge variant="secondary">+{event.tags.length - 2} more</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/resources/events/${event._id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        title="View Event"
                      />
                    </Link>
                    <Link href={`/dashboard/events/${event._id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        title="Edit Event"
                      />
                    </Link>
                    <Button
                      onClick={() => handleDelete(event)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      title="Delete Event"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleting}
            >
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}