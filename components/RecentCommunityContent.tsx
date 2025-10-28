'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CommunityBlog {
	id: string
	title: string
	author: string
	date: string
	excerpt: string
	content: string
	tags: string[]
	status: string
	type: 'community-blog'
}

import React from 'react';

const RecentCommunityContent: React.FC = React.memo(function RecentCommunityContent() {
	const [blogs, setBlogs] = useState<CommunityBlog[]>([])
	
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		console.log('RecentCommunityContent mounted');
		let mounted = true;
		const load = async () => {
			try {
				setLoading(true);
											// Fetch recent blogs from MongoDB
											const blogsUrl = typeof window === 'undefined'
											  ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blogs?page=1&limit=3`
											  : '/api/blogs?page=1&limit=3';
											const blogsRes = await fetch(blogsUrl);
				if (blogsRes.ok) {
					const data = await blogsRes.json();
					const publishedBlogs = (data.blogs || data.results || []).filter((blog: any) => blog.status === 'approved');
					if (mounted) {
						const mappedBlogs = publishedBlogs.map((blog: any) => {
							// Extract text from BlockNote content for excerpt
							let excerptText = '';
							if (Array.isArray(blog.content)) {
								excerptText = blog.content
									.map((block: any) => {
										if (block.content && Array.isArray(block.content)) {
											return block.content.map((item: any) => item.text || '').join('');
										}
										return '';
									})
									.join(' ')
									.trim();
							} else if (typeof blog.content === 'string') {
								excerptText = blog.content;
							}
							
							return {
								id: blog._id || blog.id,
								title: blog.title,
								author: blog.authorName || 'Anonymous',
								date: blog.submittedAt || blog.createdAt || new Date().toISOString(),
								excerpt: blog.excerpt || excerptText.split(' ').slice(0, 30).join(' ') + '...',
								content: blog.content,
								tags: blog.tags || [],
								status: blog.status,
								type: 'community-blog'
							};
						});
						setBlogs(mappedBlogs);
					}
				}
											
							
					
				
			} catch (error) {
				// Error loading content
			} finally {
				if (mounted) setLoading(false);
			}
		};
		load();
		return () => { mounted = false };
	}, []);

	const allContent = [...blogs].sort((a, b) => 
		new Date(b.date).getTime() - new Date(a.date).getTime()
	).slice(0, 3)


	return (
		<section className="bg-white py-16">
			<div className="section-padding">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-8">
						<h2 className="text-3xl lg:text-4xl font-bold text-primary">Recent Community Content</h2>
						<p className="text-gray-600 mt-2">Blogs from our community</p>
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
                                                    item.type === 'community-blog'
														? 'bg-red-100 text-red-800'
														: 'bg-red-100 text-red-800'
                                                }`}>
											{item.type === 'community-blog' ? 'Blog' : 'Article'}
										</span>
									</div>

									

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
											<a href={`/blogs/${item.id}`} className="block">
												{item.title}
											</a>
										</h3>

										

										{/* Tags */}
										{item.tags && item.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 mb-4">
												{item.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
													<span key={tagIdx} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
														item.type === 'community-blog'
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
												href={ `/blogs/${item.id}`}
												className={`inline-flex items-center text-sm font-medium transition-colors duration-200 ${
													item.type === 'community-blog'
                                                        ? 'text-primary hover:text-red-800'
                                                        : 'text-primary hover:text-red-800'
												}`}
											>
												{item.type === 'community-blog' ? 'Read Blog' : 'Read Article'}
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
								<p className="text-gray-500 text-sm">Be the first to share your blog or article with our community.</p>
							</div>
						</div>
					)}
					
					<div className="text-center mt-8 space-y-4">
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/blogs" className="btn-secondary border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
								View Blogs
							</Link>
							
						</div>
					</div>
				</div>
			</div>
		</section>
	)
});

export default RecentCommunityContent;


