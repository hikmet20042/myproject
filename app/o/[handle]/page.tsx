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
  Briefcase,
  Calendar,
  Users,
  Building2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'
import { SocialLink } from '@/components/ui'

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
  const [readingProgress, setReadingProgress] = useState(0)

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

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement
      const totalHeight = doc.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const followerLabel = Number(org?.followerCount || 0).toLocaleString('az-AZ')
  const eventLabel = Number(org?.eventCount || 0).toLocaleString('az-AZ')
  const vacancyLabel = Number(org?.vacancyCount || 0).toLocaleString('az-AZ')
  const socialLinks = org?.socialLinks ? Object.entries(org.socialLinks) : []

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareTitle = org?.organizationName || 'Təşkilat profili'

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle} təşkilat profilinə baxın`,
          url: shareUrl,
        })
        return
      } catch {
        // fall back to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      window.prompt('Linki paylaşmaq üçün kopyalayın', shareUrl)
    }
  }

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

  return (
    <>
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-gray-100">
        <div
          className="h-1 bg-blue-600 transition-all duration-200"
          style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
        />
      </div>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
          {/* Breadcrumbs & Back Action */}
          <nav className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <li>
                <Link href={localePath('/')} className="transition-colors hover:text-blue-600">
                  Ana səhifə
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li>
                <Link href={localePath('/resources/organizations')} className="transition-colors hover:text-blue-600">
                  Təşkilatlar
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="truncate text-slate-900">{org.organizationName}</li>
            </ol>

            <Link
              href={localePath('/resources/organizations')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Bütün Təşkilatlar
            </Link>
          </nav>

          {/* Hero Section */}
          <Card className="mb-8 p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {org.profileImage ? (
                    <Image src={org.profileImage} alt={org.organizationName} fill sizes="64px" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-black text-blue-600">
                      {org.organizationName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-newsreader text-2xl font-semibold text-slate-900 md:text-3xl">
                      {org.organizationName}
                    </span>
                    {org.isVerified && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-slate-500 md:text-base">
                    {org.organizationType || 'Təşkilat'}
                    {org.address ? ` • ${org.address}` : ''}
                  </p>
                </div>
              </div>

              <h1 className="max-w-4xl font-newsreader text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                {org.organizationName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-slate-200 py-5 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{org.address || 'Məkan əlavə olunmayıb'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Fəaliyyət sahəsi: {org.organizationType || 'İctimai Təşkilat'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{followerLabel} izləyici</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">İzləyicilər</p>
                  <p className="font-newsreader text-3xl font-semibold text-blue-600">{followerLabel}</p>
                </Card>
                <Card className="p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Aktiv tədbirlər</p>
                  <p className="font-newsreader text-3xl font-semibold text-slate-900">{eventLabel}</p>
                </Card>
                <Card className="p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Açıq vakansiyalar</p>
                  <p className="font-newsreader text-3xl font-semibold text-slate-900">{vacancyLabel}</p>
                </Card>
              </div>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Main Column */}
            <div className="space-y-8 lg:col-span-8">
              <Card className="p-6 md:p-8">
                <div className="mb-6 border-b border-slate-100 pb-3">
                  <h2 className="font-newsreader text-2xl font-semibold text-slate-900 md:text-[30px]">Haqqında</h2>
                </div>
                <div className="space-y-4 text-[17px] leading-8 text-slate-600">
                  <p>{org.description || 'Bu təşkilat haqqında hələlik ətraflı məlumat əlavə olunmayıb.'}</p>
                </div>
              </Card>

              {org.focusAreas.length > 0 && (
                <Card className="p-6 md:p-8">
                  <div className="mb-6 border-b border-slate-100 pb-3">
                    <h2 className="font-newsreader text-2xl font-semibold text-slate-900 md:text-[30px]">Mission &amp; Focus</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {org.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6 md:p-8">
                <div className="mb-6 flex items-end justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-newsreader text-2xl font-semibold text-slate-900 md:text-[30px]">Recent Activity</h2>
                  <Link href={localePath('/resources/events')} className="mb-1 text-sm font-semibold text-blue-600 hover:underline">
                    View All
                  </Link>
                </div>

                <div className="space-y-6">
                  {org.eventCount > 0 ? (
                    <div className="group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-newsreader text-2xl font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                            {eventLabel} Aktiv Tədbir
                          </h3>
                          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Tədbirlər</p>
                          <p className="mt-3 text-slate-600 leading-7">
                            Bu təşkilat tərəfindən hazırlanmış son tədbirləri və ictimai fəaliyyətləri izləyin.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                      Hazırda aktiv tədbir yoxdur.
                    </div>
                  )}

                  {org.vacancyCount > 0 ? (
                    <div className="group cursor-pointer border-t border-slate-100 pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-newsreader text-2xl font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                            {vacancyLabel} Açıq Vakansiya
                          </h3>
                          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Karyera</p>
                          <p className="mt-3 text-slate-600 leading-7">
                            Təşkilatın mövcud vakansiyalarını və karyera imkanlarını araşdırın.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                      Hazırda açıq vakansiya yoxdur.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8 lg:col-span-4 lg:sticky lg:top-28">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Actions</p>
                    <h3 className="font-newsreader text-2xl font-semibold text-slate-900">Follow &amp; Share</h3>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <OrganizationFollowButtonContainer
                    organizationId={org.id}
                    organizationName={org.organizationName}
                    size="lg"
                    showFollowerCount={false}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    icon={Share2}
                    className="w-full gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
                    aria-label={`Paylaş: ${org.organizationName}`}
                  >
                    Paylaş
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 flex items-center gap-2 font-newsreader text-2xl font-semibold text-slate-900">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Əlaqə
                </h3>

                <div className="space-y-6">
                  {org.website && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Vebsayt</p>
                      <a
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-slate-900 transition-colors hover:text-blue-600"
                      >
                        {org.website}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}

                  {org.address && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ünvan</p>
                      <p className="flex items-start gap-2 text-slate-700">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{org.address}</span>
                      </p>
                    </div>
                  )}

                  {org.contactPhone && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Telefon</p>
                      <p className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{org.contactPhone}</span>
                      </p>
                    </div>
                  )}

                  {socialLinks.length > 0 && (
                    <div className="pt-2">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Social Links</p>
                      <div className="flex flex-wrap gap-3">
                        {socialLinks.map(([key, url]) => {
                          const knownPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
                          if (knownPlatforms.includes(key)) {
                            return <SocialLink key={key} platform={key as any} href={url} variant="icon-only" />;
                          }
                          return (
                            <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600" aria-label={key}>
                              <Globe className="h-4 w-4" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <h3 className="mb-6 font-newsreader text-2xl font-semibold">Statistika</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-semibold">{eventLabel}</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">Aktiv Tədbir</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-semibold">{vacancyLabel}</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">Açıq Vakansiya</div>
                  </div>
                </div>
              </div>

              <Card>
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h3 className="font-newsreader text-2xl font-semibold text-slate-900">Quick Reference</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Followers</p>
                      <p className="text-sm font-semibold text-slate-900">{followerLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</p>
                      <p className="text-sm font-semibold text-slate-900">{org.organizationType || 'Təşkilat'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</p>
                      <p className="text-sm font-semibold text-slate-900">{org.isVerified ? 'Verified' : 'New'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}
