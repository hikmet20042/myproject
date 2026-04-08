'use client'

import BlocknoteEditor from '@/components/BlocknoteEditor'
import { Button } from '@/components/ui'
import { FormLayout } from '@/components/forms'
import { AlertCircle, ArrowLeft, Eye, EyeOff, FileText, Send } from 'lucide-react'

type BlogEditorFormProps = {
  mode: 'submit' | 'edit'
  title: string
  displayAuthor: string
  content: any
  contentHtml: string
  characterCount: number
  showPreview: boolean
  isSubmitting: boolean
  error?: string
  backLabel: string
  submitLabel: string
  onTogglePreview: () => void
  onEditorChange: (json: any, html: string, text: string) => void
  onBack: () => void
  onSubmit: () => void
  progressHint?: string
}

export default function BlogEditorForm({
  title,
  displayAuthor,
  content,
  contentHtml,
  characterCount,
  showPreview,
  isSubmitting,
  error,
  backLabel,
  submitLabel,
  onTogglePreview,
  onEditorChange,
  onBack,
  onSubmit,
  progressHint,
}: BlogEditorFormProps) {
  const minChars = 100
  const isDisabled =
    isSubmitting ||
    ((typeof content === 'string' && (!content || !content.trim())) ||
      (typeof content !== 'string' &&
        (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))) ||
    characterCount < minChars

  return (
    <FormLayout
      title={'Bloq məzmunu'}
      subtitle={'Mətninizi tamamlayın və yoxlama üçün göndərin.'}
      currentStep={2}
      totalSteps={2}
      rightAction={
        <Button variant="ghost" onClick={onBack} className="inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      }
      infoBanner={
        progressHint ? (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">{progressHint}</div>
        ) : undefined
      }
    >
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          {'Bloq Təfərrüatları'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Başlıq'}</label>
            <p className="text-base font-semibold text-gray-900">{title}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Müəllif'}</label>
            <p className="text-base font-semibold text-gray-900">{displayAuthor}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {'Bloq Məzmunu'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">{characterCount} simvol</span>
              <Button onClick={onTogglePreview} variant="secondary" size="sm">
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Önizləməni gizlət' : 'Önizləməni göstər'}
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6 min-h-[400px]">
          {showPreview ? (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </div>
          ) : (
            <BlocknoteEditor key={title || 'empty'} initialJSON={content} onChange={onEditorChange} context="blog" />
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={isDisabled}
          variant="gradient-blue"
          loading={isSubmitting}
          size="lg"
          icon={Send}
          iconPosition="left"
          shadow="lg"
          hoverEffect="scale"
        >
          {submitLabel}
        </Button>
      </div>
    </FormLayout>
  )
}
