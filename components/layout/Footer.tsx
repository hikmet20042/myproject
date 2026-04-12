'use client';

import Link from 'next/link'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import Logo from '@/components/Logo'

export default function Footer() {
  const localePath = useLocalizedPath();
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-blue-100 bg-gradient-to-b from-slate-50 via-white to-white text-gray-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute inset-0">
        <div className="absolute -top-24 left-12 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
          <div className="md:col-span-2">
            <div className="mb-5">
              <Logo
                href={localePath('/')}
                size="md"
                variant="dark"
                transparent
                className="inline-flex"
                textClassName="text-left"
                showTagline={false}
                showText={false}
              />
            </div>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
              {'Gənclərin inkişafına, icma əlaqələrinə və sosial təşəbbüslərin dəstəyinə yönəlmiş ictimai platforma.'}
            </p>
            <div className="rounded-xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-5">
              <p className="text-sm leading-relaxed text-gray-600">
                {'Bu platforma maarifləndirmə və ictimai iştirak məqsədilə yaradılmışdır. Bütün məzmun və fürsətlər təsdiqlənmiş ictimai kanallardan və təşkilatlardan əldə edilir.'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-bold text-gray-900">
              {'Sürətli Keçidlər'}
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link 
                  href={localePath('/')} 
                  className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                >
                  {'Ana Səhifə'}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                >
                  {'Fürsətlər'}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/blogs')} 
                  className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                >
                  {'Bloq'}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/submit/blog/step1')} 
                  className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                >
                  {'Təcrübə Paylaş'}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                >
                  {'Resurslar'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-bold text-gray-900">
              {'Dəstək və Əlaqə'}
            </h3>
            <div className="space-y-4">
              <div className="group flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-white/90 p-3 shadow-sm transition-colors hover:border-blue-200 hover:bg-white">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">{'Təcili yardım'}</p>
                  <p className="text-gray-900 font-bold text-lg">112</p>
                </div>
              </div>
              
              <div className="group flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-white/90 p-3 shadow-sm transition-colors hover:border-emerald-200 hover:bg-white">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">{'Əlaqə'}</p>
                  <a href="mailto:info@icma360.az" className="text-sm font-semibold text-gray-900 transition-colors duration-200 hover:text-accent">
                    info@icma360.az
                  </a>
                </div>
              </div>
              
              <div className="mt-5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-emerald-50 p-4">
                <p className="text-sm font-semibold text-gray-700">
                  {'24/7 Dəstək Mövcuddur'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-blue-100 pt-8 sm:mt-14 sm:pt-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
            <div className="text-center md:text-left">
              <p className="mb-1.5 text-sm font-semibold text-gray-900">
                © {currentYear} icma360. {'Bütün hüquqlar qorunur'}.
              </p>
              <p className="text-xs text-gray-500">
                {'Gənclərin inkişafı və icma quruculuğu üçün Next.js ilə hazırlanmışdır.'} <span className="font-semibold text-blue-700">Next.js</span> • {'İctimai İştirak Təşəbbüsü'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hikmet20042/icma360"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md"
                aria-label="Layihəyə GitHub-da bax"
              >
                <svg className="h-5 w-5 text-gray-700 transition-colors group-hover:text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <span className="block text-sm font-bold text-gray-900 transition-colors group-hover:text-blue-700">{'GitHub-da Bax'}</span>
                  <span className="text-xs text-gray-500">{'Açıq Mənbə Layihəsi'}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  ) }
