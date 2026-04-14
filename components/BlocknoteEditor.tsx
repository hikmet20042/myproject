'use client'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import React, { useEffect, useState } from 'react'

type Props = {
  initialJSON?: any
  onChange?: (json: any, html: string, text: string) => void
  className?: string
  context?: string // Context for determining storage type (article, story, profile, etc.)
}

export default function BlocknoteEditor({ initialJSON, onChange, className, context = 'general' }: Props) {
  const [isEmpty, setIsEmpty] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const editor = useCreateBlockNote({
    initialContent: initialJSON ?? undefined,
    uploadFile: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('context', context) // Add context for storage determination
      
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          const errorMsg = errorData?.error?.message || 'Şəkil yüklənmədi'
          setUploadError(errorMsg)
          setTimeout(() => setUploadError(null), 5000)
          throw new Error(errorMsg)
        }
        
        const result = await res.json()
        const uploadedUrl = result?.data?.url || result?.url
        
        if (!uploadedUrl) {
          setUploadError('Şəkil URL-i tapılmadı')
          setTimeout(() => setUploadError(null), 5000)
          throw new Error('Upload failed: No URL returned')
        }
        
        setUploadError(null)
        return uploadedUrl
      } catch (error: any) {
        console.error('File upload failed:', error)
        if (!setUploadError) {
          setUploadError(error.message || 'Şəkil yüklənmədi')
          setTimeout(() => setUploadError(null), 5000)
        }
        throw error
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    const handler = async () => {
      const json = editor.document
      const html = await editor.blocksToFullHTML(json)
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      const text = tmp.textContent || ''
      setIsEmpty(!text.trim())
      if (onChange) onChange(json, html, text)
    }
    editor.onEditorContentChange(handler)
    return () => {
      // No off method available in current typings; rely on component unmount
    }
  }, [editor, onChange])

  return (
    <div className={`${className ?? ''} relative rounded-xl border border-blue-100 bg-white px-3`}>
      {uploadError && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {uploadError}
        </div>
      )}
      <div className="p-2 bn-autogrow min-h-[400px] relative">
        <BlockNoteView editor={editor} theme="light" />
      </div>
    </div>
  )
}


