'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User, UserRound } from 'lucide-react'

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
        if (!res.ok) throw new Error('User not found')
        return res.json()
      })
      .then((json) => {
        setProfile(json.data?.user || null)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile')
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
        actionText="Ana səhifəyə qayıt"
        onAction={() => router.push(localePath('/'))}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Geri
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

          <div className="px-6 sm:px-8 pb-8 -mt-16">
            {/* Avatar */}
            <div className="relative h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Handle */}
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-500">
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/u/{profile.urlHandle}</code>
            </p>

            {profile.occupation && (
              <p className="mt-1 text-gray-600">{profile.occupation}</p>
            )}

            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push(localePath('/profile/settings'))}
              >
                Profili redaktə et
              </Button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Haqqında</h2>
            <div className="space-y-3 text-sm">
              {profile.bio && (
                <p className="text-gray-700">{profile.bio}</p>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.interests && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.interests.split(',').map((interest, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              )}
              {!profile.bio && !profile.location && !profile.phone && !profile.website && !profile.interests && (
                <p className="text-gray-400">Bu istifadəçi hələ profilini doldurmayıb.</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Statistika</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Bloqlar</span>
                <span className="font-semibold text-gray-900">{profile.blogCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Qoşulub</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(profile.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
