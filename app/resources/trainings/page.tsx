'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, Clock, Users, ExternalLink, MapPin, BookOpen, Award, Filter, Search } from 'lucide-react'

interface Training {
  _id: string
  title: string
  description: string
  category: string
  trainingType: 'online' | 'in-person' | 'hybrid'
  startDate: string
  endDate: string
  duration: string
  schedule: string
  location?: string
  applicationLink: string
  applicationDeadline: string
  learningOutcomes: string[]
  prerequisites?: string[]
  certification?: string
  cost?: string
  targetAudience?: string
  tags?: string[]
  createdBy: {
    _id: string
    name: string
    organizationName?: string
  }
  createdAt: string
}

interface TrainingFilters {
  category: string
  type: string
  search: string
}

export default function TrainingsPage() {
  const { data: session } = useSession()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TrainingFilters>({
    category: 'all',
    type: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTrainings, setTotalTrainings] = useState(0)

  const categories = [
    'all',
    'Gender-Based Violence',
    'Human Rights',
    'Legal Aid',
    'Advocacy',
    'Community Development',
    'Mental Health',
    'Research',
    'Capacity Building',
    'Other'
  ]

  const trainingTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'online', label: 'Online' },
    { value: 'in-person', label: 'In-Person' },
    { value: 'hybrid', label: 'Hybrid' }
  ]

  const loadTrainings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        status: 'approved'
      })

      if (filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters.type !== 'all') {
        params.append('trainingType', filters.type)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/trainings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.trainings || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalTrainings(data.pagination?.totalTrainings || 0)
      }
    } catch (error) {
      console.error('Error loading trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrainings()
  }, [currentPage, filters])

  const handleFilterChange = (key: keyof TrainingFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Training Programs</h1>
            <p className="mt-4 text-lg text-gray-600">
              Enhance your skills and knowledge with professional training programs from verified NGOs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search trainings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              >
                {trainingTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {totalTrainings} training{totalTrainings !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Training Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No trainings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later for new training programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <div key={training._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {training.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {training.createdBy.organizationName || training.createdBy.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      training.trainingType === 'online' ? 'bg-blue-100 text-blue-800' :
                      training.trainingType === 'in-person' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {training.trainingType}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {training.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(training.startDate)} - {formatDate(training.endDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {training.duration}
                    </div>
                    {training.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {training.location}
                      </div>
                    )}
                    {training.certification && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2" />
                        Certificate provided
                      </div>
                    )}
                  </div>

                  {/* Application Deadline */}
                  <div className={`text-sm mb-4 ${
                    isDeadlinePassed(training.applicationDeadline) 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    Application deadline: {formatDate(training.applicationDeadline)}
                    {isDeadlinePassed(training.applicationDeadline) && (
                      <span className="ml-2 text-red-600 font-medium">(Closed)</span>
                    )}
                  </div>

                  {/* Tags */}
                  {training.tags && training.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {training.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {training.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{training.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Apply Button */}
                  <div className="pt-4 border-t border-gray-200">
                    {isDeadlinePassed(training.applicationDeadline) ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
                      >
                        Application Closed
                      </button>
                    ) : (
                      <a
                        href={training.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        Apply Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1
                if (page === currentPage || page === 1 || page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md ${
                        page === currentPage
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-500">...</span>
                }
                return null
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}