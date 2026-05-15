"use client";

import { useSession } from "@/lib/auth/client";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { ErrorBoundary, UnauthorizedState } from "@/components/shared";
import { AdminRoleProvider } from "@/components/admin/AdminRoleProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Rəhbər panel", icon: LayoutDashboard },
    { href: "/admin/blogs", label: "Bloqlar", icon: BookOpen },
    { href: "/admin/events", label: "Tədbirlər", icon: Calendar },
    { href: "/admin/vacancies", label: "Vakansiyalar", icon: Briefcase },
    { href: "/admin/organizations", label: "Təşkilatlar", icon: Building },
    { href: "/admin/users", label: "İstifadəçilər", icon: Users },
    { href: "/admin/notifications", label: "Bildirişlər", icon: Bell },
    { href: "/admin/materials", label: "Materiallar", icon: FileText },
    { href: "/admin/settings", label: "Parametrlər", icon: Settings },
  ];

  if (!session) {
    return null;
  }

  if (!canAccessAdmin(session)) {
    return (
      <UnauthorizedState
        title={"Giriş Qadağandır"}
        message={"Bu sahəyə daxil olmaq üçün icazən yoxdur."}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
      <div className="relative z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {"Admin Paneli"}
              </h1>
              <p className="text-gray-600">
                {"icma360 platformasını idarə et"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {"Xoş gəldin"}, {session?.user?.name || "Admin"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm p-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <ErrorBoundary
              title="İdarəetmə panelində xəta baş verdi"
              message="Zəhmət olmasa yenidən cəhd edin və ya idarəetmə səhifəsini yeniləyin."
            >
              <AdminRoleProvider role={session?.user?.role}>
                {children}
              </AdminRoleProvider>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
