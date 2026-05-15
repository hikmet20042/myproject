'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from '@/lib/auth/client'
import { canAccessAdmin, canAccessDashboard, isOrganization } from '@/lib/auth/permissions'
import { Menu, X, User, ChevronDown, Bookmark, Search } from 'lucide-react'
import { useNotificationContext } from '@/features/notifications/context/NotificationContext'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import NotificationBellContainer from '@/features/notifications/components/NotificationBellContainer'
import { useGlobalSearch } from '@/features/search/hooks/useGlobalSearch'
import { SearchSuggestions } from '@/features/search/components/SearchSuggestions'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

interface NavigationItem {
  name: string
  href: string
  dropdown?: { name: string; href: string }[]
}

type HeaderSearchBoxProps = {
  placeholder: string
  onNavigate?: () => void
  showSubmitButton?: boolean
  submitButtonLabel?: string
  wrapperClassName?: string
  inputShellClassName?: string
  inputClassName?: string
  dropdownClassName?: string
  submitButtonClassName?: string
}

function HeaderSearchBox({
  placeholder,
  onNavigate,
  showSubmitButton = false,
  submitButtonLabel = 'Axtar',
  wrapperClassName,
  inputShellClassName,
  inputClassName,
  dropdownClassName,
  submitButtonClassName,
}: HeaderSearchBoxProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { items, loading } = useGlobalSearch({
    query,
    enabled: open && query.trim().length > 0,
    limit: 8,
    debounceMs: 220,
  })

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const navigateToSearch = useCallback(
    (rawQuery?: string) => {
      const normalized = (rawQuery ?? query).trim()
      if (!normalized) return

      router.push(localePath(`/search?q=${encodeURIComponent(normalized)}`))
      setOpen(false)
      onNavigate?.()
    },
    [localePath, onNavigate, query, router],
  )

  return (
    <div ref={rootRef} className={cn('relative', wrapperClassName)}>
      <div className={cn(showSubmitButton && 'flex items-center gap-2')}>
        <div className={cn('relative flex-1', inputShellClassName)}>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                navigateToSearch()
              }
              if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-xl border border-blue-100 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
              inputClassName,
            )}
          />
        </div>
        {showSubmitButton && (
          <button
            type="button"
            onClick={() => navigateToSearch()}
            className={cn(
              'rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700',
              submitButtonClassName,
            )}
          >
            {submitButtonLabel}
          </button>
        )}
      </div>

      {open && (
        <SearchSuggestions
          items={items}
          loading={loading}
          query={query}
          onItemSelect={() => {
            setOpen(false)
            onNavigate?.()
          }}
          onViewAll={() => navigateToSearch()}
          className={dropdownClassName}
        />
      )}
    </div>
  )
}

export default function Header() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const isAuthLoading = status === 'loading'
  const isOrganizationUser = isOrganization(session)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { unreadCount } = useNotificationContext()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const fetchAvatar = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/profile/image')
      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data?.data?.url || data?.data?.profileImage?.url || null)
      }
    } catch (error) {
      console.error('Failed to fetch avatar:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      void fetchAvatar()
    }
  }, [fetchAvatar, session?.user?.id])

  const navigation: NavigationItem[] = [
    { name: 'Haqqımızda', href: localePath('/about') },
    { name: 'Bloqlar', href: localePath('/blogs') },
    {
      name: 'Resurslar',
      href: localePath('/resources'),
      dropdown: [
        { name: 'Bütün Resurslar', href: localePath('/resources') },
        { name: 'Təşkilatlar', href: localePath('/resources/organizations') },
        { name: 'Tədbirlər', href: localePath('/resources/events') },
        { name: 'Vakansiyalar', href: localePath('/resources/vacancies') },
        { name: 'Materiallar', href: localePath('/resources/materials') },
      ],
    },
  ]

  useEffect(() => {
    if (!activeDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 lg:px-8" aria-label="Qlobal">
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

        <div className="flex items-center gap-2 lg:hidden">
          {session && <NotificationBellContainer />}
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors duration-200 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Menyunu aç</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-x-0" ref={dropdownRef}>
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-semibold text-gray-800 transition-colors duration-200 hover:text-blue-600"
                  >
                    {item.name}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        activeDropdown === item.name && 'rotate-180',
                      )}
                    />
                  </button>
                  {activeDropdown === item.name && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-blue-100 bg-white py-1 shadow-lg">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
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
                  className="whitespace-nowrap px-4 py-2 text-sm font-semibold text-gray-800 transition-colors duration-200 hover:text-blue-600"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mx-4 hidden w-[320px] lg:flex">
          <HeaderSearchBox
            placeholder="Qlobal axtarış..."
            wrapperClassName="w-full"
            inputClassName="py-2 pl-9 pr-3"
          />
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-2">
          {isAuthLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
            </div>
          ) : session ? (
            <>
              <NotificationBellContainer />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-100 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors duration-200 hover:bg-slate-100"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-md">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Profil şəkli" fill className="object-cover" />
                    ) : (
                      session.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="sr-only">{session.user?.name || 'İstifadəçi'}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-gray-500 transition-transform duration-200',
                      userMenuOpen && 'rotate-180',
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-blue-100 bg-white py-1 shadow-lg">
                    <div className="border-b border-blue-100 bg-slate-50 px-4 py-3">
                      <p className="truncate text-sm font-bold text-gray-900">{session.user?.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-600">{session.user?.email}</p>
                    </div>
                    {!isOrganizationUser && (
                      <Link
                        href={localePath('/profile')}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mənim Profilim
                      </Link>
                    )}
                    {!isOrganizationUser && (
                      <Link
                        href={localePath('/saved')}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bookmark className="h-4 w-4" />
                        Saxlanılmışlar
                      </Link>
                    )}
                    {canAccessAdmin(session) && (
                      <Link
                        href={localePath('/admin')}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        İdarəetmə Paneli
                      </Link>
                    )}
                    {canAccessDashboard(session) && (
                      <Link
                        href={localePath('/dashboard')}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Təşkilat Paneli
                      </Link>
                    )}
                    {!isOrganizationUser ? (
                      <Link
                        href={localePath('/submit/blog')}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Bloq Paylaş
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={localePath('/dashboard/events/create')}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Tədbir Paylaş
                        </Link>
                        <Link
                          href={localePath('/dashboard/vacancies/create')}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Vakansiya Paylaş
                        </Link>
                      </>
                    )}
                    <div className="border-t border-blue-100">
                      <button
                        onClick={() => {
                          signOut((path) => router.replace(path))
                          setUserMenuOpen(false)
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
                      >
                        Çıxış
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href={localePath('/auth/signin')}
              className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700"
            >
              Daxil ol
            </Link>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-blue-100 bg-white px-6 py-6 shadow-md sm:max-w-sm">
            <div className="flex items-center justify-between border-b border-blue-100 pb-6">
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
                className="-m-2.5 rounded-lg p-2 text-gray-600 transition-colors hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Menyunu bağla</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-blue-100">
                <div className="py-6">
                  <HeaderSearchBox
                    placeholder="Axtarış..."
                    showSubmitButton
                    onNavigate={() => setMobileMenuOpen(false)}
                    submitButtonLabel="Axtar"
                    wrapperClassName="w-full"
                  />
                </div>

                <div className="space-y-1 py-6">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.dropdown ? (
                        <>
                          <Link
                            href={item.href}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <div className="ml-4 mt-1 space-y-0.5">
                            {item.dropdown.slice(1).map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className="-mx-3 block rounded-lg px-4 py-2 text-sm font-medium leading-6 text-gray-600 transition-colors hover:bg-slate-100 hover:text-gray-900"
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
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                <div className="py-6">
                  {isAuthLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
                      <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
                    </div>
                  ) : session ? (
                    <div className="space-y-2">
                      <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-100 bg-slate-50 px-4 py-4">
                        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-md">
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt="Profil şəkli" fill className="object-cover" />
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
                          className="-mx-3 flex items-center justify-between rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Mənim Profilim
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      )}
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/saved')}
                          className="-mx-3 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Bookmark className="h-5 w-5 text-gray-500" />
                          Saxlanılmışlar
                        </Link>
                      )}
                      {canAccessAdmin(session) && (
                        <Link
                          href={localePath('/admin')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          İdarəetmə Paneli
                        </Link>
                      )}
                      {canAccessDashboard(session) && (
                        <Link
                          href={localePath('/dashboard')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Təşkilat Paneli
                        </Link>
                      )}
                      {!isOrganizationUser ? (
                        <Link
                          href={localePath('/submit/blog')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Bloq Paylaş
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={localePath('/dashboard/events/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Tədbir Paylaş
                          </Link>
                          <Link
                            href={localePath('/dashboard/vacancies/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-gray-900 transition-colors hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Vakansiya Paylaş
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          signOut((path) => router.replace(path))
                          setMobileMenuOpen(false)
                        }}
                        className="-mx-3 mt-2 block w-full rounded-lg px-4 py-3 text-left text-base font-semibold leading-7 text-red-600 transition-colors hover:bg-red-50"
                      >
                        Çıxış
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={localePath('/auth/signin')}
                      className="-mx-3 block rounded-lg bg-blue-600 px-6 py-4 text-center text-base font-bold leading-7 text-white transition-colors duration-200 hover:bg-blue-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Daxil ol
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
