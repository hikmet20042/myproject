'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { FormLayout } from '@/components/forms'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'
import { Card } from '@/components/ui/Card'
import { MIN_DESCRIPTION_LENGTH, ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/constants/onboarding'

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
      return
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
    if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      showError(`Qısa təsvir ən azı ${MIN_DESCRIPTION_LENGTH} simvol olmalıdır.`)
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
      setTimeout(() => {
        setIsSubmitting(false)
        router.push(localePath('/organization/pending'))
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

  const descriptionLength = formData.description.length
  const meetsMinLength = descriptionLength >= MIN_DESCRIPTION_LENGTH

  return (
    <FormLayout
      title="Təşkilat qurulumu"
      subtitle="Qısa məlumatı tamamlayın və təsdiqdən sonra rəhbər paneldən istifadəyə başlayın."
      currentStep={ONBOARDING_STEPS.DETAILS}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      rightAction={backButton}
    >
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
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

        <div>
          <TextArea
            label="Qısa təsvir"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Təşkilatınızın məqsədi və fəaliyyəti haqqında qısa məlumat yazın"
            rows={5}
            required
          />
          <p className={`mt-1 text-sm transition-colors duration-200 ${meetsMinLength ? 'text-emerald-600' : 'text-slate-500'}`}>
            {descriptionLength}/{MIN_DESCRIPTION_LENGTH} simvol
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} variant="primary">
            Davam et
          </Button>
        </div>
        </form>
      </Card>
    </FormLayout>
  )
}
