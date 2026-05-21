'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Briefcase, Settings } from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { LoadingState, ErrorBoundary } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui';
import { AppContainer } from '@/components/layout';
import { DashboardVacancyDataContainer } from '@/components/containers/DashboardVacancyDataContainer';

interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { key: 'overview', label: 'Ümumi baxış', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'events', label: 'Tədbirlər', icon: Calendar, path: '/dashboard/events' },
  { key: 'vacancies', label: 'Vakansiyalar', icon: Briefcase, path: '/dashboard/vacancies' },
  { key: 'profile', label: 'Profil', icon: Settings, path: '/dashboard/profile' },
] as const;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    // Block regular users from accessing dashboard
    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.replace(localePath('/auth/signin'));
      return;
    }

    // Regular users cannot access dashboard
    if (session?.user?.accountType === 'user') {
      setIsRedirecting(true);
      router.replace(localePath('/'));
      return;
    }

    // Pending organizations should be on /organization/pending
    if (session?.user?.accountType === 'organization' && session?.user?.organizationStatus === 'pending') {
      setIsRedirecting(true);
      router.replace(localePath('/organization/pending'));
      return;
    }

    setIsRedirecting(false);
  }, [status, session?.user?.accountType, session?.user?.organizationStatus, router, localePath]);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: localePath(item.path),
      })),
    [localePath],
  );

  const shouldBlockRender = status === 'loading' || isRedirecting || status === 'unauthenticated';

  if (shouldBlockRender) {
    return <LoadingState text="Rəhbər paneli yüklənir..." />;
  }

  return (
    <ErrorBoundary
      title="Rəhbər panelində xəta baş verdi"
      message="Zəhmət olmasa yenidən cəhd edin və ya səhifəni yeniləyin."
    >
      <DashboardVacancyDataContainer>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
          <AppContainer className="py-8 md:py-10 space-y-6">
            {/* Navigation Tabs */}
            <Card className="p-2 md:p-2.5">
              <nav className="flex flex-wrap gap-2.5">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.path !== '/dashboard' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <ButtonLink
                      key={item.key}
                      href={item.href}
                      variant={isActive ? 'primary' : 'ghost'}
                      size="md"
                      className={`flex-1 min-w-[140px] px-4 py-3 text-sm font-semibold duration-200 ${
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

            {/* Content Area */}
            {children}
          </AppContainer>
        </div>
      </DashboardVacancyDataContainer>
    </ErrorBoundary>
  );
}
