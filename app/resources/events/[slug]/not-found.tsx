import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'

export default function EventNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
      <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
        <Calendar className="h-8 w-8" />
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 text-center">
        Tədbir Tapılmadı
      </h1>
      <p className="text-slate-500 font-medium text-center max-w-md mb-8">
        Axtardığınız tədbir mövcud deyil, silinmiş və ya hələ dərc edilməmiş ola bilər.
      </p>
      <Link
        href="/resources/events"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tədbirlərə Qayıt
      </Link>
    </div>
  )
}
