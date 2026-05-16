import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';

interface NotificationModalProps { open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  createdAt: string;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  isRead?: boolean; }

export default function NotificationModal({ open, onClose, title, message, createdAt, onMarkRead, onMarkUnread, isRead }: NotificationModalProps) { return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => { if (!value) onClose() }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg">
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="xs"
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              aria-label={'Bağla'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </Dialog.Close>
          <Dialog.Title className="text-xl font-semibold text-slate-900 mb-2">{title}</Dialog.Title>
          <p className="text-slate-700 mb-4 whitespace-pre-line">{message}</p>
          <p className="text-xs text-slate-500 mb-4">{new Date(createdAt).toLocaleString()}</p>
          <div className="flex gap-2">
            {onMarkRead && !isRead && (
              <Button variant="primary" size="sm" onClick={onMarkRead}>
                Oxunmuş kimi işarələ
              </Button>
            )}
            {onMarkUnread && isRead && (
              <Button variant="outline" size="sm" onClick={onMarkUnread}>
                Oxunmamış kimi işarələ
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) }
