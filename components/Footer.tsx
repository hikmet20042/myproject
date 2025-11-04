'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

export default function Footer() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white overflow-hidden">
      {/* Animated Background Elements - matching homepage */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* About Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                <Image
                  src="/logo.png"
                  alt="icma360 Logo"
                  width={36}
                  height={36}
                  className="rounded"
                />
              </div>
              <span className="text-3xl font-black">icma360</span>
            </div>
            <p className="text-white/90 text-lg leading-relaxed mb-8 max-w-md font-medium">
              {t('footer.aboutText')}
            </p>
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <p className="text-white/90 text-sm leading-relaxed font-medium">
                {t('footer.disclaimerText')}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-yellow-300 rounded-full shadow-lg"></span>
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={localePath('/')} 
                  className="text-white/90 hover:text-yellow-300 transition-all duration-200 text-base flex items-center gap-2 group font-medium"
                >
                  <span className="w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-6 shadow-lg"></span>
                  {t('footer.homePage')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-white/90 hover:text-yellow-300 transition-all duration-200 text-base flex items-center gap-2 group font-medium"
                >
                  <span className="w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-6 shadow-lg"></span>
                  {t('footer.opportunities')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/blogs')} 
                  className="text-white/90 hover:text-yellow-300 transition-all duration-200 text-base flex items-center gap-2 group font-medium"
                >
                  <span className="w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-6 shadow-lg"></span>
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/submit/blog/step1')} 
                  className="text-white/90 hover:text-yellow-300 transition-all duration-200 text-base flex items-center gap-2 group font-medium"
                >
                  <span className="w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-6 shadow-lg"></span>
                  {t('footer.shareExperience')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-white/90 hover:text-yellow-300 transition-all duration-200 text-base flex items-center gap-2 group font-medium"
                >
                  <span className="w-0 h-0.5 bg-yellow-300 transition-all duration-200 group-hover:w-6 shadow-lg"></span>
                  {t('footer.resources')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support and Contact */}
          <div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-yellow-300 rounded-full shadow-lg"></span>
              {t('footer.supportContact')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1 font-medium">{t('footer.emergencyHelp')}</p>
                  <p className="text-white font-black text-2xl">112</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1 font-medium">{t('footer.contact')}</p>
                  <a href="mailto:info@icma360.az" className="text-white font-bold hover:text-yellow-300 transition-colors duration-200 text-base">
                    info@icma360.az
                  </a>
                </div>
              </div>
              
              <div className="mt-6 p-5 bg-gradient-to-br from-yellow-300/20 to-yellow-500/10 backdrop-blur-md rounded-2xl border border-yellow-300/30 shadow-xl">
                <p className="text-white font-bold text-base">
                  {t('footer.support247')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright and GitHub */}
        <div className="border-t border-white/20 mt-16 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <p className="text-white font-bold text-base mb-2">
                © {currentYear} icma360. {t('footer.allRightsReserved')}.
              </p>
              <p className="text-white/70 text-sm">
                {t('footer.builtWith')} <span className="text-yellow-300 font-semibold">Next.js</span> • {t('footer.publicEngagement')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* GitHub Link */}
              <a
                href="https://github.com/hikmet20042/icma360"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                aria-label="View project on GitHub"
              >
                <svg className="w-8 h-8 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <span className="text-base font-bold block group-hover:text-yellow-300 transition-colors">{t('footer.viewOnGithub')}</span>
                  <span className="text-xs text-white/70">{t('footer.openSource')}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
