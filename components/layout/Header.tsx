'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from '@/lib/auth/client'
import { useAccountType } from '@/hooks/useAccountType'
import { canAccessAdmin, canAccessDashboard, isOrganization } from '@/lib/auth/permissions'
import { Menu, X, User, ChevronDown, Bookmark, Search } from 'lucide-react'
import { useNotificationContext } from '@/features/notifications/context/NotificationContext'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import NotificationBellContainer from '@/features/notifications/components/NotificationBellContainer'
import { useGlobalSearch } from '@/features/search/hooks/useGlobalSearch'
import { SearchSuggestions } from '@/features/search/components/SearchSuggestions'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { emitGlobalFeedback } from '@/hooks/useGlobalFeedback'
import Logo from '@/components/Logo'
import { ButtonLink, Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-searches')
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [])

  const { items, loading } = useGlobalSearch({
    query,
    enabled: open && query.trim().length > 0,
    limit: 8,
    debounceMs: 200,
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

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [items, loading])

  const saveRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recent-searches', JSON.stringify(updated))
    } catch {}
  }, [recentSearches])

  const navigateToSearch = useCallback(
    (rawQuery?: string) => {
      const normalized = (rawQuery ?? query).trim()
      if (!normalized) return

      saveRecentSearch(normalized)
      router.push(localePath(`/search?q=${encodeURIComponent(normalized)}`))
      setOpen(false)
      setQuery('')
      onNavigate?.()
    },
    [localePath, onNavigate, query, router, saveRecentSearch],
  )

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const maxIndex = items.length - 1

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, maxIndex))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < items.length) {
        const item = items[highlightedIndex]
        saveRecentSearch(query)
        router.push(localePath(item.href))
        setOpen(false)
        setQuery('')
        onNavigate?.()
      } else {
        navigateToSearch()
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={rootRef} className={cn('relative', wrapperClassName)}>
      <div className={cn(showSubmitButton && 'flex items-center gap-2')}>
        <div className={cn('relative flex-1', inputShellClassName)}>
          <Input
            ref={inputRef}
            icon={Search}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-md border border-slate-200 bg-white py-3 pl-10 pr-10 text-base font-medium text-slate-900 shadow-card focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
              inputClassName,
            )}
            inputSize="lg"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              aria-label="Təmizlə"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {showSubmitButton && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateToSearch()}
            className="px-4 py-3 text-sm font-black"
          >
            {submitButtonLabel}
          </Button>
        )}
      </div>

      {open && (
        <SearchSuggestions
          items={items}
          loading={loading}
          query={query}
          highlightedIndex={highlightedIndex}
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
  const accountType = useAccountType()
  const isAuthLoading = status === 'loading'
  const isOrganizationUser = accountType === 'organization'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { unreadCount } = useNotificationContext()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
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
      emitGlobalFeedback('error', 'Profil şəkli yüklənə bilmədi')
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

  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[300px] h-[300px] rounded-full bg-blue-50/50 opacity-50 blur-[80px]" />
        <div className="absolute top-0 left-[10%] w-[200px] h-[200px] rounded-full bg-indigo-50/50 opacity-50 blur-[60px]" />
      </div>
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8" aria-label="Qlobal">
        <div className="flex lg:mr-4 lg:justify-start">
          <Logo
            href={localePath('/')}
            className="-m-1.5 p-1.5"
            size="lg"
            variant="dark"
            textClassName="hidden sm:flex"
            showTagline={false}
            showText={false}
          />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {session && <NotificationBellContainer />}
          <Button
            variant="ghost"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl"
          >
            <span className="sr-only">Menyunu aç</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-x-0" ref={dropdownRef}>
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(activeDropdown === item.name ? null : item.name)
                      if (activeDropdown !== item.name) setUserMenuOpen(false)
                    }}
                    className="whitespace-nowrap px-4 py-2 text-base font-black text-slate-800 transition-all duration-200 hover:text-blue-600 inline-flex items-center gap-1.5"
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
                    <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-blue-100 bg-white shadow-md shadow-slate-200/50">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
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
                  className="whitespace-nowrap px-4 py-2 text-base font-black text-slate-800 transition-all duration-200 hover:text-blue-600"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mx-4 hidden lg:flex lg:basis-[42rem] lg:flex-1">
          <HeaderSearchBox
            placeholder="Qlobal axtarış..."
            wrapperClassName="w-full"
            inputClassName="py-3 pl-10 pr-3.5"
          />
        </div>

        <div className="hidden lg:flex lg:items-center lg:justify-end lg:gap-x-2">
          {isAuthLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200" />
            </div>
          ) : session ? (
            <>
              <NotificationBellContainer />
              <div className="relative" ref={profileMenuRef}>
                <Button
                    variant="outline"
                    onClick={() => {
                      setActiveDropdown(null)
                      setUserMenuOpen((prev) => !prev)
                    }}
                    className="gap-2 rounded-full px-3 py-2 text-base font-semibold"
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-md">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Profil şəkli" fill className="object-cover" />
                      ) : (
                        session.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="sr-only">{session.user?.name || 'İstifadəçi'}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-slate-500 transition-transform duration-200',
                        userMenuOpen && 'rotate-180',
                      )}
                    />
                  </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-blue-100 bg-white shadow-md shadow-slate-200/50 flex flex-col">
                    <div className="border-b border-blue-100 bg-slate-50 px-4 py-3 rounded-t-lg">
                      <p className="truncate text-base font-semibold text-gray-900">{session.user?.name}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-600">{session.user?.email}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-80">
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/profile')}
                          className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                          }}
                        >
                          Mənim Profilim
                        </Link>
                      )}
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/saved')}
                          className="flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                          }}
                        >
                          <Bookmark className="h-4 w-4" />
                          Saxlanılmışlar
                        </Link>
                      )}
                      {canAccessAdmin(session) && (
                        <Link
                          href={localePath('/admin')}
                          className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                          }}
                        >
                          İdarəetmə Paneli
                        </Link>
                      )}
                      {canAccessDashboard(session) && (
                        <Link
                          href={localePath('/dashboard')}
                          className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                          }}
                        >
                          Təşkilat Paneli
                        </Link>
                      )}
                      {!isOrganizationUser ? (
                        <Link
                          href={localePath('/submit/blog')}
                          className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                          }}
                        >
                          Bloq Paylaş
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={localePath('/dashboard/events/create')}
                            className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setActiveDropdown(null)
                              setUserMenuOpen(false)
                            }}
                          >
                            Tədbir Paylaş
                          </Link>
                          <Link
                            href={localePath('/dashboard/vacancies/create')}
                            className="block px-4 py-2.5 text-base font-semibold text-slate-900 transition-all duration-150 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setActiveDropdown(null)
                              setUserMenuOpen(false)
                            }}
                          >
                            Vakansiya Paylaş
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="border-t border-slate-100">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActiveDropdown(null)
                          setUserMenuOpen(false)
                          signOut((path) => router.replace(path))
                        }}
                        className="w-full px-4 py-2.5 text-left text-base font-semibold text-red-600 hover:bg-red-50"
                      >
                        Çıxış
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <ButtonLink
              href={localePath('/auth/signin')}
              variant="primary"
              size="lg"
            >
              Daxil ol
            </ButtonLink>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-slate-100 bg-white px-6 py-6 sm:max-w-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <Logo
                href={localePath('/')}
                className="-m-1.5 p-1.5"
                size="sm"
                variant="dark"
                showTagline={false}
                onClick={() => setMobileMenuOpen(false)}
              />
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl"
              >
                <span className="sr-only">Menyunu bağla</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-slate-100">
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
                            className="-mx-3 block rounded-xl px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <div className="ml-4 mt-1 space-y-0.5">
                            {item.dropdown.slice(1).map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className="-mx-3 block rounded-xl px-4 py-2 text-sm font-bold leading-6 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
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
                          className="-mx-3 block rounded-xl px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-slate-50"
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
                      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
                      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
                    </div>
                   ) : session ? (
                    <div className="space-y-2">
                      <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-100 bg-slate-50 px-4 py-3">
                          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-semibold text-white shadow-md">
                            {avatarUrl ? (
                              <Image src={avatarUrl} alt="Profil şəkli" fill className="object-cover" />
                            ) : (
                              session.user?.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                            <p className="text-xs text-slate-600">{session.user?.email}</p>
                          </div>
                        </div>
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/profile')}
                          className="-mx-3 flex items-center justify-between rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                        >
                          Mənim Profilim
                          {unreadCount > 0 && (
                            <Badge variant="primary" size="sm">{unreadCount}</Badge>
                          )}
                        </Link>
                      )}
                      {!isOrganizationUser && (
                        <Link
                          href={localePath('/saved')}
                          className="-mx-3 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                        >
                          <Bookmark className="h-5 w-5 text-slate-500" />
                          Saxlanılmışlar
                        </Link>
                      )}
                      {canAccessAdmin(session) && (
                        <Link
                          href={localePath('/admin')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                        >
                          İdarəetmə Paneli
                        </Link>
                      )}
                      {canAccessDashboard(session) && (
                        <Link
                          href={localePath('/dashboard')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                        >
                          Təşkilat Paneli
                        </Link>
                      )}
                      {!isOrganizationUser ? (
                        <Link
                          href={localePath('/submit/blog')}
                          className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            setActiveDropdown(null)
                            setUserMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                        >
                          Bloq Paylaş
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={localePath('/dashboard/events/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setActiveDropdown(null)
                              setUserMenuOpen(false)
                              setMobileMenuOpen(false)
                            }}
                          >
                            Tədbir Paylaş
                          </Link>
                          <Link
                            href={localePath('/dashboard/vacancies/create')}
                            className="-mx-3 block rounded-lg px-4 py-3 text-base font-semibold leading-7 text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => {
                              setActiveDropdown(null)
                              setUserMenuOpen(false)
                              setMobileMenuOpen(false)
                            }}
                          >
                            Vakansiya Paylaş
                          </Link>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActiveDropdown(null)
                          setUserMenuOpen(false)
                          setMobileMenuOpen(false)
                          signOut((path) => router.replace(path))
                        }}
                        className="-mx-3 mt-2 block w-full px-4 py-3 text-left text-base font-semibold leading-7 text-red-600 hover:bg-red-50"
                      >
                        Çıxış
                      </Button>
                    </div>
                  ) : (
                    <ButtonLink
                      href={localePath('/auth/signin')}
                      variant="primary"
                      size="lg"
                      className="-mx-3 block px-6 py-4 text-base font-black leading-7"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Daxil ol
                    </ButtonLink>
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
