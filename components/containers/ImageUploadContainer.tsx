'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

interface ImageUploadContainerProps {
  value?: string
  onChange: (url: string) => void
  context?: string
  accept?: string
  maxSize?: number
  className?: string
}

export default function ImageUploadContainer({
  value,
  onChange,
  context = 'general',
  accept = 'image/*',
  maxSize = 10,
  className = '',
}: ImageUploadContainerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showError: showFeedbackError } = useGlobalFeedback()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fayl ölçüsü ${maxSize}MB-dan böyükdür`)
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Fayl şəkil olmalıdır')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('context', context)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error?.message || result?.error || 'Yükləmə alınmadı')
      }

      const uploadedUrl = result?.data?.url || result?.url
      if (!uploadedUrl) throw new Error('Yükləmə alınmadı')
      onChange(uploadedUrl)
      setPreview(uploadedUrl)
    } catch (uploadErr: any) {
      console.error('Upload error:', uploadErr)
      setError(uploadErr.message || 'Şəkili yükləmək alınmadı')
      showFeedbackError(uploadErr.message || 'Şəkili yükləmək alınmadı')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {!preview ? (
        <Button
          variant="ghost"
          className="w-full border-2 border-dashed border-blue-200 rounded-md p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            {uploading ? (
              <>
                <Loading size="lg" variant="spinner" color="primary" />
                <p className="text-sm text-slate-600">{'Yüklənir...'}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">{'Şəkil yükləmək üçün klikləyin'}</p>
                  <p className="text-xs text-slate-500 mt-1">{`PNG, JPG, GIF ${maxSize}MB-a qədər`}</p>
                </div>
              </>
            )}
          </div>
        </Button>
      ) : (
        <div className="relative group">
          <div className="relative w-full h-64 rounded-md overflow-hidden border-2 border-blue-100">
            <Image src={preview} alt="Önizləmə" fill className="object-cover" unoptimized />
          </div>
          <Button variant="ghost" size="xs" className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100" onClick={handleRemove} icon={X} />
          <Button variant="ghost" size="xs" className="absolute bottom-2 right-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 shadow-lg opacity-0 group-hover:opacity-100 disabled:opacity-50" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{'Şəkli dəyişdir'}</Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
