'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LogOut, User } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState } from '@/components/shared'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { FormLayout } from '@/components/forms'
import { signOut } from '@/lib/auth/client'
import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/constants/onboarding'

export default function OnboardingRolePage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const [isSelecting, setIsSelecting] = useState<'user' | 'organization' | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'user') {
      router.replace(localePath('/'))
      return
    }
    if (session.user.accountType === 'organization') {
      router.replace(localePath('/dashboard'))
      return
    }
  }, [status, session, router, localePath])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  const handleSignOut = async () => {
    await signOut((path) => router.push(path))
  }

  const signOutButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className="text-slate-500 hover:text-red-600"
      icon={LogOut}
    >
      Hesabdan çıx
    </Button>
  )

  const handleRoleSelect = (role: 'user' | 'organization') => {
    setIsSelecting(role)
    if (role === 'user') {
      router.push(localePath('/onboarding/user'))
    } else {
      router.push(localePath('/onboarding/organization'))
    }
  }

  return (
    <FormLayout
      title="Rol seçimi"
      subtitle="Davama keçmək üçün hesab tipinizi seçin."
      currentStep={ONBOARDING_STEPS.ROLE}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      rightAction={signOutButton}
    >
      <Card className="p-6 sm:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Button
            variant="ghost"
            onClick={() => handleRoleSelect('user')}
            disabled={isSelecting !== null}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Fərdi istifadəçi</h2>
            <p className="mt-2 text-sm text-slate-600">Maraq sahələrini seç və fərdi təcrübə ilə davam et.</p>
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleRoleSelect('organization')}
            disabled={isSelecting !== null}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Təşkilat</h2>
            <p className="mt-2 text-sm text-slate-600">Təşkilat məlumatını əlavə et və rəhbər paneldən istifadəyə başla.</p>
          </Button>
        </div>
      </Card>
    </FormLayout>
  )
}
