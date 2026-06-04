'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Kritik xəta baş verdi</h2>
          <p className="mt-3 text-base text-slate-600">
            Platformada gözlənilməz xəta baş verdi. Zəhmət olmasa səhifəni yeniləyin.
          </p>
          <button
            onClick={reset}
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
          >
            Yenidən cəhd et
          </button>
        </div>
      </body>
    </html>
  )
}
