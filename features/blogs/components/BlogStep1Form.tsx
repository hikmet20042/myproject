'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { FileText, User, ChevronRight, Sparkles } from 'lucide-react'
import { FormLayout } from '@/components/forms'

type BlogStep1FormValues = {
  title: string
  isAnonymous: boolean
  authorName: string
}

type BlogStep1FormProps = {
  mode: 'submit' | 'edit'
  initialValues: BlogStep1FormValues
  userName?: string
  submitLabel: string
  nextHint: string
  onSubmit: (values: BlogStep1FormValues) => void
}

export default function BlogStep1Form({
  mode,
  initialValues,
  userName = '',
  submitLabel,
  nextHint,
  onSubmit,
}: BlogStep1FormProps) {
  const [title, setTitle] = useState(initialValues.title || '')
  const [isAnonymous, setIsAnonymous] = useState(Boolean(initialValues.isAnonymous))
  const [authorName, setAuthorName] = useState(initialValues.authorName || userName || '')
  const [nameError, setNameError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (!isAnonymous && !authorName.trim() && !userName) {
      setNameError('Zəhmət olmasa adınızı daxil edin və ya anonim göndərməyi seçin.')
      return
    }
    onSubmit({
      title,
      isAnonymous,
      authorName: authorName || userName || '',
    })
  }

  return (
    <FormLayout
      title={'Bloq məlumatları'}
      subtitle={
        mode === 'edit'
          ? 'Mövcud bloqu redaktə edirsiniz. Əsas məlumatları yeniləyin və növbəti mərhələyə keçin.'
          : 'Əsas məlumatlarla başlayaq. Bloq yazınız haqqında bizə məlumat verin.'
      }
      currentStep={1}
      totalSteps={2}
    >
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-8 space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-bold text-gray-900">
              <FileText className="w-5 h-5 text-blue-600" />
              {'Bloq Başlığı *'}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder={'Bloqunuz üçün cəlbedici bir başlıq verin...'}
                className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {title.length}/200
              </div>
            </div>
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>{'Hekayənizi ən yaxşı ifadə edən cəlbedici başlıq seçin'}</span>
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-bold text-gray-900">
              <User className="w-5 h-5 text-blue-600" />
              {'Adınız'}
            </label>
            <Input
              type="text"
              placeholder={'Adınızı daxil edin (və ya profil adınızı istifadə etmək üçün boş saxlayın)'}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={isAnonymous}
              className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {nameError && !isAnonymous && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {nameError}
              </p>
            )}
            {!isAnonymous && (
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl p-3">
                {authorName && authorName !== userName
                  ? 'Xüsusi ad bloqunuzda göstəriləcək'
                  : userName
                    ? `Profil adınız "${userName}" boş saxlanılsa istifadə olunacaq`
                    : 'Bloqunuzda göstərmək istədiyiniz adı daxil edin'}
              </p>
            )}
            {isAnonymous && (
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl p-3">
                {'Anonim göndərdikdə ad gizlədilir.'}
              </p>
            )}
          </div>

          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="flex items-center h-6">
                <Input
                  id="anon"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="anon" className="text-base font-semibold text-gray-900 cursor-pointer">
                  {'Anonim göndər'}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {'Kimliyiniz gizli saxlanılacaq. Yalnız "Anonim" göstəriləcək.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <div className="text-sm text-gray-600 order-2 sm:order-1">{nextHint}</div>
            <Button
              type="submit"
              variant="gradient-blue"
              size="lg"
              icon={ChevronRight}
              iconPosition="right"
              shadow="lg"
              hoverEffect="scale"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </FormLayout>
  )
}
