'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Plus, X, Briefcase, DollarSign, Clock, FileText, Send } from 'lucide-react'
import { Input,Select,Button,TextArea } from '@/components/ui'


export default function CreateVacancy() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'job' as 'job' | 'volunteer' | 'internship',
    description: '',
    category: '',
    workType: 'onsite' as 'remote' | 'onsite' | 'hybrid',
    city: '',
    country: '',
    applicationMethod: 'link' as 'link' | 'email',
    applicationLink: '',
    applicationEmail: '',
    applicationInstructions: '',
    applicationDeadline: '',
    requirements: [''],
    responsibilities: [''],
    qualifications: [''],
    benefits: [''],
    tags: [''],
    experienceLevel: '',
    compensationType: '',
    compensationAmount: '',
    durationType: '',
    contractLength: '',
    contractUnit: 'months'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (!formData.category) {
      alert('Please select a category')
      setLoading(false)
      return
    }

    if (!formData.experienceLevel) {
      alert('Please select an experience level')
      setLoading(false)
      return
    }

    // Optional validation - these fields have defaults in the API
    // if (!formData.compensationType) {
    //   alert('Please select a compensation type')
    //   setLoading(false)
    //   return
    // }

    // if (!formData.durationType) {
    //   alert('Please select a duration type')
    //   setLoading(false)
    //   return
    // }

    if (!formData.applicationDeadline) {
      alert('Please select an application deadline')
      setLoading(false)
      return
    }

    if (!formData.applicationInstructions.trim()) {
      alert('Please enter application instructions')
      setLoading(false)
      return
    }

    // Validate application method specific fields
    if (formData.applicationMethod === 'link' && !formData.applicationLink) {
      alert('Please provide an application link')
      setLoading(false)
      return
    }

    if (formData.applicationMethod === 'email' && !formData.applicationEmail) {
      alert('Please provide an application email')
      setLoading(false)
      return
    }

    try {
      const vacancyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        workType: formData.workType,
        location: {
          city: formData.city || undefined,
          country: formData.country || undefined,
          isRemote: formData.workType === 'remote'
        },
        duration: {
          type: formData.durationType || 'permanent',
          ...(formData.contractLength && {
            contractLength: {
              value: parseInt(formData.contractLength),
              unit: formData.contractUnit
            }
          })
        },
        compensation: {
          type: formData.compensationType || 'unpaid',
          ...(formData.compensationAmount && {
            amount: parseFloat(formData.compensationAmount),
            currency: 'USD',
            period: 'monthly'
          }),
          benefits: formData.benefits.filter(benefit => benefit.trim() !== '')
        },
        applicationProcess: {
          ...(formData.applicationMethod === 'link' && formData.applicationLink && {
            applicationLink: formData.applicationLink
          }),
          ...(formData.applicationMethod === 'email' && formData.applicationEmail && {
            email: formData.applicationEmail
          }),
          instructions: formData.applicationInstructions || 'Please apply through the provided method.',
          requiredDocuments: ['CV/Resume']
        },
        applicationDeadline: new Date(formData.applicationDeadline),
        experienceLevel: formData.experienceLevel || 'any',
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
        qualifications: formData.qualifications.filter(qual => qual.trim() !== ''),
        skills: formData.tags.filter(tag => tag.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '')
      }

      const response = await fetch('/api/vacancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vacancyData)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create vacancy')
      }
    } catch (error) {
      console.error('Error creating vacancy:', error)
      alert('Failed to create vacancy')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (index: number, value: string, field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (index: number, field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Vacancy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Share opportunities that make a difference. Post jobs, volunteer positions, and internships to connect with passionate individuals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-3" />
                Basic Information
              </h2>
              <p className="text-red-100 mt-2">Tell us about the position you're offering</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Position Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-lg font-semibold text-gray-800">
                  Position Title *
                </label>
                <p className="text-sm text-gray-600 mb-3">What role are you looking to fill?</p>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200"
                  placeholder="e.g., Program Manager, Volunteer Coordinator, Marketing Intern"
                />
              </div>

              {/* Type and Experience Level */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="type" className="block text-lg font-semibold text-gray-800">
                    Opportunity Type *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">What kind of opportunity is this?</p>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200"
                  >
                    <option value="job">Paid Job Position</option>
                <option value="volunteer">Volunteer Opportunity</option>
                <option value="internship">Internship Program</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="experienceLevel" className="block text-lg font-semibold text-gray-800">
                    Experience Level *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">What level of experience do you need?</p>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    required
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Choose experience level...</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (2-5 years)</option>
                <option value="senior">Senior Level (5+ years)</option>
                <option value="any">Any Level Welcome</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-lg font-semibold text-gray-800">
                  Position Description *
                </label>
                <p className="text-sm text-gray-600 mb-3">Describe the role, your organization, and what makes this opportunity special</p>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200 resize-none"
                  placeholder="Tell candidates about the role, your organization's mission, and the impact they'll make. What makes this opportunity unique?"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-lg font-semibold text-gray-800">
                  Category *
                </label>
                <p className="text-sm text-gray-600 mb-3">Which area best describes this position?</p>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Select a category...</option>
                  <option value="Program Management">Program Management</option>
                  <option value="Project Coordination">Project Coordination</option>
                <option value="Research & Analysis">Research & Analysis</option>
                <option value="Communications & Media">Communications & Media</option>
                <option value="Fundraising & Development">Fundraising & Development</option>
                <option value="Legal & Advocacy">Legal & Advocacy</option>
                <option value="Finance & Administration">Finance & Administration</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT & Technology">IT & Technology</option>
                  <option value="Field Operations">Field Operations</option>
                  <option value="Community Outreach">Community Outreach</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Social Work">Social Work</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Emergency Response">Emergency Response</option>
                  <option value="Monitoring & Evaluation">Monitoring & Evaluation</option>
                  <option value="Grant Writing">Grant Writing</option>
                  <option value="Marketing & Design">Marketing & Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Work Details Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="w-6 h-6 mr-3" />
                Location & Work Details
              </h2>
              <p className="text-red-100 mt-2">Where will this opportunity take place?</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Work Type */}
              <div className="space-y-2">
                <label htmlFor="workType" className="block text-lg font-semibold text-gray-800">
                  Work Arrangement *
                </label>
                <p className="text-sm text-gray-600 mb-3">How will the work be conducted?</p>
                <Select
                   id="workType"
                   name="workType"
                   required
                   value={formData.workType}
                   onChange={handleInputChange}
                   className="w-full px-4 py-3 text-lg"
                   placeholder="Choose work arrangement..."
                   options={[
                     { value: 'onsite', label: 'On-site (Office/Location required)' },
                     { value: 'remote', label: 'Remote (Work from anywhere)' },
                     { value: 'hybrid', label: 'Hybrid (Mix of remote and on-site)' }
                   ]}
                 />
              </div>

              {/* Location Details */}
              {(formData.workType === 'onsite' || formData.workType === 'hybrid') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-lg font-semibold text-gray-800">
                      City
                    </label>
                    <p className="text-sm text-gray-600 mb-3">Which city is this opportunity based in?</p>
                    <Input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg"
                      placeholder="e.g., New York, London, Remote"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className="block text-lg font-semibold text-gray-800">
                      Country
                    </label>
                    <p className="text-sm text-gray-600 mb-3">Which country is this opportunity in?</p>
                    <Input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg"
                      placeholder="e.g., United States, United Kingdom, Global"
                    />
                  </div>
                </div>
              )}

              {/* Compensation Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Compensation Details
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="compensationType" className="block text-lg font-semibold text-gray-800">
                      Compensation Type *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">How will participants be compensated?</p>
                    <Select
                      id="compensationType"
                      name="compensationType"
                      required
                      value={formData.compensationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 text-lg"
                      placeholder="Choose compensation type..."
                      options={[
                        { value: 'salary', label: 'Annual Salary' },
                        { value: 'hourly', label: 'Hourly Rate' },
                        { value: 'stipend', label: 'Stipend/Allowance' },
                        { value: 'volunteer', label: 'Volunteer (Unpaid)' },
                        { value: 'negotiable', label: 'Negotiable' }
                      ]}
                    />
                  </div>

                  {formData.compensationType && formData.compensationType !== 'volunteer' && (
                    <div className="space-y-2">
                      <label htmlFor="compensationAmount" className="block text-lg font-semibold text-gray-800">
                        Amount (USD)
                      </label>
                      <p className="text-sm text-gray-600 mb-3">Enter the compensation amount</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                        <Input
                          type="text"
                          id="compensationAmount"
                          name="compensationAmount"
                          value={formData.compensationAmount}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-4 text-lg"
                          placeholder="50,000 or 15/hour"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Duration & Timeline
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="durationType" className="block text-lg font-semibold text-gray-800">
                      Duration Type *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">How long will this opportunity last?</p>
                    <Select
                      id="durationType"
                      name="durationType"
                      required
                      value={formData.durationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 text-lg"
                      placeholder="Choose duration type..."
                      options={[
                        { value: 'permanent', label: 'Permanent' },
                        { value: 'fixed', label: 'Fixed Term' },
                        { value: 'project', label: 'Project-based' },
                        { value: 'temporary', label: 'Temporary' }
                       ]}
                     />
                  </div>

                  {(formData.durationType === 'fixed' || formData.durationType === 'project' || formData.durationType === 'temporary') && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="contractLength" className="block text-lg font-semibold text-gray-800">
                          Contract Length
                        </label>
                        <p className="text-sm text-gray-600 mb-3">How long is the contract?</p>
                        <Input
                          type="number"
                          id="contractLength"
                          name="contractLength"
                          value={formData.contractLength}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 text-lg"
                          placeholder="12"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contractUnit" className="block text-lg font-semibold text-gray-800">
                          Time Unit
                        </label>
                        <p className="text-sm text-gray-600 mb-3">Select the time unit</p>
                        <Select
                          id="contractUnit"
                          name="contractUnit"
                          value={formData.contractUnit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 text-lg"
                          options={[
                            { value: 'weeks', label: 'Weeks' },
                            { value: 'months', label: 'Months' },
                            { value: 'years', label: 'Years' }
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>

          {/* Application Details Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Send className="w-6 h-6 mr-3" />
                Application Details
              </h2>
              <p className="text-red-100 mt-2">How should candidates apply for this opportunity?</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Application Method */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  Application Method *
                </label>
                <p className="text-sm text-gray-600 mb-4">Choose how candidates should submit their applications</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="link"
                      checked={formData.applicationMethod === 'link'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      formData.applicationMethod === 'link'
                        ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.applicationMethod === 'link'
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.applicationMethod === 'link' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">🔗 Application Link</h3>
                          <p className="text-sm text-gray-600">Direct candidates to an external application form</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="email"
                      checked={formData.applicationMethod === 'email'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      formData.applicationMethod === 'email'
                        ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.applicationMethod === 'email'
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.applicationMethod === 'email' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">📧 Application Email</h3>
                          <p className="text-sm text-gray-600">Receive applications via email</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Application Link/Email Input */}
              {formData.applicationMethod === 'link' && (
                <div className="space-y-2">
                  <label htmlFor="applicationLink" className="block text-lg font-semibold text-gray-800">
                    Application Link *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">Provide the URL where candidates can apply</p>
                  <Input
                    type="url"
                    id="applicationLink"
                    name="applicationLink"
                    required
                    value={formData.applicationLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 text-lg"
                    placeholder="https://your-organization.com/apply"
                  />
                </div>
              )}

              {formData.applicationMethod === 'email' && (
                <div className="space-y-2">
                  <label htmlFor="applicationEmail" className="block text-lg font-semibold text-gray-800">
                    Application Email *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">Email address where applications should be sent</p>
                  <Input
                    type="email"
                    id="applicationEmail"
                    name="applicationEmail"
                    required
                    value={formData.applicationEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 text-lg"
                    placeholder="applications@your-organization.com"
                  />
                </div>
              )}

              {/* Application Deadline */}
              <div className="space-y-2">
                <label htmlFor="applicationDeadline" className="block text-lg font-semibold text-gray-800">
                  Application Deadline *
                </label>
                <p className="text-sm text-gray-600 mb-3">When should applications be submitted by?</p>
                <Input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  required
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Application Instructions */}
              <div className="space-y-2">
                <label htmlFor="applicationInstructions" className="block text-lg font-semibold text-gray-800">
                  Application Instructions *
                </label>
                <p className="text-sm text-gray-600 mb-3">Provide clear instructions for candidates on how to apply and what to include</p>
                <TextArea
                  id="applicationInstructions"
                  name="applicationInstructions"
                  required
                  rows={6}
                  value={formData.applicationInstructions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg resize-none"
                  placeholder="Please include the following in your application:\n• Your resume/CV\n• A cover letter explaining your interest\n• Portfolio or relevant work samples (if applicable)\n• Contact information for 2-3 references\n\nApplications should be submitted in PDF format with the subject line: [Position Title] - [Your Name]"
                />
              </div>
            </div>
          </div>

          {/* Responsibilities Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                Key Responsibilities
              </h2>
              <p className="text-red-100 mt-2">What will this person be responsible for?</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={responsibility}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'responsibilities')}
                          className="w-full px-4 py-3 text-lg resize-none"
                          placeholder="Describe a key responsibility or duty..."
                          rows={2}
                        />
                      </div>
                      {formData.responsibilities.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'responsibilities')}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('responsibilities')}
                  variant="outline"
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Add Another Responsibility</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-3" />
                Requirements
              </h2>
              <p className="text-red-100 mt-2">What are the essential requirements for this role?</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={requirement}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                          className="w-full px-4 py-3 text-lg resize-none"
                          placeholder="Describe an essential requirement..."
                          rows={2}
                        />
                      </div>
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'requirements')}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('requirements')}
                  variant="outline"
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Add Another Requirement</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Qualifications Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Calendar className="w-6 h-6 mr-3" />
                Preferred Qualifications
              </h2>
              <p className="text-red-100 mt-2">What qualifications would make a candidate stand out?</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {formData.qualifications.map((qualification, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-emerald-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={qualification}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                          className="w-full px-4 py-3 text-lg resize-none"
                          placeholder="Describe a preferred qualification..."
                          rows={2}
                        />
                      </div>
                      {formData.qualifications.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'qualifications')}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('qualifications')}
                  variant="outline"
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Add Another Qualification</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Benefits Card - Only for Jobs */}
          {formData.type === 'job' && (
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <DollarSign className="w-6 h-6 mr-3" />
                  Benefits & Perks
                </h2>
                <p className="text-red-100 mt-2">What benefits and perks do you offer?</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-4">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mt-2">
                          <span className="text-amber-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <TextArea
                            value={benefit}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'benefits')}
                            className="w-full px-4 py-3 text-lg resize-none"
                            placeholder="Describe a benefit or perk..."
                            rows={2}
                          />
                        </div>
                        {formData.benefits.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeArrayItem(index, 'benefits')}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    onClick={() => addArrayItem('benefits')}
                    variant="outline"
                    className="w-full mt-6 px-6 py-4 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Add Another Benefit</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tags Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-red-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="w-6 h-6 mr-3" />
                Tags & Keywords
              </h2>
              <p className="text-red-100 mt-2">Add tags to help candidates find this opportunity</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                        <span className="text-rose-600 font-bold text-xs">#</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'tags')}
                          className="w-full px-4 py-3 text-lg"
                          placeholder="e.g., remote-work, nonprofit, social-impact"
                        />
                      </div>
                      {formData.tags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'tags')}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  variant="outline"
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-rose-300 rounded-xl text-rose-600 hover:border-rose-400 hover:bg-rose-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Add Another Tag</span>
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">💡 <strong>Tag suggestions:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {['remote-work', 'nonprofit', 'social-impact', 'entry-level', 'full-time', 'part-time', 'flexible-hours', 'healthcare', 'education', 'environment'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(suggestion)) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags.filter(tag => tag.trim() !== ''), suggestion]
                          }))
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:border-rose-300 hover:bg-rose-50 transition-all duration-200"
                    >
                      #{suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Post Your Opportunity?</h3>
                <p className="text-gray-600">Review your information and publish your vacancy to start connecting with talented candidates.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 border-2 border-gray-300 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="px-12 py-4 border-2 border-transparent rounded-xl text-lg font-bold text-white bg-gradient-to-r from-primary to-red-800 hover:from-red-700 hover:to-red-900 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Vacancy...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Publish Vacancy</span>
                    </div>
                  )}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">By publishing this vacancy, you agree to our terms of service and privacy policy.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}