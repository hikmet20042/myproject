'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, ChevronDown, ArrowRight } from 'lucide-react'
import { useNotificationContext } from './NotificationContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import NotificationBell from './NotificationBell'

interface NavigationItem {
  name: string
  href: string
  dropdown?: { name: string; href: string }[]
}

export default function Header() {
  const { t, language } = useLanguage();
  const localePath = useLocalizedPath();
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { unreadCount } = useNotificationContext()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Navigation items with translations
  const navigation: NavigationItem[] = [
    { name: t('header.home'), href: localePath('/') },
    { name: t('header.about'), href: localePath('/about') },
    { name: t('header.blogs'), href: localePath('/blogs') },
    { 
      name: t('header.resources'), 
      href: localePath('/resources'),
      dropdown: [
        { name: t('header.allResources'), href: localePath('/resources') },
        { name: t('header.ngos'), href: localePath('/resources/ngos') },
        { name: t('header.events'), href: localePath('/resources/events') },
        { name: t('header.vacancies'), href: localePath('/resources/vacancies') },
        { name: t('header.materials'), href: localePath('/resources/materials') }
      ]
    }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-xl border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 lg:px-8" aria-label={t('titles.global')}>
        <div className="flex lg:flex-1 lg:justify-start">
          <Link href={localePath('/')} className="-m-1.5 p-1.5 group">
            <span className="sr-only">icma360</span>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/logo.png"
                  alt="icma360 Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">icma360</span>
            </div>
          </Link>
        </div>
        <div className="flex lg:hidden gap-3 items-center">
          {session && <NotificationBell />}
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{t('header.openMenu')}</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-8 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2" ref={dropdownRef}>
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    className="flex items-center gap-1.5 text-sm font-semibold leading-6 text-white hover:text-yellow-300 transition-colors duration-200"
                  >
                    {item.name}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
                      {item.dropdown.map((dropdownItem, idx) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 font-medium ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === item.dropdown!.length - 1 ? 'rounded-b-2xl' : ''}`}
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
                  className="text-sm font-semibold leading-6 text-white hover:text-yellow-300 transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-full"></span>
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-3">
          {session ? (
            <>
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notifications */}
              <NotificationBell />
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 transition-all duration-200 hover:scale-105"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-blue-900 font-bold shadow-lg">
                    {session.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <span className="max-w-[100px] truncate">{session.user?.name || 'User'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{session.user?.email}</p>
                    </div>
                    <Link
                      href={localePath('/profile')}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('header.myProfile')}
                    </Link>
                    {session.user?.role === 'admin' && (
                      <Link
                        href={localePath('/admin')}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('header.adminDashboard')}
                      </Link>
                    )}
                    {session.user?.isApprovedNGO && (
                      <Link
                        href={localePath('/dashboard')}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('header.ngoDashboard')}
                      </Link>
                    )}
                    <Link
                      href={localePath('/submit/blog')}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('header.shareBlog')}
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: localePath('/') })
                          setUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-b-2xl font-medium"
                      >
                        {t('header.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              <Link
                href={localePath('/auth/signin')}
                className="group px-6 py-2.5 text-sm font-bold text-blue-900 bg-white rounded-xl hover:bg-yellow-300 hover:text-blue-900 shadow-lg hover:shadow-yellow-300/50 transition-all duration-300 hover:scale-105"
              >
                {t('header.signIn')}
                <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-6 sm:max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-white/20">
              <Link href={localePath('/')} className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <span className="sr-only">icma360</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Image
                      src="/logo.png"
                      alt="icma360 Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>
                  <span className="text-xl font-bold text-white">icma360</span>
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">{t('header.closeMenu')}</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-white/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.dropdown ? (
                        <>
                          <Link
                            href={item.href}
                            className="-mx-3 block rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 backdrop-blur-sm transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <div className="ml-4 space-y-1 mt-1">
                            {item.dropdown.slice(1).map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className="-mx-3 block rounded-lg px-4 py-2.5 text-sm leading-6 text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
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
                          className="-mx-3 block rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 backdrop-blur-sm transition-all"
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
                  {session ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-blue-900 font-bold text-lg shadow-lg">
                          {session.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">{session.user?.name}</p>
                          <p className="text-xs text-white/70">{session.user?.email}</p>
                        </div>
                      </div>
                      <Link
                        href={localePath('/profile')}
                        className="-mx-3 flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.myProfile')}
                        {unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-blue-900 text-xs rounded-full px-2.5 py-1 font-bold shadow-lg">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      {session.user?.role === 'admin' && (
                        <Link
                          href={localePath('/admin')}
                          className="-mx-3 block rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 transition-all"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('header.adminDashboard')}
                        </Link>
                      )}
                      {session.user?.isApprovedNGO && (
                        <Link
                          href={localePath('/dashboard')}
                          className="-mx-3 block rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 transition-all"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('header.ngoDashboard')}
                        </Link>
                      )}
                      <Link
                        href={localePath('/submit/blog')}
                        className="-mx-3 block rounded-xl px-4 py-3 text-base font-bold leading-7 text-white hover:bg-white/10 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.shareBlog')}
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: localePath('/') })
                          setMobileMenuOpen(false)
                        }}
                        className="-mx-3 block w-full text-left rounded-xl px-4 py-3 text-base font-bold leading-7 text-red-400 hover:bg-red-500/10 transition-all mt-2"
                      >
                        {t('header.signOut')}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={localePath('/auth/signin')}
                      className="-mx-3 block rounded-2xl px-6 py-4 text-center text-base font-bold leading-7 text-blue-900 bg-white hover:bg-yellow-300 hover:text-blue-900 shadow-lg hover:shadow-yellow-300/50 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('header.signIn')}
                    </Link>
                  )}
                  
                  {/* Language Switcher at bottom */}
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
