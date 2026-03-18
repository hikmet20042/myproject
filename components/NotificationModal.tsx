import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Close asChild>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label={'Bağla'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">{title}</Dialog.Title>
          <p className="text-gray-700 mb-4 whitespace-pre-line">{message}</p>
          <p className="text-xs text-gray-500 mb-4">{new Date(createdAt).toLocaleString()}</p>
          <div className="flex gap-2">
            {onMarkRead && !isRead && (
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onMarkRead}
              >
                Mark as Read
              </button>
            )}
            {onMarkUnread && isRead && (
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onMarkUnread}
              >
                Mark as Unread
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) }
