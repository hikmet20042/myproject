'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState } from '@/components/shared'
import { Button } from '@/components/ui'
import { FormLayout } from '@/components/forms'
import IllustrationAsset from '@/components/shared/IllustrationAsset'

export default function OnboardingRolePage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'user') router.replace(localePath('/'))
    if (session.user.accountType === 'organization') router.replace(localePath('/dashboard'))
  }, [status, session, router, localePath])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  return (
    <FormLayout
      title="Rol seçimi"
      subtitle="Davama keçmək üçün hesab tipinizi seçin."
    >
      <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-4">
        <IllustrationAsset
          illustrationKey="onboarding-user"
          className="mx-auto h-40 w-full max-w-sm"
        />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push(localePath('/onboarding/user'))}
            className="group rounded-2xl border border-gray-200 bg-slate-50 p-6 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Fərdi istifadəçi</h2>
            <p className="mt-2 text-sm text-gray-600">Maraq sahələrini seç və fərdi təcrübə ilə davam et.</p>
          </button>

          <button
            type="button"
            onClick={() => router.push(localePath('/onboarding/organization'))}
            className="group rounded-2xl border border-gray-200 bg-slate-50 p-6 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Təşkilat</h2>
            <p className="mt-2 text-sm text-gray-600">Təşkilat məlumatını əlavə et və dashboard istifadəsini aç.</p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="ghost" onClick={() => router.push(localePath('/auth/signin'))}>
            Hesab dəyiş
          </Button>
        </div>
      </div>
    </FormLayout>
  )
}
