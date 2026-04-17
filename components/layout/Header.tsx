'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from '@/lib/auth/client'
import { canAccessAdmin, canAccessDashboard, isOrganization } from '@/lib/auth/permissions'
import { Menu, X, User, ChevronDown, ArrowRight, Bookmark } from 'lucide-react'
import { useNotificationContext } from '@/features/notifications/context/NotificationContext'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import NotificationBellContainer from '@/features/notifications/components/NotificationBellContainer'
import Logo from '@/components/Logo'

interface NavigationItem { name: string
  href: string
  dropdown?: { name: string; href: string }[] }

export default function Header() {
  const router = useRouter()
  const localePath = useLocalizedPath();
  const { data: session, status } = useSession()
  const isAuthLoading = status === 'loading'
  const isOrganizationUser = isOrganization(session)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { unreadCount } = useNotificationContext()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user avatar on mount
  const fetchAvatar = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/profile/image');
      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data?.data?.url || data?.data?.profileImage?.url || null);
      }
    } catch (error) {
      console.error('Failed to fetch avatar:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      void fetchAvatar();
    }
  }, [session?.user?.id, fetchAvatar]);

  // Navigation items with translations
  const navigation: NavigationItem[] = [
    { name: 'Ana Səhifə', href: localePath('/') },
    { name: 'Haqqımızda', href: localePath('/about') },
    { name: 'Bloqlar', href: localePath('/blogs') },
    { name: 'Resurslar', 
      href: localePath('/resources'),
      dropdown: [
        { name: 'Bütün Resurslar', href: localePath('/resources') },
        { name: 'Təşkilatlar', href: localePath('/resources/organizations') },
        { name: 'Tədbirlər', href: localePath('/resources/events') },
        { name: 'Vakansiyalar', href: localePath('/resources/vacancies') },
        { name: 'Materiallar', href: localePath('/resources/materials') }
      ] }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setActiveDropdown(null) } }
    
    if (activeDropdown) { document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside) } }, [activeDropdown])

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between py-2.5 px-4 lg:px-8" aria-label={'Qlobal'}>
        <div className="flex lg:flex-1 lg:justify-start">
          <Logo
            href={localePath('/')}
            className="-m-1.5 p-1.5"
            size="md"
            variant="dark"
            textClassName="hidden sm:flex"
            showTagline={false}
            showText={false}
          />
        </div>
        <div className="flex lg:hidden gap-2 items-center">
          {session && <NotificationBellContainer />}
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-slate-100 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{'Menyunu aç'}</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-0 lg:items-center" ref={dropdownRef}>
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap"
                  >
                    {item.name}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-blue-100">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="px-4 py-2 text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200 whitespace-nowrap"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-2">
          {isAuthLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          ) : session ? (
            <>
              {/* Notifications */}
              <NotificationBellContainer />
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-800 hover:bg-slate-100 transition-colors duration-200 border border-blue-100 whitespace-nowrap"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                    ) : (
                      session.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="max-w-[120px] truncate text-gray-800 font-semibold">{session.user?.name || 'İstifadəçi'}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-50 border border-blue-100 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-blue-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{session.user?.email}</p>
                    </div>
                    {!isOrganizationUser && (
                      <Link
                        href={localePath('/profile')}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {'Mənim Profilim'}
                      </Link>
                    )}
                    {!isOrganizationUser && (
                      <Link
                        href={localePath('/saved')}
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium flex items-center gap-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bookmark className="w-4 h-4" />
                        {'Saxlanılmışlar'}
                      </Link>
                    )}
                    {canAccessAdmin(session) && (
                      <Link
                        href={localePath('/admin')}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {'İdarəetmə Paneli'}
                      </Link>
                    )}
                    {canAccessDashboard(session) && (
                      <Link
                        href={localePath('/dashboard/profile')}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {'Təşkilat Paneli'}
                      </Link>
                    )}
                    {!isOrganizationUser ? (
                      <Link
                        href={localePath('/submit/blog')}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {'Bloq Paylaş'}
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={localePath('/dashboard/events/create')}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {'Tədbir Paylaş'}
                        </Link>
                        <Link
                          href={localePath('/dashboard/vacancies/create')}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {'Vakansiya Paylaş'}
                        </Link>
                      </>
                    )}
                    <div className="border-t border-blue-100">
                      <button
                        onClick={() => {
                          signOut((path) => router.replace(path))
                          setUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 font-medium"
                      >
                        {'Çıxış'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href={localePath('/auth/signin')}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm whitespace-nowrap"
            >
              {'Daxil ol'}
            </Link>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm shadow-md border-l border-blue-100">
            <div className="flex items-center justify-between pb-6 border-b border-blue-100">
              <Logo
                href={localePath('/')}
                className="-m-1.5 p-1.5"
                size="sm"
                variant="dark"
                showTagline={false}
                onClick={() => setMobileMenuOpen(false)}
              />
              <button
                type="button"
                className="-m-2.5 rounded-lg p-2 text-gray-600 hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">{'Menyunu bağla'}</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-blue-100">
                <div className="space-y-1 py-6">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.dropdown ? (
                        <>
                          <Link
                            href={item.href}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <div className="ml-4 space-y-0.5 mt-1">
                            {item.dropdown.slice(1).map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className="-mx-3 block rounded-lg px-4 py-2 text-sm leading-6 text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {dropdownItem.name}
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Mobile User Section */}
                <div className="py-6">
                  {isAuthLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 w-full rounded-lg bg-slate-200 animate-pulse" />
                      <div className="h-12 w-full rounded-lg bg-slate-200 animate-pulse" />
                    </div>
                  ) : session ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-slate-50 rounded-lg border border-blue-100">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                          ) : (
                            session.user?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{session.user?.name}</p>
                          <p className="text-xs text-gray-600">{session.user?.email}</p>
                        </div>
                      </div>
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/profile')}
                          className="-mx-3 flex items-center justify-between rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {'Mənim Profilim'}
                          {unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2.5 py-1 font-bold shadow-md">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      )}
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/saved')}
                          className="-mx-3 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Bookmark className="w-5 h-5 text-gray-500" />
                          {'Saxlanılmışlar'}
                        </Link>
                      )}
                      {canAccessAdmin(session) && (
                        <Link
                          href={localePath('/admin')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {'İdarəetmə Paneli'}
                        </Link>
                      )}
                      {canAccessDashboard(session) && (
                        <Link
                          href={localePath('/dashboard')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {'Təşkilat Paneli'}
                        </Link>
                      )}
                      {!isOrganizationUser ? (
                        <Link
                          href={localePath('/submit/blog')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {'Bloq Paylaş'}
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={localePath('/dashboard/events/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {'Tədbir Paylaş'}
                          </Link>
                          <Link
                            href={localePath('/dashboard/vacancies/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-slate-100 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {'Vakansiya Paylaş'}
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          signOut((path) => router.replace(path))
                          setMobileMenuOpen(false)
                        }}
                        className="-mx-3 block w-full text-left rounded-lg px-4 py-3 text-base font-semibold leading-7 text-red-600 hover:bg-red-50 transition-colors mt-2"
                      >
                        {'Çıxış'}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={localePath('/auth/signin')}
                      className="-mx-3 block rounded-lg px-6 py-4 text-center text-base font-bold leading-7 text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {'Daxil ol'}
                    </Link>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  ) }
