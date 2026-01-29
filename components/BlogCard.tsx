"use client"

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { BookOpen, User, Calendar, ArrowRight, Clock } from 'lucide-react'

interface Blog {
  id: string | number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: string;
  status: string;
}

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const { t, language } = useLanguage()
  const localePath = useLocalizedPath()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (language === 'az') {
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <Link href={localePath(`/blogs/${blog.id}`)}>
      <article className="group relative bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full overflow-hidden">
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-500 rounded-2xl"></div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        <div className="relative z-10">
          {/* Icon & Status Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            {blog.status === 'pending' && (
              <span className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
                {t('blogs.card.pendingBadge')}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {blog.title}
          </h2>
          
          {/* Excerpt */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {blog.excerpt}
          </p>
          
          {/* Meta Information */}
          <div className="flex flex-col gap-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-semibold text-blue-600 truncate">{blog.authorName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <time dateTime={blog.date} className="text-xs">{formatDate(blog.date)}</time>
            </div>
          </div>

          {/* Read More Action */}
          <div className="pt-4 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
            <div className="flex items-center text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span className="text-sm">{t('blogs.card.read')}</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

