'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Briefcase, MapPin, DollarSign, Clock, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle, Search, Filter, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'

interface Vacancy {
  _id: string
  title: string
  description: string
  type: 'job' | 'volunteer' | 'internship'
  category: string
  workType: 'remote' | 'onsite' | 'hybrid'
  location: {
    city?: string
    country?: string
    address?: string
    isRemote: boolean
  }
  experienceLevel: 'entry' | 'mid' | 'senior' | 'any'
  duration: {
    type: 'permanent' | 'contract' | 'temporary'
    contractLength?: {
      value: number
      unit: 'months' | 'years'
    }
  }
  compensation: {
    type: 'paid' | 'unpaid' | 'stipend'
    amount?: number
    currency?: string
    period?: 'hourly' | 'monthly' | 'yearly'
    benefits?: string[]
  }
  applicationProcess: {
    applicationLink?: string
    email?: string
    instructions: string
    requiredDocuments: string[]
  }
  applicationDeadline: string
  startDate?: string
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  skills: string[]
  languages?: string[]
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  approvedAt?: string
  approvedBy?: string
  isPublished: boolean
  isFeatured: boolean
  isUrgent: boolean
  applicationCount: number
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    name: string
    email: string
  }
}

const vacancyCategories = [
  'Program Management',
  'Communications & Media',
  'Fundraising & Development',
  'Research & Policy',
  'Education & Training',
  'Healthcare & Medical',
  'Legal & Advocacy',
  'Finance & Administration',
  'Technology & IT',
  'Human Resources',
  'Marketing & Outreach',
  'Project Coordination',
  'Field Work',
  'Volunteer Coordination',
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
  ...vacancyCategories.map(cat => ({ value: cat, label: cat }))
]

const compensationOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'stipend', label: 'Stipend' }
]

export default function VacancyManagement() {
  const { data: session } = useSession()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [compensationFilter, setCompensationFilter] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [vacancyToDelete, setVacancyToDelete] = useState<Vacancy | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchVacancies()
  }, [])

  const fetchVacancies = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vacancies?author=me`)
      if (response.ok) {
        const data = await response.json()
        setVacancies(data.vacancies || data)
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (vacancy: Vacancy) => {
    setVacancyToDelete(vacancy)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!vacancyToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/vacancies/${vacancyToDelete._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setVacancies(vacancies.filter(v => v._id !== vacancyToDelete._id))
        setDeleteModalOpen(false)
        setVacancyToDelete(null)
      } else {
        console.error('Failed to delete vacancy')
      }
    } catch (error) {
      console.error('Error deleting vacancy:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      default:
        return <Badge variant="warning">Pending</Badge>
    }
  }

  const getCompensationBadge = (type: string, amount?: string) => {
    switch (type) {
      case 'paid':
        return <Badge variant="success">{amount ? `$${amount}` : 'Paid'}</Badge>
      case 'stipend':
        return <Badge variant="secondary">{amount ? `$${amount} stipend` : 'Stipend'}</Badge>
      default:
        return <Badge variant="secondary">Unpaid</Badge>
    }
  }

  const getLocationBadge = (locationType: string) => {
    switch (locationType) {
      case 'remote':
        return <Badge variant="primary">Remote</Badge>
      case 'hybrid':
        return <Badge variant="secondary">Hybrid</Badge>
      default:
        return <Badge variant="secondary">On-site</Badge>
    }
  }

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Determine status based on approval fields
    const status = vacancy.status || 'pending'
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    
    const matchesCategory = categoryFilter === 'all' || vacancy.category === categoryFilter
    const matchesCompensation = compensationFilter === 'all' || vacancy.compensation.type === compensationFilter
    
    return matchesSearch && matchesStatus && matchesCategory && matchesCompensation
  })

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vacancy Management</h2>
          <p className="text-gray-600">Manage your organization's job postings</p>
        </div>
        <Link href="/dashboard/vacancies/create">
          <Button
            variant="primary"
            icon={Plus}
          >
            Create Vacancy
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vacancies..."
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
            <Select
              options={compensationOptions}
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              placeholder="Filter by compensation"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vacancies List */}
      {filteredVacancies.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vacancies found</h3>
              <p className="text-gray-600 mb-4">
                {vacancies.length === 0 
                  ? "You haven't created any vacancies yet." 
                  : "No vacancies match your current filters."}
              </p>
              {vacancies.length === 0 && (
                <Link href="/dashboard/vacancies/create">
                  <Button
                    variant="primary"
                    icon={Plus}
                  >
                    Create Your First Vacancy
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredVacancies.map((vacancy) => (
            <Card key={vacancy._id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
                      {(() => {
                        const status = vacancy.status || 'pending'
                        return getStatusIcon(status)
                      })()}
                      {(() => {
                        const status = vacancy.status || 'pending'
                        return getStatusBadge(status)
                      })()}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{vacancy.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {vacancy.location.city && vacancy.location.country 
                            ? `${vacancy.location.city}, ${vacancy.location.country}`
                            : vacancy.location.city || vacancy.location.country || 'Location TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{vacancy.duration.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{vacancy.compensation.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Deadline: {new Date(vacancy.applicationDeadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{vacancy.category}</Badge>
                      {getLocationBadge(vacancy.workType)}
                      {getCompensationBadge(vacancy.compensation.type, vacancy.compensation.amount?.toString())}
                      {vacancy.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                      {vacancy.tags.length > 2 && (
                        <Badge variant="secondary">+{vacancy.tags.length - 2} more</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/resources/vacancies/${vacancy._id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        title="View Vacancy"
                      />
                    </Link>
                    <Link href={`/dashboard/vacancies/${vacancy._id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        title="Edit Vacancy"
                      />
                    </Link>
                    <Button
                      onClick={() => handleDelete(vacancy)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      title="Delete Vacancy"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
        title="Delete Vacancy"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{vacancyToDelete?.title}"? This action cannot be undone.
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
              Delete Vacancy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}