'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Plus, Search, Filter, Calendar, MapPin, Users, Edit, Trash2, Eye } from 'lucide-react'

interface Vacancy {
  _id: string
  title: string
  type: 'job' | 'volunteer' | 'internship'
  description: string
  location: {
    type: 'remote' | 'onsite' | 'hybrid'
    city?: string
    country?: string
  }
  applicationDeadline?: string
  requirements: string[]
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  creator: {
    name: string
    organization?: string
  }
}

export default function VacanciesDashboard() {
  const { data: session } = useSession()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchVacancies()
  }, [])

  const fetchVacancies = async () => {
    try {
      const response = await fetch('/api/vacancies')
      if (response.ok) {
        const data = await response.json()
        setVacancies(data)
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vacancy?')) return

    try {
      const response = await fetch(`/api/vacancies/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setVacancies(vacancies.filter(vacancy => vacancy._id !== id))
      } else {
        alert('Failed to delete vacancy')
      }
    } catch (error) {
      console.error('Error deleting vacancy:', error)
      alert('Failed to delete vacancy')
    }
  }

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || vacancy.type === filterType
    const matchesStatus = filterStatus === 'all' || vacancy.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-blue-100 text-blue-800'
      case 'volunteer': return 'bg-green-100 text-green-800'
      case 'internship': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vacancies...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Vacancy Management</h1>
              <p className="mt-2 text-gray-600">Manage your job postings, volunteer opportunities, and internships</p>
            </div>
            <Link
              href="/dashboard/vacancies/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Vacancy
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search vacancies..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="job">Jobs</option>
                <option value="volunteer">Volunteer</option>
                <option value="internship">Internships</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Vacancies</dt>
                    <dd className="text-lg font-medium text-gray-900">{vacancies.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vacancies.filter(v => v.status === 'approved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vacancies.filter(v => v.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Jobs</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vacancies.filter(v => v.type === 'job').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vacancies List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredVacancies.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vacancies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first vacancy.'}
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/vacancies/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Vacancy
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredVacancies.map((vacancy) => (
                <li key={vacancy._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {vacancy.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(vacancy.type)}`}>
                            {vacancy.type}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vacancy.status)}`}>
                            {vacancy.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {vacancy.location.type === 'remote' ? 'Remote' : 
                             `${vacancy.location.city || ''} ${vacancy.location.country || ''}`.trim() || 'Location TBD'}
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Created: {formatDate(vacancy.createdAt)}
                          </div>
                          
                          {vacancy.applicationDeadline && (
                            <div className="flex items-center">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              Deadline: {formatDate(vacancy.applicationDeadline)}
                            </div>
                          )}
                        </div>
                        
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {vacancy.description}
                        </p>
                        
                        {vacancy.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {vacancy.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                            {vacancy.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                +{vacancy.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/vacancies/${vacancy._id}`}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <Link
                          href={`/dashboard/vacancies/${vacancy._id}/edit`}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(vacancy._id)}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}