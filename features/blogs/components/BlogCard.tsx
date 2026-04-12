"use client"

import { BookOpen, User, Calendar } from 'lucide-react'
import { ResourceCard } from '@/components/shared'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'

interface Blog { id: string | number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: string;
  status: string; }

interface BlogCardProps { blog: Blog; }

export default function BlogCard({ blog }: BlogCardProps) {
  const formatDate = (dateString: string) => { const date = new Date(dateString);
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`; };

  return (
    <ResourceCard
      type="blog"
      title={blog.title}
      description={blog.excerpt}
      href={`/blogs/${blog.id}`}
      icon={
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
      }
      topRight={
        <div className="flex items-center gap-2">
          {blog.status === 'pending' && (
            <span className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
              {'Sənin Təqdimatın'}
            </span>
          )}
          <SaveItemButtonContainer itemId={String(blog.id)} itemType="blog" itemTitle={blog.title} size="sm" showText={false} />
        </div>
      }
      metadata={
        <>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-blue-600 truncate">{blog.authorName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <time dateTime={blog.date} className="text-xs">{formatDate(blog.date)}</time>
          </div>
        </>
      }
      actionText={'Bloqu Oxu'}
      hoverBorderColor="hover:border-blue-500"
    />
  ); }
