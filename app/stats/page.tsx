'use client';

export default function StatsPage() {
  return (
    <section className="bg-white min-h-screen flex items-center justify-center transition-colors duration-200">
      <div className="max-w-lg w-full mx-auto px-6 py-12 bg-primary/95 rounded-2xl shadow-xl border border-red-600 text-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-16 h-16 text-white mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Statistics</h1>
          <p className="text-lg text-white/90 mb-4">This section is coming soon.<br/>We’re working hard to bring you insightful data and visualizations.</p>
          <span className="inline-block bg-white text-primary font-semibold px-4 py-2 rounded-lg shadow-sm animate-pulse">Stay tuned!</span>
        </div>
      </div>
    </section>
  );
}
