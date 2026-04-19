'use client'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbar,
  FormattingToolbarController,
  getFormattingToolbarItems,
} from '@blocknote/react'
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
      form.append('context', context)

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
      } catch (error: unknown) {
        console.error('File upload failed:', error)
        const message = error instanceof Error ? error.message : 'Şəkil yüklənmədi'
          setUploadError(message)
          setTimeout(() => setUploadError(null), 5000)
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
      {/* Hide unwanted formatting toolbar buttons via CSS */}
      <style>{`
        /* Hide strikethrough button */
        button[data-content-control-type="strikethrough"],
        .bn-formatting-toolbar button[aria-label*="strike"] {
          display: none !important;
        }
        /* Hide underline button */
        button[data-content-control-type="underline"],
        .bn-formatting-toolbar button[aria-label*="Underline"] {
          display: none !important;
        }
        /* Hide inline code button */
        button[data-content-control-type="code"],
        .bn-formatting-toolbar button[aria-label*="code"] {
          display: none !important;
        }
        /* Hide text color button */
        button[data-content-control-type="textColor"],
        .bn-formatting-toolbar button[aria-label*="text color"],
        .bn-formatting-toolbar button[aria-label*="Text Color"] {
          display: none !important;
        }
        /* Hide background color button */
        button[data-content-control-type="backgroundColor"],
        .bn-formatting-toolbar button[aria-label*="background color"],
        .bn-formatting-toolbar button[aria-label*="Background Color"] {
          display: none !important;
        }
        /* Hide table-related buttons */
        button[data-content-control-type="table-cell-merge"],
        .bn-formatting-toolbar button[aria-label*="merge"],
        .bn-formatting-toolbar button[aria-label*="Merge"] {
          display: none !important;
        }
        /* Hide file caption button */
        button[data-content-control-type="file-caption"],
        .bn-formatting-toolbar button[aria-label*="caption"],
        .bn-formatting-toolbar button[aria-label*="Caption"] {
          display: none !important;
        }
        /* Hide file delete button */
        button[data-content-control-type="file-delete"],
        .bn-formatting-toolbar button[aria-label*="delete file"],
        .bn-formatting-toolbar button[aria-label*="Delete File"] {
          display: none !important;
        }
        /* Hide nest/unnest buttons from formatting toolbar */
        button[data-content-control-type="nestBlock"],
        button[data-content-control-type="unnestBlock"],
        .bn-formatting-toolbar button[aria-label*="nest"],
        .bn-formatting-toolbar button[aria-label*="Nest"] {
          display: none !important;
        }
        /* Hide add comment button */
        button[data-content-control-type="add-comment"],
        .bn-formatting-toolbar button[aria-label*="comment"],
        .bn-formatting-toolbar button[aria-label*="Comment"] {
          display: none !important;
        }
        /* Hide text align buttons */
        button[data-content-control-type="textAlign"],
        .bn-formatting-toolbar button[aria-label*="align"],
        .bn-formatting-toolbar button[aria-label*="Align"] {
          display: none !important;
        }
        /* Restrict block type select items */
        .bn-block-type-select [data-item-type="pageBreak"],
        .bn-block-type-select [data-item-type="codeBlock"],
        .bn-block-type-select [data-item-type="table"],
        .bn-block-type-select [data-item-type="checkListItem"],
        .bn-block-type-select [data-item-type="audio"],
        .bn-block-type-select [data-item-type="video"],
        .bn-block-type-select [data-item-type="file"] {
          display: none !important;
        }
        /* Hide image replace button in file toolbar */
        button[data-content-control-type="file-replace"] {
          display: none !important;
        }
        button[data-content-control-type="file-download"] {
          display: none !important;
        }
        button[data-content-control-type="file-preview"] {
          display: none !important;
        }
      `}</style>

      {uploadError && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {uploadError}
        </div>
      )}
      <div className="p-2 bn-autogrow min-h-[400px] relative">
        <BlockNoteView
          editor={editor}
          theme="light"
          formattingToolbar={false}
        >
          <FormattingToolbarController
            formattingToolbar={() => (
              <FormattingToolbar
                blockTypeSelectItems={
                  editor?.dictionary?.blockTypeSelect
                    ? [
                        editor.dictionary.blockTypeSelect.paragraph,
                        editor.dictionary.blockTypeSelect.h1,
                        editor.dictionary.blockTypeSelect.h2,
                        editor.dictionary.blockTypeSelect.h3,
                        editor.dictionary.blockTypeSelect.bullet,
                        editor.dictionary.blockTypeSelect.numbered,
                        editor.dictionary.blockTypeSelect.quote,
                      ].filter(Boolean)
                    : undefined
                }
              >
                {getFormattingToolbarItems()
                  // Keep only the essential buttons: bold, italic, link
                  .filter((item) => {
                    const key = item.key || ''
                    // Keep: bold, italic, link, and the block type select
                    const allowed = [
                      'bold',
                      'italic',
                      'link',
                      'blockTypeSelect',
                    ]
                    return allowed.includes(key)
                  })}
              </FormattingToolbar>
            )}
          />
        </BlockNoteView>
      </div>
    </div>
  )
}
