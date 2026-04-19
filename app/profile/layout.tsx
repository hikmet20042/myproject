'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Settings, User, Users } from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { LoadingState } from '@/components/shared';
import { AppContainer } from '@/components/layout';

const NAV_ITEMS = [
  { key: 'overview', label: 'Ümumi baxış', icon: User, path: '/profile' },
  { key: 'blogs', label: 'Bloqlarım', icon: FileText, path: '/profile/blogs' },
  { key: 'organizations', label: 'İzlədiklərim', icon: Users, path: '/profile/organizations' },
  { key: 'settings', label: 'Tənzimləmələr', icon: Settings, path: '/profile/settings' },
] as const;

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
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

    // /profile and all subpages are regular-user-only routes
    // Organizations should use /dashboard/profile instead
    if (session?.user?.accountType === 'organization') {
      setIsRedirecting(true);
      router.push(localePath('/dashboard/profile'));
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
      <AppContainer className="py-8 md:py-10 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm md:p-2.5">
          <nav className="flex flex-wrap gap-2.5">
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
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="relative">
                      <Icon className="w-4 h-4" />
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
