'use client'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import React from 'react'

type Props = {
  initialJSON?: any
  className?: string
  context?: string // Context for determining storage type (article, story, profile, etc.)
}

export default function BlocknoteReadOnly({ initialJSON, className, context = 'general' }: Props) {
  const editor = useCreateBlockNote({
    initialContent: initialJSON ?? undefined,
  })

  if (!initialJSON) return <div className="text-gray-400 italic">No content</div>

  return (
    <div className={`${className ?? ''} relative rounded-xl border border-0 bg-[#F9FAFB] px-3`}>
      <div className="p-2 bn-autogrow min-h-[400px] relative">
        <style>{`
          .bn-container, .bn-editor, .bn-root, .bn-root * {
            background: #F9FAFB !important;
          }
        `}</style>
        <BlockNoteView editor={editor} theme="light" editable={false} />
      </div>
    </div>
  )
}
