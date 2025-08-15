"use client";
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import React from 'react';

interface BlocknoteReadOnlyProps {
  content: any;
  className?: string;
}

export default function BlocknoteReadOnly({ content, className }: BlocknoteReadOnlyProps) {
  const editor = useCreateBlockNote({
    initialContent: content ?? undefined,
  });

  if (!content) return <div className="text-gray-400 italic">No content</div>;

  return (
    <div className={className ?? ''} style={{ background: 'inherit' }}>
      <style>{`
        .bn-container, .bn-editor, .bn-root, .bn-root * {
          background: transparent !important;
        }
      `}</style>
      <BlockNoteView editor={editor} theme="light" editable={false} />
    </div>
  );
}
