'use client'

import Link from 'next/link'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { Mail, ArrowUpRight } from 'lucide-react'
import Logo from '@/components/Logo'
import { ButtonLink, SocialLink } from '@/components/ui'

export default function Footer() {
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const isOrganizationUser = session?.user?.accountType === 'organization'
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Platforma',
      links: [
        { label: 'Ana Səhifə', href: localePath('/') },
        { label: 'Fürsətlər', href: localePath('/resources') },
        { label: 'Bloqlar', href: localePath('/blogs') },
        { label: 'Təşkilatlar', href: localePath('/resources/organizations') },
      ],
    },
    {
      title: 'İmkanlar',
      links: [
        { label: 'Tədbirlər', href: localePath('/resources/events') },
        { label: 'Vakansiyalar', href: localePath('/resources/vacancies') },
        { label: 'Hekayəni Paylaş', href: localePath('/submit/blog') },
        { label: 'Dəstək', href: 'mailto:info@icma360.org' },
      ],
    },
  ]

  const socialLinks = [
    { href: '#', platform: 'instagram' as const },
    { href: '#', platform: 'twitter' as const },
    { href: '#', platform: 'linkedin' as const },
    { href: 'https://github.com/hikmet20042/icma360', platform: 'github' as const },
  ]

  return (
    <footer className="relative z-10 bg-white pt-24 pb-12 overflow-hidden border-t border-slate-100">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-50 opacity-70 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-50 opacity-70 blur-[100px]" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          {/* Brand Section */}
          <div className="lg:col-span-5 space-y-8">
            <Logo
              href={localePath('/')}
              size="md"
              variant="dark"
              transparent
              className="inline-flex"
              showText={false}
            />
            <p className="max-w-md text-lg text-slate-600 font-medium leading-relaxed">
              Gənclərin inkişafına, icma əlaqələrinə və sosial təşəbbüslərin dəstəyinə yönəlmiş müasir ictimai platforma.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <SocialLink key={index} platform={social.platform} href={social.href} variant="icon-only" />
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerSections.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-[0.15em]">{section.title}</h3>
                <ul className="space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link 
                        href={link.href} 
                        className="text-slate-500 font-bold hover:text-blue-600 transition-colors flex items-center gap-1 group w-fit"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Card */}
            <div className="col-span-2 md:col-span-1">
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-xl font-black mb-2 relative z-10">Sualın var?</h3>
                <p className="text-sm text-blue-50 font-bold mb-6 relative z-10 opacity-90 leading-relaxed">Bizimlə birbaşa əlaqə qurmaqdan çəkinmə.</p>
                <ButtonLink
                  href="mailto:info@icma360.org"
                  variant="secondary"
                  size="md"
                  className="px-5 py-3 text-sm font-black text-blue-600 hover:scale-105"
                  icon={Mail}
                  iconPosition="left"
                  rounded="xl"
                  shadow="lg"
                  hoverEffect="scale"
                  external
                >
                  E-poçt yaz
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-1.5">
            <p className="text-slate-500 font-bold text-sm">
              © {currentYear} icma360. Bütün hüquqlar qorunur.
            </p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Gənclərin inkişafı və icma quruculuğu üçün <span className="text-slate-900 font-bold">Next.js</span> ilə hazırlanmışdır.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
             <div className="flex items-center gap-6">
                <Link href={localePath('/privacy')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Gizlilik</Link>
                <Link href="#" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Şərtlər</Link>
             </div>
             <div className="h-5 w-px bg-slate-200 hidden sm:block" />
             <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistem Online</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
