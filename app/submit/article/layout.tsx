import Link from 'next/link'

export default function ArticleSubmissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
  <section className="bg-primary text-white py-10">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold">Submit Article</h1>
            <p className="text-gray-100 mt-2">Two steps: details and content.</p>
            <div className="mt-6 flex items-center gap-3 text-sm">
              <Link href="/submit/article/step1" className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">1. Details</Link>
              <span>→</span>
              <Link href="/submit/article/step2" className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">2. Write</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-10">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow p-6">
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


