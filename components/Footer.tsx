'use client';

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import Logo from './Logo'

export default function Footer() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gray-900 text-white overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* About Section */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <Logo
                href={localePath('/')}
                size="lg"
                variant="light"
                className="inline-flex"
                textClassName="text-left"
                showTagline={false}
              />
            </div>
            <p className="text-gray-300 text-base leading-relaxed mb-8 max-w-md font-normal">
              {t('footer.aboutText')}
            </p>
            <div className="p-5 bg-white/5 rounded-lg border border-white/10">
              <p className="text-gray-400 text-sm leading-relaxed font-normal">
                {t('footer.disclaimerText')}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={localePath('/')} 
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
                >
                  {t('footer.homePage')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
                >
                  {t('footer.opportunities')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/blogs')} 
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
                >
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/submit/blog/step1')} 
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
                >
                  {t('footer.shareExperience')}
                </Link>
              </li>
              <li>
                <Link 
                  href={localePath('/resources')} 
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
                >
                  {t('footer.resources')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support and Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">
              {t('footer.supportContact')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1 font-medium">{t('footer.emergencyHelp')}</p>
                  <p className="text-white font-bold text-lg">112</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1 font-medium">{t('footer.contact')}</p>
                  <a href="mailto:info@icma360.az" className="text-white font-semibold hover:text-blue-400 transition-colors duration-200 text-sm">
                    info@icma360.az
                  </a>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300 font-semibold text-sm">
                  {t('footer.support247')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright and GitHub */}
        <div className="border-t border-white/10 mt-16 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <p className="text-white font-semibold text-sm mb-2">
                © {currentYear} icma360. {t('footer.allRightsReserved')}.
              </p>
              <p className="text-gray-400 text-xs">
                {t('footer.builtWith')} <span className="text-blue-400 font-semibold">Next.js</span> • {t('footer.publicEngagement')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* GitHub Link */}
              <a
                href="https://github.com/hikmet20042/icma360"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300 hover:border-blue-400"
                aria-label="View project on GitHub"
              >
                <svg className="w-6 h-6 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <span className="text-sm font-bold block group-hover:text-blue-400 transition-colors">{t('footer.viewOnGithub')}</span>
                  <span className="text-xs text-gray-500">{t('footer.openSource')}</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
