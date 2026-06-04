'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { FileText, Settings, User, Users } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { LoadingState } from '@/components/shared';
import { AppContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui';

const NAV_ITEMS = [
  { key: 'overview', label: 'Ümumi baxış', icon: User, path: '/profile' },
  { key: 'blogs', label: 'Bloqlarım', icon: FileText, path: '/profile/blogs' },
  { key: 'organizations', label: 'İzlədiklərim', icon: Users, path: '/profile/organizations' },
  { key: 'settings', label: 'Tənzimləmələr', icon: Settings, path: '/profile/settings' },
] as const;

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuthGuard({ allowedAccountTypes: ['user'], blockedRedirectTo: '/dashboard/profile' });
  const pathname = usePathname();
  const localePath = useLocalizedPath();

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: localePath(item.path),
      })),
    [localePath],
  );

  if (!isReady) {
    return <LoadingState text={'Profil yüklənir...'} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
      <AppContainer className="py-8 md:py-10 space-y-6">
        <Card className="p-2 md:p-2.5">
          <nav className="flex flex-wrap gap-2.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.path !== '/profile' && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <ButtonLink
                  key={item.key}
                  href={item.href}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="md"
                  className={`flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                      : 'text-slate-700 hover:bg-gray-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="relative">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{item.label}</span>
                  </span>
                </ButtonLink>
              );
            })}
          </nav>
        </Card>

        {children}
      </AppContainer>
    </div>
  );
}
