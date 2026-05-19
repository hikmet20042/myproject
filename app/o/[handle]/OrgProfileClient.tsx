'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import {
  ArrowLeft,
  CheckCircle,
  Globe,
  MapPin,
  Phone,
  Share2,
  Users,
  Building2,
  CalendarDays,
  Info,
  Home,
} from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SocialLink } from '@/components/ui'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'
import Link from 'next/link'
import Image from 'next/image'

type OrgProfile = {
  id: string
  organizationName: string
  urlHandle: string
  description: string
  organizationType: string
  website: string | null
  contactPhone: string | null
  address: string | null
  profileImage: string | null
  isVerified: boolean
  focusAreas: string[]
  socialLinks: Record<string, string> | null
  eventCount: number
  vacancyCount: number
  followerCount: number
}

export default function PublicOrgProfilePage() {
  const params = useParams()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const handle = params?.handle as string

  const [org, setOrg] = useState<OrgProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!handle) return
    setLoading(true)
    setError('')

    fetch(`/api/organizations/public/${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Təşkilat tapılmadı')
        return res.json()
      })
      .then((json) => {
        setOrg(json.data?.organization || null)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Profili yükləmək mümkün olmadı')
      })
      .finally(() => setLoading(false))
  }, [handle])

  if (loading) {
    return <LoadingState text="Təşkilat profili yüklənir..." />
  }

  if (error || !org) {
    return (
      <ErrorState
        title="Təşkilat tapılmadı"
        message={error || 'Axtardığınız təşkilat profili mövcud deyil.'}
        onRetry={() => router.push(localePath('/'))}
        retryText="Ana səhifəyə qayıt"
      />
    )
  }

  const followerLabel = Number(org.followerCount || 0).toLocaleString('az-AZ')
  const eventLabel = Number(org.eventCount || 0).toLocaleString('az-AZ')
  const vacancyLabel = Number(org.vacancyCount || 0).toLocaleString('az-AZ')
  const socialLinks = org.socialLinks ? Object.entries(org.socialLinks) : []

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareTitle = org.organizationName

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        return
      } catch {
        // fall back
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      window.prompt('Linki kopyalayın', shareUrl)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20" />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Breadcrumb + Back Button */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-6 mb-12 flex-col sm:flex-row">
          <ol className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest order-2 sm:order-1" itemScope itemType="https://schema.org/BreadcrumbList">
            {[
              { name: 'Ana səhifə', href: localePath('/') },
              { name: 'Təşkilatlar', href: localePath('/resources/organizations') },
              { name: org.organizationName, href: localePath(`/o/${org.urlHandle}`) },
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
            Geri
          </ButtonLink>
        </nav>

        {/* Organization Header */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-10">
          <div className="flex-shrink-0">
            {org.profileImage ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm ring-2 ring-slate-100 bg-white">
                <Image
                  src={org.profileImage}
                  alt={org.organizationName}
                  fill
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-xl font-bold text-white">
                  {org.organizationName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {org.organizationName}
              </h1>
              {org.isVerified && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>

            {org.organizationType && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {org.organizationType}
              </Badge>
            )}
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
                  {org.description || 'Bu təşkilat haqqında hələlik ətraflı məlumat əlavə olunmayıb.'}
                </p>

                {org.focusAreas.length > 0 && (
                  <div className="border-t border-slate-200 pt-5 mt-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Fəaliyyət Sahələri
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {org.focusAreas.map((area) => (
                        <Badge key={area} className="bg-blue-50 text-blue-700 border-blue-200">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  Fəaliyyət
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-600">{followerLabel}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">İzləyici</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-slate-900">{eventLabel}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Tədbir</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-slate-900">{vacancyLabel}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Vakansiya</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  Son Fəaliyyət
                </h2>
                <div className="space-y-4">
                  {org.eventCount > 0 ? (
                    <Link
                      href={localePath('/resources/events')}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {eventLabel} Aktiv Tədbir
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Təşkilatın son tədbirlərini izləyin
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-50 text-slate-500 text-sm">
                      Hazırda aktiv tədbir yoxdur.
                    </div>
                  )}

                  {org.vacancyCount > 0 ? (
                    <Link
                      href={localePath('/resources/vacancies')}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {vacancyLabel} Açıq Vakansiya
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Mövcud karyera imkanlarını araşdırın
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-50 text-slate-500 text-sm">
                      Hazırda açıq vakansiya yoxdur.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  Əməliyyatlar
                </h3>
                <div className="space-y-3">
                  <OrganizationFollowButtonContainer
                    organizationId={org.id}
                    organizationName={org.organizationName}
                    size="md"
                    showFollowerCount={false}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="w-full gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Paylaş
                  </Button>
                </div>
              </Card>

              {/* Contact */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  Əlaqə
                </h3>
                <div className="space-y-4">
                  {org.website && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vebsayt</p>
                      <a
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {org.website}
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {org.address && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ünvan</p>
                      <p className="flex items-start gap-2 text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <span>{org.address}</span>
                      </p>
                    </div>
                  )}

                  {org.contactPhone && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefon</p>
                      <a href={`tel:${org.contactPhone}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{org.contactPhone}</span>
                      </a>
                    </div>
                  )}

                  {socialLinks.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sosial Media</p>
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.map(([key, url]) => {
                          const knownPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok']
                          if (knownPlatforms.includes(key)) {
                            return <SocialLink key={key} platform={key as any} href={url} variant="icon-only" />
                          }
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-200 hover:text-blue-600 transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
