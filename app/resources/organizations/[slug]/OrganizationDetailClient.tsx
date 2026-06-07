'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import Image from 'next/image'
import { Button, ButtonLink } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ContactCard, SocialLink } from '@/components/ui'
import { ArrowLeft, MapPin, Globe, Mail, Phone, ExternalLink, CheckCircle, Users, Building, CalendarDays, Info, Home } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import { FOCUS_AREA_LABELS_AZ, ORGANIZATION_TYPE_LABELS } from '@/lib/organizationTypes'
import { fetchOrganizationById, resolveOrganizationIdentifier } from '@/lib/organizationQueries'
import { logError } from '@/lib/logger'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'

interface Organization {
  _id: string
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
  contactPerson: {
    name: string
    email: string
    phone?: string
    position?: string
  }
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string | null
  updatedAt: string | null
  followerCount?: number
}

export default function OrganizationDetailPage() {
  const localePath = useLocalizedPath()
  const router = useRouter()
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const slug = typeof params?.slug === 'string' ? params.slug : ''
        if (!slug) throw new Error('Təşkilat tapılmadı')
        const resolved = await resolveOrganizationIdentifier(slug)
        if (!resolved.id) throw new Error('Təşkilat tapılmadı')
        const result = await fetchOrganizationById(resolved.id)
        const org = result.organization
        setOrganization(org ? { ...org, _id: org.id || resolved.id, createdAt: org.createdAt || null, updatedAt: org.updatedAt || null } : null)
      } catch (err) {
        logError('Organization detail API error', err)
        setError('Məlumatları yükləyərkən problem baş verdi')
      } finally {
        setLoading(false)
      }
    }

    if (params?.slug) {
      loadOrganization()
    }
  }, [params?.slug])

  if (loading) {
    return <LoadingState text={'Təşkilat məlumatları yüklənir...'} />
  }

  if (error || !organization) {
    return (
      <ErrorState
        title={'Təşkilat tapılmadı'}
        message={error || 'Axtardığın təşkilat tapılmadı.'}
        retryText={'Təşkilatlara qayıt'}
        onRetry={() => router.replace(localePath('/resources/organizations'))}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20" />

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Breadcrumb + Back Button */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-6 mb-12 flex-col sm:flex-row">
          <ol className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest order-2 sm:order-1" itemScope itemType="https://schema.org/BreadcrumbList">
            {[
              { name: 'Ana səhifə', href: localePath('/') },
              { name: 'Resurslar', href: localePath('/resources') },
              { name: 'Təşkilatlar', href: localePath('/resources/organizations') },
              { name: organization.organizationName, href: localePath(`/o/${organization.slug || organization._id || ''}`) },
            ].map((item, i, arr) => (
              <li key={item.href} className="flex items-center gap-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                {i > 0 && <span className="text-slate-300" aria-hidden="true">/</span>}
                {i < arr.length - 1 ? (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors" itemProp="item">
                    <span itemProp="name">{i === 0 && <Home className="inline w-3.5 h-3.5 mr-1" />}{item.name}</span>
                  </Link>
                ) : (
                  <span className="text-slate-900 truncate" itemProp="name">{item.name}</span>
                )}
                <meta itemProp="position" content={String(i + 1)} />
              </li>
            ))}
          </ol>
          <ButtonLink
            href={localePath('/resources/organizations')}
            variant="outline"
            size="sm"
            className="gap-2 order-1 sm:order-2"
            icon={ArrowLeft}
            iconPosition="left"
          >
            Təşkilatlara qayıt
          </ButtonLink>
        </nav>

        {/* JSON-LD */}
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

        {/* Organization Header */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-10">
          <div className="flex-shrink-0">
            {organization.profileImage ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm ring-2 ring-slate-100 bg-white">
                <Image
                  src={organization.profileImage}
                  alt={organization.organizationName}
                  fill
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-xl font-bold text-white">
                  {organization.organizationName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {organization.organizationName}
              </h1>
              {organization.status === 'approved' && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {organization.organizationType && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  {ORGANIZATION_TYPE_LABELS[
                    organization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                  ] || organization.organizationType}
                </Badge>
              )}
              {organization.focusAreas && organization.focusAreas.length > 0 && (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                  {FOCUS_AREA_LABELS_AZ[organization.focusAreas[0] as keyof typeof FOCUS_AREA_LABELS_AZ] || organization.focusAreas[0]}
                </Badge>
              )}
              {organization.address && (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {organization.address}
                </Badge>
              )}
              {organization.status === 'approved' && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Təsdiqlənmiş
                </Badge>
              )}
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                {`${Number(organization.followerCount || 0).toLocaleString('az-AZ')} izləyici`}
              </Badge>
            </div>

            <p className="text-slate-600 leading-relaxed max-w-3xl">
              {organization.description}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="pb-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Info className="h-4 w-4" />
                  </div>
                  Haqqında
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {organization.description}
                </p>

                {organization.focusAreas && organization.focusAreas.length > 0 && (
                  <div className="border-t border-slate-200 pt-5 mt-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Fəaliyyət Sahələri
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {organization.focusAreas.map((area, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {FOCUS_AREA_LABELS_AZ[area as keyof typeof FOCUS_AREA_LABELS_AZ] || area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              {organization.address && (
                <div className="rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    Yer və Ünvan
                  </h2>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-slate-700">{organization.address}</p>
                  </div>
                </div>
              )}

              {/* Registration */}
              {organization.registrationNumber && (
                <div className="rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    Qeydiyyat Məlumatları
                  </h2>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                    <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qeydiyyat Nömrəsi</p>
                      <p className="text-slate-900 font-semibold">{organization.registrationNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  Əlaqə Məlumatları
                </h3>
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
                    <div className="p-4 rounded-lg bg-slate-50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Əlaqə Şəxsi</p>
                      <p className="font-semibold text-slate-900">{organization.contactPerson.name}</p>
                      {organization.contactPerson.position && (
                        <p className="text-sm text-slate-500">{organization.contactPerson.position}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                    <OrganizationFollowButtonContainer
                      organizationId={organization._id}
                      organizationName={organization.organizationName}
                      size="md"
                      showFollowerCount={false}
                    />
                    {organization.contactPerson?.email && (
                      <a href={`mailto:${organization.contactPerson.email}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Əlaqə
                        </Button>
                      </a>
                    )}
                    {organization.website && (
                      <a
                        href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Veb-sayt
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </Card>

              {/* Social Media */}
              {organization.socialMedia && Object.values(organization.socialMedia).some(link => link) && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    Bizi İzlə
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
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
                </Card>
              )}

              {/* Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building className="h-4 w-4" />
                  </div>
                  Təşkilat Məlumatları
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vəziyyət</p>
                    </div>
                    <p className="text-slate-900 font-semibold">
                      {organization.status === 'approved' ? 'Təsdiqlənmiş' : 'Təsdiq gözlənilir'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qoşulma</p>
                      </div>
<p className="text-slate-900 font-semibold text-sm">
                         {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString('az-AZ') : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yenilənmə</p>
                      </div>
<p className="text-slate-900 font-semibold text-sm">
                         {organization.updatedAt ? new Date(organization.updatedAt).toLocaleDateString('az-AZ') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
