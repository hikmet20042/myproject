'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useAccountType } from '@/hooks/useAccountType'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import EmptyState from '@/components/shared/EmptyState'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Share2,
  Users,
  FileText,
  Info,
  Home,
  Globe,
  User,
} from 'lucide-react'
import { Button, ButtonLink, SocialLink } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import Image from 'next/image'

type UserProfile = {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  phone: string | null
  occupation: string | null
  interests: string | null
  socialLinks: Record<string, string> | null
  createdAt: string
  urlHandle: string
  blogCount: number
}

export default function PublicUserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const accountType = useAccountType()
  const handle = params?.handle as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!handle) return
    setLoading(true)
    setError('')

    fetch(`/api/users/public/${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!res.ok) throw new Error('İstifadəçi tapılmadı')
        return res.json()
      })
      .then((json) => {
        setProfile(json.data?.user || null)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Profili yükləmək mümkün olmadı')
      })
      .finally(() => setLoading(false))
  }, [handle])

  const isOwnProfile = session?.user?.id === profile?.id

  if (loading) {
    return <LoadingState text="Profil yüklənir..." />
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="İstifadəçi tapılmadı"
        message={error || 'Axtardığınız istifadəçi profili mövcud deyil.'}
        onRetry={() => router.push(localePath('/'))}
        retryText="Ana səhifəyə qayıt"
      />
    )
  }

  const blogLabel = Number(profile.blogCount || 0).toLocaleString('az-AZ')
  const socialLinks = profile.socialLinks ? Object.entries(profile.socialLinks) : []
  const joinDate = new Date(profile.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long' })

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareTitle = profile.name

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
              { name: profile.name, href: localePath(`/u/${profile.urlHandle}`) },
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
            href={localePath('/')}
            variant="outline"
            size="sm"
            className="gap-2 order-1 sm:order-2"
            icon={ArrowLeft}
            iconPosition="left"
          >
            Geri
          </ButtonLink>
        </nav>

        {/* User Header */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-10">
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm ring-2 ring-slate-100 bg-white">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {profile.name}
            </h1>

            {profile.occupation && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {profile.occupation}
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
                  {profile.bio || 'Bu istifadəçi haqqında hələlik ətraflı məlumat əlavə olunmayıb.'}
                </p>

                {profile.interests && (
                  <div className="border-t border-slate-200 pt-5 mt-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Maraq Sahələri
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.split(',').map((interest, i) => (
                        <Badge key={i} className="bg-blue-50 text-blue-700 border-blue-200">
                          {interest.trim()}
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
                    <Users className="h-4 w-4" />
                  </div>
                  Statistika
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-600">{blogLabel}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Bloq</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-slate-900">{joinDate}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Qoşulub</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Son Fəaliyyət
                </h2>
                <div className="space-y-4">
                  {profile.blogCount > 0 ? (
                    <Link
                      href={localePath('/resources/blogs')}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {blogLabel} Bloq Yazısı
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          İstifadəçinin yazılarını oxuyun
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <EmptyState variant="sidebar" message="Hazırda bloq yazısı yoxdur." />
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
                    <User className="h-4 w-4" />
                  </div>
                  Əməliyyatlar
                </h3>
                <div className="space-y-3">
                  {isOwnProfile && (
                    <ButtonLink
                      href={localePath('/profile/settings')}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      Profili redaktə et
                    </ButtonLink>
                  )}
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
                  {profile.location && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ünvan</p>
                      <p className="flex items-start gap-2 text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <span>{profile.location}</span>
                      </p>
                    </div>
                  )}

                  {profile.website && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vebsayt</p>
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {profile.website}
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {profile.phone && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefon</p>
                      <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{profile.phone}</span>
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
                              rel="nofollow noopener noreferrer"
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
