'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'
import IllustrationAsset from '@/components/shared/IllustrationAsset'

export default function OnboardingOrganizationPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError, showSuccess } = useGlobalFeedback()
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (session.user.accountType === 'user') {
      router.replace(localePath('/'))
      return
    }
    if (session.user.accountType === 'organization') {
      router.replace(localePath('/dashboard'))
    }
  }, [status, session, router, localePath])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.organizationName.trim()) {
      showError('Təşkilat adı tələb olunur.')
      return
    }
    if (!formData.organizationType) {
      showError('Kateqoriya seçin.')
      return
    }
    if (formData.description.trim().length < 20) {
      showError('Qısa təsvir ən azı 20 simvol olmalıdır.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/onboarding/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        showError(data?.error || 'Saxlama alınmadı')
        return
      }
      showSuccess('Təşkilat onboarding tamamlandı.')
      router.push(localePath('/dashboard'))
    } catch {
      showError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormLayout
      title="Təşkilat qurulumu"
      subtitle="Qısa məlumatı tamamlayın və dashboard istifadəsinə başlayın."
    >
      <div className="mb-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-cyan-50 to-white p-4">
        <IllustrationAsset
          illustrationKey="onboarding-organization"
          className="mx-auto h-40 w-full max-w-sm"
        />
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 space-y-5">
        <Input
          label="Təşkilat adı"
          value={formData.organizationName}
          onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
          placeholder="Təşkilat adını daxil edin"
          required
        />

        <Select
          label="Kateqoriya"
          value={formData.organizationType}
          onChange={(e) => setFormData((prev) => ({ ...prev, organizationType: e.target.value }))}
          options={ORGANIZATION_TYPE_VALUES.map((value) => ({
            value,
            label: ORGANIZATION_TYPE_LABELS[value],
          }))}
          placeholder="Kateqoriya seçin"
          required
        />

        <TextArea
          label="Qısa təsvir"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Təşkilatınızın məqsədi və fəaliyyəti haqqında qısa məlumat yazın"
          rows={5}
          required
        />

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} variant="primary">
            Davam et
          </Button>
        </div>
      </form>
    </FormLayout>
  )
}
