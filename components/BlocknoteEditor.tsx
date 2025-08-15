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
  
}

export default function BlocknoteEditor({ initialJSON, onChange, className }: Props) {
  const [isEmpty, setIsEmpty] = useState(true)
  const editor = useCreateBlockNote({
    initialContent: initialJSON ?? undefined,
    uploadFile: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (data.url) return data.url
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
  <div className={`${className ?? ''} relative rounded-xl border border-gray-200 bg-white px-3`}> 
      <div className="p-2 bn-autogrow min-h-[400px] relative">
        
        <BlockNoteView editor={editor} theme="light" />
      </div>
    </div>
  )
}


