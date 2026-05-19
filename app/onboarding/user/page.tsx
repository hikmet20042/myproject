'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Button, Input } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { Card } from '@/components/ui/Card'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { ALLOWED_INTERESTS, MAX_INTERESTS, MIN_INTERESTS, ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/constants/onboarding'

export default function OnboardingUserPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError, showSuccess } = useGlobalFeedback()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentName = session?.user?.name || ''
  const looksIncomplete = !currentName || !currentName.includes(' ') || currentName.includes('@')
  const needsName = status === 'authenticated' && session?.user?.accountType !== 'organization' && looksIncomplete

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'organization') {
      router.replace(localePath('/dashboard'))
      return
    }
    if (session.user.accountType === 'user') {
      if (!looksIncomplete) {
        router.replace(localePath('/'))
        return
      }
      setName('')
    }
  }, [status, session, router, localePath, looksIncomplete])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest)
      if (prev.length >= MAX_INTERESTS) {
        showError(`Maksimum ${MAX_INTERESTS} maraq sahəsi seçə bilərsiniz.`)
        return prev
      }
      return [...prev, interest]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (needsName && !name.trim()) {
      showError('Zəhmət olmasa adınızı daxil edin.')
      return
    }
    if (selectedInterests.length < MIN_INTERESTS) {
      showError(`Ən azı ${MIN_INTERESTS} maraq sahəsi seçin.`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/onboarding/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: selectedInterests,
          ...(needsName && name.trim() ? { name: name.trim() } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        showError(data?.error || 'Saxlama alınmadı')
        return
      }
      showSuccess('Profil uğurla tamamlandı.')
      setTimeout(() => {
        setIsSubmitting(false)
        router.push(localePath('/'))
      }, 300)
    } catch {
      showError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.')
      setIsSubmitting(false)
    }
  }

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.push(localePath('/onboarding/role'))}
      className="text-slate-500 hover:text-slate-900"
      icon={ArrowLeft}
    >
      Geri
    </Button>
  )

  return (
    <FormLayout
      title={needsName ? 'Profilinizi tamamlayın' : 'Maraq sahələrinizi seçin'}
      subtitle={needsName
        ? 'Adınızı daxil edin və maraq sahələrinizi seçin.'
        : `Təcrübəni fərdiləşdirmək üçün ən azı ${MIN_INTERESTS} sahə seçin (maksimum ${MAX_INTERESTS}).`}
      currentStep={ONBOARDING_STEPS.DETAILS}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      rightAction={backButton}
    >
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {needsName && (
            <div>
              <Input
                label="Adınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad və Soyad"
                required
              />
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Maraq sahələri</h3>
            <div className="flex flex-wrap gap-3">
              {ALLOWED_INTERESTS.map((interest) => {
                const active = selectedInterests.includes(interest)
                return (
                  <Button
                    key={interest}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {interest}
                  </Button>
                )}
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{selectedInterests.length}/{MAX_INTERESTS} seçildi</span>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} variant="primary">
              Davam et
            </Button>
          </div>
        </form>
      </Card>
    </FormLayout>
  )
}
