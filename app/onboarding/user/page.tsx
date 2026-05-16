'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Button, Input } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { Card } from '@/components/ui/Card'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

const INTEREST_OPTIONS = ['IT', 'Təhsil', 'Könüllülük', 'Sosial fəaliyyət', 'Digər']

export default function OnboardingUserPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError, showSuccess } = useGlobalFeedback()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [name, setName] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'organization') {
      router.replace(localePath('/dashboard'))
      return
    }
    if (session.user.accountType === 'user') {
      // Check if the user's name looks like an email prefix (has no spaces, or contains @)
      const currentName = session.user.name || ''
      const looksIncomplete = !currentName || !currentName.includes(' ') || currentName.includes('@')
      setNeedsName(looksIncomplete)
      if (looksIncomplete) setName('')
      else router.replace(localePath('/'))
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
    if (needsName && !name.trim()) {
      showError('Zəhmət olmasa adınızı daxil edin.')
      return
    }
    if (selectedInterests.length < 1) {
      showError('Ən azı 1 maraq sahəsi seçin.')
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
      router.push(localePath('/'))
    } catch {
      showError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormLayout
      title={needsName ? 'Profilinizi tamamlayın' : 'Maraq sahələrinizi seçin'}
      subtitle={needsName
        ? 'Adınızı daxil edin və maraq sahələrinizi seçin.'
        : 'Təcrübəni fərdiləşdirmək üçün ən azı 1 sahə seçin (maksimum 5).'}
    >
      <Card className="p-6 sm:p-8">
        {needsName && (
          <div className="mb-6">
            <Input
              label="Adınız"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad və Soyad"
              required
            />
          </div>
        )}

        <h3 className="text-base font-bold text-slate-900 mb-3">Maraq sahələri</h3>
        <div className="flex flex-wrap gap-3">
          {INTEREST_OPTIONS.map((interest) => {
            const active = selectedInterests.includes(interest)
            return (
              <Button
                key={interest}
                variant="outline"
                size="sm"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {interest}
              </Button>
            )}
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-slate-600">{selectedInterests.length}/5 seçildi</span>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting} variant="primary">
            Davam et
          </Button>
        </div>
      </Card>
    </FormLayout>
  )
}
