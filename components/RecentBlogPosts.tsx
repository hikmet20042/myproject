'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CommunityStory {
	id: number
	title: string
	author: string
	date: string
	excerpt: string
	content: string
	tags: string[]
	status: string
	type: 'community-story'
}

interface ResearchArticle {
	id: number
	title: string
	author: string
	date: string
	excerpt: string
	content: string
	tags: string[]
	status: string
	type: 'research-article'
	references?: string[]
	abstract?: string
}

export default function RecentCommunityContent() {
	const [stories, setStories] = useState<CommunityStory[]>([])
	const [articles, setArticles] = useState<ResearchArticle[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			try {
				setLoading(true);
				// Fetch recent stories from MongoDB
				const storiesRes = await fetch('/api/stories?page=1&limit=3');
				if (storiesRes.ok) {
					const data = await storiesRes.json();
					const publishedStories = (data.results || []).filter((story: any) => story.status === 'published');
					if (mounted) {
						setStories(publishedStories.map((story: any) => ({
							id: story._id || story.id,
							title: story.title,
							author: story.author,
							date: story.submittedAt || story.date || new Date().toISOString(),
							excerpt: story.excerpt || (story.content || '').split(' ').slice(0, 30).join(' ') + '...',
							content: story.content,
							tags: story.tags || [],
							status: story.status,
							type: 'community-story'
						})));
					}
				}
				// Fetch recent articles from MongoDB
				const articlesRes = await fetch('/api/articles?page=1&limit=3');
				if (articlesRes.ok) {
					const data = await articlesRes.json();
					const publishedArticles = (data.results || []).filter((article: any) => article.status === 'published');
					if (mounted) {
						setArticles(publishedArticles.map((article: any) => ({
							id: article._id || article.id,
							title: article.title,
							author: article.author,
							date: article.publishedAt || article.date || new Date().toISOString(),
							excerpt: article.excerpt || (article.content || '').split(' ').slice(0, 30).join(' ') + '...',
							content: article.content,
							tags: article.tags || [],
							status: article.status,
							type: 'research-article',
							references: article.references || [],
							abstract: article.abstract || ''
						})));
					}
				}
			} catch (error) {
				console.error('Failed to load content:', error);
			} finally {
				if (mounted) setLoading(false);
			}
		};
		load();
		return () => { mounted = false };
	}, []);

	const allContent = [...stories, ...articles].sort((a, b) => 
		new Date(b.date).getTime() - new Date(a.date).getTime()
	).slice(0, 3)

	return (
		<section className="bg-white py-16">
			<div className="section-padding">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-8">
						   <h2 className="text-3xl lg:text-4xl font-bold text-primary">Recent Community Content</h2>
						   <p className="text-gray-600 mt-2">Stories and research from our community</p>
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

					{!loading && allContent.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{allContent.map((item) => (
								   <article key={item.id} className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
									{/* Content Type Badge */}
									<div className="absolute top-4 left-4 z-10">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.type === 'community-story'
														? 'bg-red-100 text-red-800'
														: 'bg-red-100 text-red-800'
                                                }`}>
											{item.type === 'community-story' ? 'Personal Story' : 'Research'}
										</span>
									</div>

									{/* Status Badge */}
									{item.status && (
										<div className="absolute top-4 right-4 z-10">
											<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
												item.status === 'published' 
													   ? 'bg-green-100 text-green-800'
													   : 'bg-yellow-100 text-yellow-800'
											}`}>
												{item.status}
											</span>
										</div>
									)}

									<div className="p-6 pt-12">
										{/* Date */}
										   <div className="flex items-center text-xs text-gray-500 mb-3">
											<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											{new Date(item.date).toLocaleDateString('en-US', { 
												year: 'numeric', 
												month: 'short', 
												day: 'numeric' 
											})}
										</div>

										{/* Title */}
										   <h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
											<a href={item.type === 'community-story' ? `/stories/${item.id}` : `/articles/${item.id}`} className="block">
												{item.title}
											</a>
										</h3>

										{/* Content Preview */}
										   <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
											{item.excerpt || (item.content || '').slice(0, 150)}{(item.content || '').length > 150 ? '…' : ''}
										</p>

										{/* Tags */}
										{item.tags && item.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 mb-4">
												{item.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
													<span key={tagIdx} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
														item.type === 'community-story'
															? 'bg-red-50 text-red-700'
															: 'bg-red-50 text-red-700'
													}`}>
														{tag}
													</span>
												))}
												{item.tags.length > 3 && (
												<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
														+{item.tags.length - 3} more
													</span>
												)}
											</div>
										)}

										{/* Read More Button */}
										<div className="flex items-center justify-between">
											<a 
												href={item.type === 'community-story' ? `/stories/${item.id}` : `/articles/${item.id}`}
												className={`inline-flex items-center text-sm font-medium transition-colors duration-200 ${
													item.type === 'community-story'
                                                        ? 'text-primary hover:text-red-800'
                                                        : 'text-primary hover:text-red-800'
												}`}
											>
												{item.type === 'community-story' ? 'Read Story' : 'Read Research'}
												<svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</a>
											
											{/* Author */}
											   <span className="text-xs text-gray-500">
												by {item.author}
											</span>
										</div>
									</div>
								</article>
							))}
						</div>
					) : !loading && (
						<div className="text-center py-12">
							<div className="max-w-md mx-auto">
								   <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
								   <p className="text-gray-600 text-lg font-medium mb-2">No recent community content</p>
								   <p className="text-gray-500 text-sm">Be the first to share your story or research with our community.</p>
							</div>
						</div>
					)}
					
					<div className="text-center mt-8 space-y-4">
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/stories" className="btn-secondary border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
								View Community Stories
							</Link>
							<Link href="/articles" className="btn-secondary border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
								View Research Articles
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}


