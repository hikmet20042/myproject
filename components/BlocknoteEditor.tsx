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
  const [isEmpty, setIsEmpty] = useState(true)
  const editor = useCreateBlockNote({
    initialContent: initialJSON ?? undefined,
    uploadFile: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('context', context) // Add context for storage determination
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const result = await res.json()
        const uploadedUrl = result?.data?.url || result?.url
        if (uploadedUrl) return uploadedUrl
      } catch {}
      // fallback to data url
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
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
      <div className="p-2 bn-autogrow min-h-[400px] relative">
        
        <BlockNoteView editor={editor} theme="light" />
      </div>
    </div>
  )
}


