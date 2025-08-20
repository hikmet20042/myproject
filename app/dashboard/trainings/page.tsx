'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Training {
  _id: string
  title: string
  description: string
  category: string
  startDate: string
  endDate?: string
  duration: string
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
  requirements: string[]
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

export default function TrainingsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO) {
      router.push('/profile')
      return
    }

    fetchTrainings()
  }, [session, status, router])

  const fetchTrainings = async () => {
    try {
      const response = await fetch(`/api/trainings?createdBy=${session?.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.trainings || [])
      }
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (trainingId: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTrainings(trainings.filter(t => t._id !== trainingId))
        setShowDeleteModal(false)
        setTrainingToDelete(null)
      } else {
        alert('Failed to delete training')
      }
    } catch (error) {
      console.error('Error deleting training:', error)
      alert('Failed to delete training')
    } finally {
      setDeleting(false)
    }
  }

  const filteredTrainings = trainings.filter(training => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && !training.isApproved && !training.rejectedAt) ||
      (filter === 'approved' && training.isApproved) ||
      (filter === 'rejected' && training.rejectedAt)
    
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (training: Training) => {
    if (training.rejectedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      )
    }
    if (training.isApproved) {
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
        Pending
      </span>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Training Management</h1>
              <p className="mt-2 text-gray-600">Create and manage your organization's training programs</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/trainings/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Training
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search trainings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>
        </div>

        {/* Trainings List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No trainings match your search criteria.' : 'You haven\'t created any trainings yet.'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first training program.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/trainings/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Training
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTrainings.map((training) => (
                <li key={training._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {training.title}
                        </h3>
                        {getStatusBadge(training)}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {training.description}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(training.startDate).toLocaleDateString()}
                          {training.endDate && ` - ${new Date(training.endDate).toLocaleDateString()}`}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {training.duration}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {training.location.type === 'online' ? 'Online' : training.location.city}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {training.currentParticipants}/{training.maxParticipants || '∞'}
                        </div>
                      </div>
                      {training.rejectedAt && training.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">
                            <strong>Rejection Reason:</strong> {training.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/trainings/${training._id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!training.isApproved && (
                        <button
                          onClick={() => router.push(`/dashboard/trainings/${training._id}/edit`)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTrainingToDelete(training._id)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Training</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this training? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setTrainingToDelete(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => trainingToDelete && handleDelete(trainingToDelete)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}