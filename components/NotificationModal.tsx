import React from 'react';

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  createdAt: string;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  isRead?: boolean;
}

export default function NotificationModal({ open, onClose, title, message, createdAt, onMarkRead, onMarkUnread, isRead }: NotificationModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
  <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
  <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
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
      </div>
    </div>
  );
}
