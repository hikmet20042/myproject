'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, FileText, Settings, User } from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { LoadingState } from '@/components/shared';
import { AppContainer } from '@/components/layout';
import { useNotificationContext } from '@/features/notifications/context/NotificationContext';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: User, path: '/profile' },
  { key: 'blogs', label: 'Blogs', icon: FileText, path: '/profile/blogs' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/profile/notifications' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/profile/settings' },
] as const;

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { unreadCount } = useNotificationContext();
  const pathname = usePathname();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.replace(localePath('/auth/signin'));
      return;
    }

    if (session?.user?.accountType === 'organization') {
      setIsRedirecting(true);
      router.replace(localePath('/dashboard/profile'));
      return;
    }

    setIsRedirecting(false);
  }, [status, session?.user?.accountType, router, localePath]);

  const shouldBlockRender =
    status === 'loading' ||
    isRedirecting ||
    status === 'unauthenticated' ||
    session?.user?.accountType === 'organization';

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: localePath(item.path),
      })),
    [localePath],
  );

  if (shouldBlockRender) {
    return <LoadingState text={'Profil yüklənir...'} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppContainer className="py-8 md:py-10 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.path !== '/profile' && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex-1 min-w-[150px] rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="relative">
                      <Icon className="w-4 h-4" />
                      {item.key === 'notifications' && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>

        {children}
      </AppContainer>
    </div>
  );
}
