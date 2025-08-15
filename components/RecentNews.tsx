'use client'

import { useEffect, useState } from 'react'

interface Article {
	_id: string
	title: string
	summary?: string
	content: string
	source: string
	sourceUrl: string
	date: string
	tags?: string[]
	category?: string
}

export default function RecentNews() {
	const [articles, setArticles] = useState<Article[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		const load = async () => {
			try {
				setLoading(true)
				setError(null)
				// Add timeout to avoid being stuck on first load (cold start)
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), 10000)
				const res = await fetch('/api/news?limit=3&page=1', { cache: 'no-store', signal: controller.signal })
				clearTimeout(timeoutId)
				if (!res.ok) throw new Error('Failed to load recent news')
				const data = await res.json()
				if (!mounted) return
				setArticles(Array.isArray(data?.results) ? data.results : [])
			} catch (e) {
				if (!mounted) return
				// If aborted due to timeout, show a friendly error
				const message = e instanceof Error ? (e.name === 'AbortError' ? 'Request timed out. Please try again.' : e.message) : 'Failed to load recent news'
				setError(message)
				setArticles([])
			} finally {
				if (mounted) setLoading(false)
			}
		}
		load()
		return () => {
			mounted = false
		}
	}, [])

	return (
			<section className="bg-gray-50 py-16">
			<div className="section-padding">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-8">
							<h2 className="text-3xl lg:text-4xl font-bold text-primary">Recent News</h2>
							<p className="text-gray-600 mt-2">Latest gender-violence related coverage</p>
					</div>

					{loading && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{[1, 2, 3].map((i) => (
									<div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
									<div className="p-6 pt-12">
										<div className="animate-pulse">
												<div className="h-4 bg-gray-200 rounded mb-3"></div>
												<div className="h-6 bg-gray-200 rounded mb-4"></div>
												<div className="h-4 bg-gray-200 rounded mb-2"></div>
												<div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
											<div className="flex justify-between">
													<div className="h-4 bg-gray-200 rounded w-24"></div>
													<div className="h-4 bg-gray-200 rounded w-16"></div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{error && (
						<div className="text-center py-12">
							<div className="max-w-md mx-auto">
									<svg className="w-16 h-16 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
									<p className="text-red-600 text-lg font-medium mb-2">Failed to load news</p>
									<p className="text-gray-500 text-sm">{error}</p>
							</div>
						</div>
					)}

					{!loading && !error && Array.isArray(articles) && articles.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{articles.map((a) => (
									<article key={a._id} className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
									{/* Category Badge */}
									<div className="absolute top-4 left-4 z-10">
											<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
											{a.category ? a.category.replace(/_/g, ' ') : 'gender-violence'}
										</span>
									</div>
									
									{/* External Link Icon */}
									<div className="absolute top-4 right-4 z-10">
										<svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
									</div>

									<div className="p-6 pt-12">
										{/* Date */}
											<div className="flex items-center text-xs text-gray-500 mb-3">
											<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											{new Date(a.date).toLocaleDateString('en-US', { 
												year: 'numeric', 
												month: 'short', 
												day: 'numeric' 
											})}
										</div>

										{/* Title */}
											<h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
											<a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
												{a.title}
											</a>
										</h3>

										{/* Summary */}
											<p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
											{a.summary || (a.content || '').slice(0, 150)}{(a.content || '').length > 150 ? '…' : ''}
										</p>

										{/* Read More Button */}
										<div className="flex items-center justify-between">
											<a 
												href={a.sourceUrl} 
												target="_blank" 
												rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-primary hover:text-red-800 transition-colors duration-200"
											>
												Read Full Article
												<svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</a>
											
											{/* Source */}
												<span className="text-xs text-gray-600">
												{new URL(a.sourceUrl).hostname.replace('www.', '')}
											</span>
										</div>
									</div>
								</article>
							))}
						</div>
					)}

					{!loading && !error && Array.isArray(articles) && articles.length === 0 && (
						<div className="text-center py-12">
							<div className="max-w-md mx-auto">
									<svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
								</svg>
									<p className="text-gray-600 text-lg font-medium mb-2">No recent gender-violence news</p>
									<p className="text-gray-500 text-sm">Check back later for the latest updates.</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	)
}


