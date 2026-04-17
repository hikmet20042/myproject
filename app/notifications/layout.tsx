'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { LoadingState } from '@/components/shared';

interface NotificationsLayoutProps {
  children: ReactNode;
}

export default function NotificationsLayout({ children }: NotificationsLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    // Only authenticated users (regular users and organizations) can access notifications
    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.replace(localePath('/auth/signin'));
      return;
    }

    setIsRedirecting(false);
  }, [status, router, localePath]);

  if (isRedirecting || status === 'loading') {
    return <LoadingState text="Bildirişlər yüklənir..." />;
  }

  return <>{children}</>;
}
