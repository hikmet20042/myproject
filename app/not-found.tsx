import { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui'
import { Sparkles, ArrowLeft, BookOpen, Briefcase, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Səhifə Tapılmadı | icma360',
  description: 'Axtardığınız səhifə tapılmadı. Əsas səhifəyə qayıdın və ya imkanları kəşf edin.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4 py-20">
      {/* 404 Number */}
      <div className="relative mb-8">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 leading-none">
          404
        </h1>
        <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-blue-600 to-emerald-600 -z-10 rounded-full" />
      </div>

      {/* Message */}
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 text-center">
        Səhifə Tapılmadı
      </h2>
      <p className="text-lg text-slate-500 font-medium max-w-md text-center mb-12 leading-relaxed">
        Axtardığınız səhifə mövcud deyil, silinmiş və ya köçürülmüş ola bilər. Narahat olmayın — sizi gözləyən fürsətlər var.
      </p>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mb-12">
        <Link
          href="/resources/vacancies"
          className="group flex items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">Vakansiyalar</p>
            <p className="text-xs text-slate-500">İş imkanları</p>
          </div>
        </Link>

        <Link
          href="/resources/events"
          className="group flex items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">Tədbirlər</p>
            <p className="text-xs text-slate-500">Yaxınlaşan tədbirlər</p>
          </div>
        </Link>

        <Link
          href="/blogs"
          className="group flex items-center gap-3 p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">Bloqlar</p>
            <p className="text-xs text-slate-500">İcma hekayələri</p>
          </div>
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ButtonLink
          href="/"
          variant="white-on-dark"
          size="lg"
          className="rounded-2xl px-8"
          icon={ArrowLeft}
          iconPosition="left"
        >
          Ana Səhifəyə Qayıt
        </ButtonLink>
        <ButtonLink
          href="/resources"
          variant="outline"
          size="lg"
          className="rounded-2xl px-8"
          icon={Sparkles}
          iconPosition="right"
        >
          İmkanları Kəşf Et
        </ButtonLink>
      </div>
    </div>
  )
}
