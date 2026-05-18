'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb, ContactCard, SocialLink } from '@/components/ui'
import { ArrowLeft, MapPin, Globe, Mail, Phone, ExternalLink, CheckCircle, Users } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared';
import { ORGANIZATION_TYPE_LABELS } from '@/lib/organizationTypes'
import { fetchOrganizationById, resolveOrganizationIdentifier } from '@/lib/organizationQueries'
import { logError } from '@/lib/logger'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'

interface Organization { _id: string
  id?: string
  slug?: string
  organizationName: string
  profileImage?: string
  organizationType?: string
  description: string
  website?: string
  contactPhone?: string
  address?: string
  registrationNumber?: string
  focusAreas: string[]
  status: 'pending' | 'approved' | 'rejected'
  contactPerson: { name: string
    email: string
    phone?: string
    position?: string }
  socialMedia?: { facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string }
  approvedBy?: { _id: string
    name: string
    email: string }
  createdAt: string
  updatedAt: string
  followerCount?: number
}

export default function OrganizationDetailPage() { const localePath = useLocalizedPath();
  const router = useRouter()
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { const loadOrganization = async () => { try {
      const slug = typeof params?.slug === 'string' ? params.slug : ''
      if (!slug) { throw new Error('Təşkilat tapılmadı') }
      const resolved = await resolveOrganizationIdentifier(slug)
      if (!resolved.id) { throw new Error('Təşkilat tapılmadı') }
      const result = await fetchOrganizationById(resolved.id)
      setOrganization(result.organization)
    } catch (err) {
      logError('Organization detail API error', err)
      setError('Məlumatları yükləyərkən problem baş verdi')
    } finally { setLoading(false) } }

    if (params?.slug) { loadOrganization() } }, [params?.slug])

  if (loading) { return (
      <LoadingState 
        text={'Təşkilat məlumatları yüklənir...'}
      />
    ) }

  if (error || !organization) { return (
      <ErrorState 
        title={'Təşkilat tapılmadı'}
        message={error || 'Axtardığın təşkilat tapılmadı.'}
        retryText={'Təşkilatlara qayıt'}
        onRetry={() => router.replace(localePath("/resources/organizations"))}
      />
    ) }
        

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header with Navigation */}
      <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />
        <div className="section-padding">
          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              className="mb-8"
              items={[
                { label: 'Ana səhifə', href: localePath('/') },
                { label: 'Resurslar', href: localePath('/resources') },
                { label: 'Təşkilatlar', href: localePath('/resources/organizations') },
                { label: organization.organizationName, current: true }
              ]}
            />

            {/* JSON-LD BreadcrumbList */}
            <Script
              id="org-breadcrumb-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Ana səhifə', item: localePath('/') },
                    { '@type': 'ListItem', position: 2, name: 'Resurslar', item: localePath('/resources') },
                    { '@type': 'ListItem', position: 3, name: 'Təşkilatlar', item: localePath('/resources/organizations') },
                    { '@type': 'ListItem', position: 4, name: organization.organizationName, item: localePath(`/o/${organization.slug || organization._id || ''}`) },
                  ],
                }),
              }}
            />

            {/* JSON-LD Organization Profile */}
            <Script
              id="org-profile-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  name: organization.organizationName,
                  description: organization.description,
                  url: organization.website,
                  address: organization.address ? { '@type': 'PostalAddress', streetAddress: organization.address, addressCountry: 'AZ' } : undefined,
                  areaServed: { '@type': 'Country', name: 'Azerbaijan' },
                  knowsAbout: organization.focusAreas?.join(', '),
                  sameAs: [organization.website, organization.socialMedia?.facebook, organization.socialMedia?.instagram, organization.socialMedia?.linkedin, organization.socialMedia?.twitter].filter(Boolean),
                }),
              }}
            />

            {/* Back Button */}
            <Link href={localePath("/resources/organizations")} className="inline-block mb-8">
              <Button 
                variant="outline" 
                className="bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {'Təşkilatlara qayıt'}
              </Button>
            </Link>

            {/* Organization Header Info */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-shrink-0">
                {organization.profileImage ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-md ring-4 ring-white bg-white">
                    <Image
                      src={organization.profileImage}
                      alt={organization.organizationName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center shadow-md ring-4 ring-white">
                    <span className="text-2xl font-bold text-white">
                      {organization.organizationName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                    {organization.organizationName}
                  </h1>
                  {organization.status === 'approved' && (
                    <CheckCircle className="w-6 h-6 text-accent" />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {organization.focusAreas && organization.focusAreas.length > 0 && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      {organization.focusAreas[0]}
                    </Badge>
                  )}
                  {organization.organizationType && (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                      {ORGANIZATION_TYPE_LABELS[
                        organization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                      ] || organization.organizationType}
                    </Badge>
                  )}
                  {organization.address && (
                    <Badge className="bg-white text-slate-700 border-slate-200">
                      <MapPin className="w-4 h-4 mr-2" />
                      {organization.address}
                    </Badge>
                  )}
                  {organization.status === 'approved' && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {'Təsdiqlənmiş'}
                    </Badge>
                  )}
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    <Users className="w-4 h-4 mr-2" />
                    {`${Number(organization.followerCount || 0).toLocaleString('az-AZ')} izləyici`}
                  </Badge>
                </div>
                
                <p className="text-slate-600 text-lg leading-relaxed mb-6 max-w-3xl">
                  {organization.description}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <OrganizationFollowButtonContainer
                    organizationId={organization._id}
                    organizationName={organization.organizationName}
                    size="md"
                    showFollowerCount={false}
                  />
                  {organization.contactPerson?.email && (
                    <a href={`mailto:${organization.contactPerson.email}`}>
                      <Button 
                        variant="secondary"
                        hoverEffect="scale"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {'Əlaqə'}
                      </Button>
                    </a>
                  )}
                  {organization.website && (
                    <a 
                      href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button 
                        variant="outline"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-primary"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {'Veb-sayt'}
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
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">{`${organization.organizationName} Haqqında`}</h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-6">
                      {organization.description}
                    </p>
                    
                    {organization.focusAreas && organization.focusAreas.length > 0 && (
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          {'Fəaliyyət Sahələri'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {organization.focusAreas.map((area, index) => (
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
                {organization.address && (
                  <Card className="rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">{'Yer və Ünvan'}</h2>
                      </div>
                      <div className="bg-gray-50 rounded-md p-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-slate-500 mr-3 mt-1" />
                          <p className="text-slate-700 leading-relaxed">{organization.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Registration Information */}
                {organization.registrationNumber && (
                  <Card className="rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">{'Qeydiyyat Məlumatları'}</h2>
                      </div>
                      <div className="bg-primary/5 rounded-md p-4 border border-primary/10">
                        <div className="flex items-center">
                          <ExternalLink className="w-4 h-4 text-primary mr-3" />
                          <div>
                            <p className="text-sm text-primary font-medium">{'Qeydiyyat Nömrəsi'}</p>
                            <p className="text-lg font-semibold text-slate-900">{organization.registrationNumber}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Information Sidebar */}
              <div className="space-y-8">
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{'Əlaqə Məlumatları'}</h3>
                    </div>
                    <div className="space-y-4">
                      {organization.contactPerson?.email && (
                        <ContactCard
                          icon={Mail}
                          label={'E-poçt'}
                          value={organization.contactPerson.email}
                          href={`mailto:${organization.contactPerson.email}`}
                        />
                      )}
                      
                      {organization.contactPhone && (
                        <ContactCard
                          icon={Phone}
                          label={'Telefon'}
                          value={organization.contactPhone}
                          href={`tel:${organization.contactPhone}`}
                        />
                      )}
                      
                      {organization.contactPerson?.phone && (
                        <ContactCard
                          icon={Phone}
                          label={'Əlaqə Şəxsinin Telefonu'}
                          value={organization.contactPerson.phone}
                          href={`tel:${organization.contactPerson.phone}`}
                        />
                      )}
                      
                      {organization.website && (
                        <ContactCard
                          icon={Globe}
                          label={'Vebsayt'}
                          value={organization.website}
                          href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                        />
                      )}
                      
                      {organization.contactPerson?.name && (
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-slate-600 mb-1">{'Əlaqə Şəxsi'}</p>
                          <p className="font-semibold text-slate-900">{organization.contactPerson.name}</p>
                          {organization.contactPerson.position && (
                            <p className="text-sm text-slate-600">{organization.contactPerson.position}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                {organization.socialMedia && Object.values(organization.socialMedia).some(link => link) && (
                  <Card className="rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{'Bizi İzlə'}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {organization.socialMedia.facebook && (
                          <SocialLink
                            platform="facebook"
                            href={organization.socialMedia.facebook}
                            variant="default"
                          />
                        )}
                        
                        {organization.socialMedia.twitter && (
                          <SocialLink
                            platform="twitter"
                            href={organization.socialMedia.twitter}
                            variant="default"
                          />
                        )}
                        
                        {organization.socialMedia.instagram && (
                          <SocialLink
                            platform="instagram"
                            href={organization.socialMedia.instagram}
                            variant="default"
                          />
                        )}
                        
                        {organization.socialMedia.linkedin && (
                          <SocialLink
                            platform="linkedin"
                            href={organization.socialMedia.linkedin}
                            variant="default"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Organization Stats */}
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{'Təşkilat Məlumatları'}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-primary mr-2" />
                          <p className="text-sm font-medium text-slate-600">{'Vəziyyət'}</p>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">
                          {organization.status === 'approved' ? 'Təsdiqlənmiş' : 'Təsdiq gözlənilir'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-slate-600 mb-1">{'Qoşulma tarixi'}</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(organization.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-slate-600 mb-1">{'Son yenilənmə'}</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(organization.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
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
