'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, MapPin, Users, Link as LinkIcon, Clock, Tag, Image as ImageIcon } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'

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

export default function CreateEvent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventType: 'event' as 'event' | 'training' | 'workshop' | 'seminar',
    eventDate: '',
    endDate: '',
    location: {
      type: 'physical' as 'online' | 'physical' | 'hybrid',
      address: '',
      city: '',
      country: '',
      onlineLink: ''
    },
    applicationLink: '',
    applicationDeadline: '',
    maxParticipants: '',
    tags: '',
    imageUrl: '',
    // Training-specific fields
    duration: {
      value: '',
      unit: 'hours' as 'hours' | 'days' | 'weeks'
    },
    schedule: '',
    prerequisites: [] as string[],
    learningOutcomes: [] as string[],
    targetAudience: '',
    syllabus: '',
    certification: {
      provided: false,
      type: '',
      accreditedBy: ''
    },
    cost: {
      isFree: false,
      amount: '',
      currency: 'USD',
      scholarshipAvailable: false
    }
  })

  // Handle URL parameters for event type
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['training', 'workshop', 'seminar'].includes(typeParam)) {
      setFormData(prev => ({
        ...prev,
        eventType: typeParam as 'training' | 'workshop' | 'seminar'
      }))
    }
  }, [searchParams])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        eventDate: new Date(formData.eventDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : undefined
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard/events?created=true')
      } else {
        alert('Error creating event: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }))
    } else if (name.startsWith('duration.')) {
      const durationField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        duration: {
          ...prev.duration,
          [durationField]: value
        }
      }))
    } else if (name.startsWith('certification.')) {
      const certField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        certification: {
          ...prev.certification,
          [certField]: type === 'checkbox' ? checked : value
        }
      }))
    } else if (name.startsWith('cost.')) {
      const costField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost,
          [costField]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleArrayInputChange = (field: 'prerequisites' | 'learningOutcomes', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({
      ...prev,
      [field]: items
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-gray-600">Submit your event for admin review and approval</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <Select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'event', label: 'Event' },
                    { value: 'training', label: 'Training' },
                    { value: 'workshop', label: 'Workshop' },
                    { value: 'seminar', label: 'Seminar' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: '', label: 'Select category' },
                    ...eventCategories.map(category => ({
                      value: category,
                      label: category
                    }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants
                </label>
                <Input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder="Describe your event"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas (e.g., human rights, workshop, youth)"
                />
              </div>
            </div>
          </div>

          {/* Training-specific fields */}
          {(formData.eventType === 'training' || formData.eventType === 'workshop' || formData.eventType === 'seminar') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="duration.value"
                      value={formData.duration.value}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="flex-1"
                      placeholder="Duration"
                    />
                    <Select
                       name="duration.unit"
                       value={formData.duration.unit}
                       onChange={handleInputChange}
                       options={[
                         { value: 'hours', label: 'Hours' },
                         { value: 'days', label: 'Days' },
                         { value: 'weeks', label: 'Weeks' }
                       ]}
                     />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <Input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., NGO staff, volunteers, students"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <TextArea
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe the training schedule (e.g., Day 1: Introduction, Day 2: Practical exercises)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prerequisites
                  </label>
                  <Input
                    type="text"
                    value={formData.prerequisites.join(', ')}
                    onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
                    placeholder="Enter prerequisites separated by commas (e.g., Basic computer skills, Previous NGO experience)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Outcomes
                  </label>
                  <Input
                    type="text"
                    value={formData.learningOutcomes.join(', ')}
                    onChange={(e) => handleArrayInputChange('learningOutcomes', e.target.value)}
                    placeholder="Enter learning outcomes separated by commas (e.g., Understand fundraising basics, Create grant proposals)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Syllabus
                  </label>
                  <TextArea
                    name="syllabus"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Detailed syllabus or curriculum outline"
                  />
                </div>
                
                {/* Cost Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="cost.isFree"
                        checked={formData.cost.isFree}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        This training is free
                      </label>
                    </div>
                    
                    {!formData.cost.isFree && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          name="cost.amount"
                          value={formData.cost.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="flex-1"
                          placeholder="Amount"
                        />
                        <Select
                          name="cost.currency"
                          value={formData.cost.currency}
                          onChange={handleInputChange}
                          options={[
                            { value: 'USD', label: 'USD' },
                            { value: 'EUR', label: 'EUR' },
                            { value: 'GBP', label: 'GBP' },
                            { value: 'CAD', label: 'CAD' }
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Certification */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Certification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="certification.provided"
                        checked={formData.certification.provided}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Certificate will be provided
                      </label>
                    </div>
                    
                    {formData.certification.provided && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Certificate Type
                          </label>
                          <Input
                            type="text"
                            name="certification.type"
                            value={formData.certification.type}
                            onChange={handleInputChange}
                            placeholder="e.g., Certificate of Completion, Professional Certificate"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accredited By
                          </label>
                          <Input
                            type="text"
                            name="certification.accreditedBy"
                            value={formData.certification.accreditedBy}
                            onChange={handleInputChange}
                            placeholder="Accrediting organization (optional)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date & Time
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <Input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline (with time)
                </label>
                <Input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type *
                </label>
                <Select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: 'physical', label: 'Physical Location' },
                    { value: 'online', label: 'Online Event' },
                    { value: 'hybrid', label: 'Hybrid (Physical + Online)' }
                  ]}
                />
              </div>
              
              {(formData.location.type === 'physical' || formData.location.type === 'hybrid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <Input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <Input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <Input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                    />
                  </div>
                </div>
              )}
              
              {(formData.location.type === 'online' || formData.location.type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Online Meeting Link
                  </label>
                  <Input
                    type="url"
                    name="location.onlineLink"
                    value={formData.location.onlineLink}
                    onChange={handleInputChange}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application/Registration Link
                </label>
                <Input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image URL
                </label>
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}