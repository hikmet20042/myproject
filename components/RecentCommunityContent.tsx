'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BlogCard from './BlogCard'
import React from 'react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface Blog {
id: string
title: string
author: string
authorName: string
date: string
excerpt: string
content: string
tags: string[]
status: string
type: 'blog'
}

const RecentCommunityContent: React.FC = React.memo(function RecentCommunityContent() {
const localePath = useLocalizedPath()
const [blogs, setBlogs] = useState<Blog[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
let mounted = true

const load = async () => {
try {
setLoading(true)
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const blogsUrl = typeof window === 'undefined' ? `${baseUrl}/api/blogs?page=1&limit=3` : '/api/blogs?page=1&limit=3'
const blogsRes = await fetch(blogsUrl)

if (!blogsRes.ok || !mounted) return

const data = await blogsRes.json()
const publishedBlogs = (data.blogs || data.results || []).filter((blog: any) => blog.status === 'approved')
const mappedBlogs = publishedBlogs.map((blog: any) => {
let excerptText = ''
if (Array.isArray(blog.content)) {
excerptText = blog.content
.map((block: any) => {
if (block.content && Array.isArray(block.content)) {
return block.content.map((item: any) => item.text || '').join('')
}
return ''
})
.join(' ')
.trim()
} else if (typeof blog.content === 'string') {
excerptText = blog.content
}

return {
id: blog._id || blog.id,
title: blog.title,
author: blog.authorName || 'Anonim',
authorName: blog.authorName || 'Anonim',
date: blog.submittedAt || blog.createdAt || new Date().toISOString(),
excerpt: blog.excerpt || excerptText.split(' ').slice(0, 30).join(' ') + '...',
content: blog.content,
tags: blog.tags || [],
status: blog.status,
type: 'blog' as const,
}
})

setBlogs(mappedBlogs)
} catch (error) {
console.error('Error loading content:', error)
} finally {
if (mounted) setLoading(false)
}
}

load()
return () => {
mounted = false
}
}, [])

const allContent = [...blogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)

return (
<section className="bg-white py-16">
<div className="section-padding">
<div className="max-w-6xl mx-auto">
<div className="text-center mb-8">
<h2 className="text-3xl lg:text-4xl font-bold text-blue-700">{'Son İcma Paylaşımları'}</h2>
<p className="text-gray-600 mt-2">{'İcma üzvlərinin son paylaşımları'}</p>
</div>
{loading && (
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{[1, 2, 3].map((i) => (
<div key={i} className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
<div className="p-6 pt-12">
<div className="animate-pulse">
<div className="h-4 bg-slate-200 rounded mb-3"></div>
<div className="h-6 bg-slate-200 rounded mb-4"></div>
<div className="h-4 bg-slate-200 rounded mb-2"></div>
<div className="h-4 bg-slate-200 rounded mb-4 w-3/4"></div>
<div className="flex justify-between">
<div className="h-4 bg-slate-200 rounded w-24"></div>
<div className="h-4 bg-slate-200 rounded w-16"></div>
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
<BlogCard key={item.id} blog={item} />
))}
</div>
) : !loading && (
<div className="text-center py-12">
<div className="max-w-md mx-auto">
<svg className="w-16 h-16 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
</svg>
<p className="text-gray-600 text-lg font-medium mb-2">{'Hələlik icma paylaşımı yoxdur'}</p>
<p className="text-gray-500 text-sm">{'İcma ilə bloq və ya məqalə paylaşan ilk sən ol.'}</p>
</div>
</div>
)}

<div className="text-center mt-8 space-y-4">
<div className="flex flex-col sm:flex-row gap-4 justify-center">
<Link href={localePath('/blogs')} className="btn-secondary border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
{'Bütün Bloqlar'}
</Link>
</div>
</div>
</div>
</div>
</section>
)
})

export default RecentCommunityContent
