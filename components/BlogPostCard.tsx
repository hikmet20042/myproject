"use client"

import Link from 'next/link'

interface CommunityBlog { id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  status: string;
  type: 'community-blog'; }

interface BlogCardProps { blog: CommunityBlog; }

export default function BlogCard({ blog }: BlogCardProps) {

  const date = new Date(blog.date)
  const formattedDate = date.toLocaleDateString('az-AZ', { year: 'numeric',
    month: 'short',
    day: 'numeric' })

  return (
    <article className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
      {/* Blog Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {'Şəxsi bloq'}
        </span>
      </div>

      <div className="p-6 pt-12">
        {/* Date */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">
          <Link href={`/blogs/${blog.id}`} className="block">
            {blog.title}
          </Link>
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Read More Button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/blogs/${blog.id}`}
            className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-red-800 transition-colors duration-200"
          >
            {'Bloqu Oxu'}
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Author */}
          <span className="text-xs text-gray-500">
            {'tərəfindən'} {blog.authorName}
          </span>
        </div>
      </div>
    </article>
  ) }
