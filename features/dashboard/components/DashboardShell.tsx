"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Card } from "@/components/ui/Card";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navItems = [
  { key: "profile", label: "Təşkilat profili", href: "/dashboard/profile", icon: User },
  { key: "events", label: "Tədbirləriniz", href: "/dashboard/events", icon: Calendar },
  {
    key: "vacancies",
    label: "Vakansiyalarınız",
    href: "/dashboard/vacancies",
    icon: Briefcase,
  },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const localePath = useLocalizedPath();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
        <Card className="h-fit rounded-2xl p-3 lg:sticky lg:top-6">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <h1 className="text-sm font-semibold text-slate-900">Təşkilat rəhbər paneli</h1>
            <p className="mt-1 text-xs text-slate-500">Profilinizi tamamlayın, sonra tədbir və vakansiyaları idarə edin.</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const localizedHref = localePath(item.href);
              const isActive =
                pathname === localizedHref ||
                (item.href !== "/dashboard" && pathname?.startsWith(localizedHref));

              return (
                <Link
                  key={item.key}
                  href={localizedHref}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border border-blue-200 bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </Card>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
