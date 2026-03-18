"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/client';

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshNotifications: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadNotifications = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/notifications?unread=true');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnreadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications: loadUnreadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
