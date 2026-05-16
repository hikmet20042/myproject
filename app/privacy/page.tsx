'use client'

import { Shield, Lock, Eye, FileText, Mail, Bell } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Badge } from '@/components/ui/Badge'

export default function PrivacyPolicyPage() {
  const localePath = useLocalizedPath()
  const lastUpdated = '21 aprel 2026'

  const sections = [
    {
      icon: Eye,
      title: 'Topladığımız məlumatlar',
      content: 'icma360 platformasında qeydiyyatdan keçərkən və ya resurslardan istifadə edərkən sizdən ad, soyad, e-poçt ünvanı və (təşkilatlar üçün) təşkilat məlumatlarını toplayırıq. Həmçinin, platformada paylaşdığınız bloq yazıları, vakansiyalar və tədbirlər sistemimizdə saxlanılır.',
    },
    {
      icon: Lock,
      title: 'Məlumatların istifadəsi',
      content: 'Toplanmış məlumatlar sizə uyğun fürsətləri (vakansiya və tədbir) göstərmək, təşkilatlarla əlaqə qurmağınıza kömək etmək və icma daxilindəki fəallığınızı artırmaq üçün istifadə olunur. Biz sizin şəxsi məlumatlarınızı heç bir üçüncü tərəfə reklam məqsədilə satmırıq.',
    },
    {
      icon: Shield,
      title: 'Təhlükəsizlik',
      content: 'Məlumatlarınızın təhlükəsizliyi bizim üçün prioritetdir. Şifrələriniz və şəxsi yazışmalarınız müasir kriptoqrafik üsullarla qorunur. Lakin unutmayın ki, internet üzərindən heç bir ötürülmə metodu 100% təhlükəsiz deyil.',
    },
    {
      icon: Bell,
      title: 'Çərəzlər (Cookies)',
      content: 'Platformanın performansını artırmaq və sizin seçimlərinizi (məsələn, dil seçimi və ya yadda saxlanılan elanlar) xatırlamaq üçün çərəzlərdən istifadə edirik. Siz brauzer ayarlarından çərəzləri söndürə bilərsiniz.',
    },
    {
      icon: FileText,
      title: 'İstifadəçi hüquqları',
      content: 'Siz istənilən vaxt şəxsi məlumatlarınızı redaktə edə, profilinizi silə və ya məlumatlarınızın nüsxəsini tələb edə bilərsiniz. Bunun üçün profil tənzimləmələrinə daxil olmaq və ya bizimlə əlaqə saxlamaq kifayətdir.',
    },
    {
      icon: Mail,
      title: 'Bizimlə əlaqə',
      content: 'Məxfilik siyasəti ilə bağlı hər hansı sualınız və ya təklifiniz olarsa, zəhmət olmasa info@icma360.org ünvanına yazın.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Decoration */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100 pt-32 pb-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-50 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-50 blur-[120px]" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge variant="primary" className="gap-2 bg-blue-50 px-4 py-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-6" icon={Shield}>
            Məxfilik və Təhlükəsizlik
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Məxfilik Siyasəti
          </h1>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
            icma360 olaraq şəxsi məlumatlarınızın qorunmasına və şəffaflığa ciddi yanaşırıq. Bu sənəd məlumatlarınızın necə toplandığını və istifadə edildiyini izah edir.
          </p>
          <div className="mt-8 text-sm text-slate-400 font-medium">
            Son yenilənmə: <span className="text-slate-900">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Policy Content */}
      <section className="py-24 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2">
            {sections.map((section, index) => (
              <Card key={index} className="p-10 transition-all hover:shadow-xl hover:shadow-slate-200/200 hover:-translate-y-1" interactive>
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <section.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{section.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {section.content}
                </p>
              </Card>
            ))}
          </div>

          {/* Additional Info Box */}
          <div className="mt-16 p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full" />
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl text-center md:text-left">
                   <h2 className="text-3xl font-black mb-4">Şəffaflığa sadiqik</h2>
                   <p className="text-slate-400 font-bold leading-relaxed">
                     Sizin məlumatlarınız platformanın yalnız ictimai fayda və gənclərin inkişafı məqsədilə istifadə olunmasını təmin edir. Şəxsi məlumatlarınızı heç vaxt kommersiya məqsədilə paylaşmırıq.
                   </p>
                </div>
                <ButtonLink
                  href={localePath('/')}
                  variant="white-on-dark"
                  size="lg"
                  className="px-8 py-4 rounded-2xl hover:scale-105"
                >
                  Ana səhifəyə dön
                </ButtonLink>
             </div>
          </div>
        </div>
      </section>
    </div>
  )
}
