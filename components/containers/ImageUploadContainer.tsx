'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import Image from 'next/image'

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize * 1024 * 1024) {
      setError('Fayl şəkil olmalıdır')
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

      if (!response.ok) {
        const uploadError = await response.json()
        throw new Error(uploadError?.error?.message || uploadError?.error || 'Yükləmə alınmadı')
      }

      const result = await response.json()
      const uploadedUrl = result?.data?.url || result?.url
      if (!uploadedUrl) throw new Error('Yükləmə alınmadı')
      onChange(uploadedUrl)
      setPreview(uploadedUrl)
    } catch (uploadErr: any) {
      console.error('Upload error:', uploadErr)
      setError(uploadErr.message || 'Şəkili yükləmək alınmadı')
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-blue-200 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            {uploading ? (
              <>
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">{'Yüklənir...'}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{'Şəkil yükləmək üçün klikləyin'}</p>
                  <p className="text-xs text-gray-500 mt-1">{`PNG, JPG, GIF ${maxSize}MB-a qədər`}</p>
                </div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="relative group">
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-blue-100">
            <Image src={preview} alt="Önizləmə" fill className="object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 disabled:opacity-50"
          >
            {'Şəkli dəyişdir'}
          </button>
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
