'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb, ContactCard, SocialLink } from '@/components/ui'
import { ArrowLeft, MapPin, Globe, Mail, Phone, ExternalLink, CheckCircle } from 'lucide-react'

interface NGO {
  _id: string
  name: string
  description: string
  email?: string
  phone?: string
  website?: string
  address?: string
  location?: string
  category?: string
  status?: string
  registrationNumber?: string
  focusAreas?: string[]
  verified?: boolean
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export default function NGODetailPage() {
  const params = useParams()
  const [ngo, setNgo] = useState<NGO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNGO = async () => {
      try {
        const response = await fetch(`/api/ngos/${params.id}`)
        if (!response.ok) {
          throw new Error('NGO not found')
        }
        const data = await response.json()
        setNgo(data)
      } catch (err) {
        setError('Failed to load NGO details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchNGO()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NGO details...</p>
        </div>
      </div>
    )
  }

  if (error || !ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">NGO Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested NGO could not be found.'}</p>
          <Link href="/resources/ngos">
            <Button>Back to NGOs</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header with Navigation */}
      <section className="bg-primary text-white py-16 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              variant="light"
              className="mb-8"
              items={[
                { label: 'Home', href: '/' },
                { label: 'Resources', href: '/resources' },
                { label: 'NGOs', href: '/resources/ngos' },
                { label: ngo.name, current: true }
              ]}
            />

            {/* Back Button */}
            <Link href="/resources/ngos" className="inline-block mb-8">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to NGOs
              </Button>
            </Link>

            {/* NGO Header Info */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-primary">
                    {ngo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    {ngo.name}
                  </h1>
                  {ngo.verified && (
                    <CheckCircle className="w-6 h-6 text-accent" />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {ngo.category && (
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                      {ngo.category}
                    </Badge>
                  )}
                  {ngo.location && (
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                      <MapPin className="w-4 h-4 mr-2" />
                      {ngo.location}
                    </Badge>
                  )}
                  {ngo.verified && (
                    <Badge className="bg-accent/30 backdrop-blur-sm text-white border-accent/50">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-3xl">
                  {ngo.description}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {ngo.email && (
                    <a href={`mailto:${ngo.email}`}>
                      <Button 
                        variant="primary"
                        className="bg-white text-primary hover:bg-gray-100"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </a>
                  )}
                  {ngo.website && (
                    <a 
                      href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button 
                        variant="outline"
                        className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Main Information */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">About {ngo.name}</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {ngo.description}
                    </p>
                    
                    {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Focus Areas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {ngo.focusAreas.map((area, index) => (
                            <Badge 
                              key={index}
                              variant="secondary"
                              className="bg-primary/15 text-primary border-primary/30 font-medium"
                            >
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location & Address */}
                {ngo.address && (
                  <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Location & Address</h2>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                          <p className="text-gray-700 leading-relaxed">{ngo.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Registration Information */}
                {ngo.registrationNumber && (
                  <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Registration Details</h2>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                        <div className="flex items-center">
                          <ExternalLink className="w-4 h-4 text-primary mr-3" />
                          <div>
                            <p className="text-sm text-primary font-medium">Registration Number</p>
                            <p className="text-lg font-semibold text-gray-900">{ngo.registrationNumber}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Information Sidebar */}
              <div className="space-y-8">
                <Card className="bg-white rounded-xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
                    </div>
                    <div className="space-y-4">
                      {ngo.email && (
                        <ContactCard
                          icon={Mail}
                          label="Email"
                          value={ngo.email}
                          href={`mailto:${ngo.email}`}
                        />
                      )}
                      
                      {ngo.phone && (
                        <ContactCard
                          icon={Phone}
                          label="Phone"
                          value={ngo.phone}
                          href={`tel:${ngo.phone}`}
                        />
                      )}
                      
                      {ngo.website && (
                        <ContactCard
                          icon={Globe}
                          label="Website"
                          value={ngo.website}
                          href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                {ngo.socialMedia && Object.values(ngo.socialMedia).some(link => link) && (
                  <Card className="bg-white rounded-xl shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Follow Us</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ngo.socialMedia.facebook && (
                          <SocialLink
                            platform="facebook"
                            href={ngo.socialMedia.facebook}
                            variant="default"
                          />
                        )}
                        
                        {ngo.socialMedia.twitter && (
                          <SocialLink
                            platform="twitter"
                            href={ngo.socialMedia.twitter}
                            variant="default"
                          />
                        )}
                        
                        {ngo.socialMedia.instagram && (
                          <SocialLink
                            platform="instagram"
                            href={ngo.socialMedia.instagram}
                            variant="default"
                          />
                        )}
                        
                        {ngo.socialMedia.linkedin && (
                          <SocialLink
                            platform="linkedin"
                            href={ngo.socialMedia.linkedin}
                            variant="default"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Organization Stats */}
                <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Organization Info</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-primary mr-2" />
                          <p className="text-sm font-medium text-gray-600">Status</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {ngo.verified ? 'Verified Organization' : 'Pending Verification'}
                        </p>
                      </div>
                      
                      {ngo.category && (
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex items-center mb-2">
                            <ExternalLink className="w-5 h-5 text-primary mr-2" />
                            <p className="text-sm font-medium text-gray-600">Category</p>
                          </div>
                          <p className="font-semibold text-gray-900">{ngo.category}</p>
                        </div>
                      )}
                      
                      {ngo.location && (
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex items-center mb-2">
                            <MapPin className="w-5 h-5 text-primary mr-2" />
                            <p className="text-sm font-medium text-gray-600">Location</p>
                          </div>
                          <p className="font-semibold text-gray-900">{ngo.location}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
   