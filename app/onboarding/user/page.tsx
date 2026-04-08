'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Button } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/lib/useGlobalFeedback'

const INTEREST_OPTIONS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər']

export default function OnboardingUserPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError, showSuccess } = useGlobalFeedback()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'organization') {
      router.replace(localePath('/dashboard'))
      return
    }
    if (session.user.accountType === 'user') {
      router.replace(localePath('/'))
    }
  }, [status, session, router, localePath])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest)
      if (prev.length >= 5) {
        showError('Maksimum 5 maraq sahəsi seçə bilərsiniz.')
        return prev
      }
      return [...prev, interest]
    })
  }

  const handleSubmit = async () => {
    if (selectedInterests.length < 1) {
      showError('Ən azı 1 maraq sahəsi seçin.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/onboarding/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      const data = await response.json()
      if (!response.ok) {
        showError(data?.error || 'Saxlama alınmadı')
        return
      }
      showSuccess('Profil maraqları yadda saxlanıldı.')
      router.push(localePath('/'))
    } catch {
      showError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormLayout
      title="Maraq sahələrinizi seçin"
      subtitle="Təcrübəni fərdiləşdirmək üçün ən azı 1 sahə seçin (maksimum 5)."
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-3">
          {INTEREST_OPTIONS.map((interest) => {
            const active = selectedInterests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {interest}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">{selectedInterests.length}/5 seçildi</span>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting} variant="primary">
            Davam et
          </Button>
        </div>
      </div>
    </FormLayout>
  )
}
