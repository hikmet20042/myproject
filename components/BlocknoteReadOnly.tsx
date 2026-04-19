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
  textSize?: 'normal' | 'large'
}

const normalizeInitialContent = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : undefined
  }

  if (value && typeof value === 'object' && Array.isArray(value.blocks)) {
    return value.blocks.length > 0 ? value.blocks : undefined
  }

  return undefined
}

export default function BlocknoteReadOnly({ initialJSON, className, context = 'general', textSize = 'normal' }: Props) {
  const normalizedInitialContent = React.useMemo(
    () => normalizeInitialContent(initialJSON),
    [initialJSON],
  )

  const editor = useCreateBlockNote({
    initialContent: normalizedInitialContent,
  })

  if (!normalizedInitialContent) return <div className="text-gray-400 italic">Məzmun yoxdur</div>

  return (
    <div className={`${className ?? ''} relative`} data-text-size={textSize}>
      <div className="bn-autogrow min-h-[400px] relative">
        <style>{`
          .bn-container, .bn-editor, .bn-root, .bn-root * {
            background: transparent !important;
          }
          /* Hide strikethrough formatting */
          .bn-read-only-formatter [data-content-control-type="strikethrough"],
          .bn-read-only strikethrough {
            display: none !important;
          }
          /* Hide underline formatting */
          .bn-read-only-formatter [data-content-control-type="underline"],
          .bn-read-only underline {
            display: none !important;
          }
          /* Hide inline code formatting */
          .bn-read-only-formatter [data-content-control-type="code"],
          .bn-read-only code {
            display: none !important;
          }
          /* Hide text color formatting */
          .bn-read-only-formatter [data-content-control-type="textColor"],
          .bn-read-only text-color {
            display: none !important;
          }
          /* Hide background color formatting */
          .bn-read-only-formatter [data-content-control-type="backgroundColor"],
          .bn-read-only background-color {
            display: none !important;
          }
          /* Hide table-related elements */
          .bn-read-only table {
            display: none !important;
          }

          [data-text-size="large"] .bn-editor,
          [data-text-size="large"] .bn-root,
          [data-text-size="large"] .bn-root p,
          [data-text-size="large"] .bn-root li,
          [data-text-size="large"] .bn-root blockquote {
            font-size: 1.125rem !important;
            line-height: 1.9 !important;
          }

          [data-text-size="large"] .bn-root h1 {
            font-size: 2rem !important;
            line-height: 1.25 !important;
          }

          [data-text-size="large"] .bn-root h2 {
            font-size: 1.5rem !important;
            line-height: 1.35 !important;
          }

          [data-text-size="large"] .bn-root h3 {
            font-size: 1.25rem !important;
            line-height: 1.4 !important;
          }
        `}</style>
        <BlockNoteView editor={editor} theme="light" editable={false} />
      </div>
    </div>
  )
}
