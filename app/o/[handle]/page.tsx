'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle, Globe, Mail, MapPin, Phone } from 'lucide-react'

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
}

export default function PublicOrgProfilePage() {
  const params = useParams()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
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
        if (!res.ok) throw new Error('Organization not found')
        return res.json()
      })
      .then((json) => {
        setOrg(json.data?.organization || null)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [handle])

  const isOwnOrg = session?.user?.id === org?.id

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
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Geri
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="px-6 sm:px-8 pb-8 -mt-16">
            <div className="relative h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
              {org.profileImage ? (
                <img src={org.profileImage} alt={org.organizationName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-2xl font-bold">
                  {org.organizationName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900 flex items-center gap-2">
              {org.organizationName}
              {org.isVerified && <CheckCircle className="w-5 h-5 text-blue-500" />}
            </h1>
            <p className="text-sm text-gray-500">
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/o/{org.urlHandle}</code>
            </p>
            {org.organizationType && (
              <p className="mt-1 text-gray-600">{org.organizationType}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Haqqında</h2>
            {org.description && (
              <p className="text-gray-700 text-sm mb-4">{org.description}</p>
            )}
            <div className="space-y-3 text-sm">
              {org.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{org.address}</span>
                </div>
              )}
              {org.contactPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{org.contactPhone}</span>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {org.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Fəaliyyət</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tədbirlər</span>
                <span className="font-semibold text-gray-900">{org.eventCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Vakansiyalar</span>
                <span className="font-semibold text-gray-900">{org.vacancyCount || 0}</span>
              </div>
              {org.focusAreas.length > 0 && (
                <div className="pt-2">
                  <span className="text-gray-600 block mb-2">Fəaliyyət sahələri</span>
                  <div className="flex flex-wrap gap-2">
                    {org.focusAreas.map((area, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
