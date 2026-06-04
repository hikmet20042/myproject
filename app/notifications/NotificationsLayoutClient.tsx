'use client';

import { type ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoadingState } from '@/components/shared';

interface NotificationsLayoutProps {
  children: ReactNode;
}

export default function NotificationsLayout({ children }: NotificationsLayoutProps) {
  const { isReady } = useAuthGuard({});

  if (!isReady) {
    return <LoadingState text="Bildirişlər yüklənir..." />;
  }

  return <>{children}</>;
}
