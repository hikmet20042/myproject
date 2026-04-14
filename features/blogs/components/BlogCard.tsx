"use client"

import Link from 'next/link'
import { BookOpen, User, Calendar } from 'lucide-react'
import Image from 'next/image'
import { ResourceCard } from '@/components/shared'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

interface Blog { id: string | number;
  slug: string;
  title: string;
  authorName: string;
  authorId?: string;
  authorUrlHandle?: string | null;
  authorAvatar?: string;
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
  const localePath = useLocalizedPath();

  const authorLink = blog.authorUrlHandle ? localePath(`/u/${blog.authorUrlHandle}`) : (blog.authorId ? localePath(`/u/${blog.authorId}`) : null);
  const initial = blog.authorName?.charAt(0)?.toUpperCase() || '?';

  return (
    <ResourceCard
      type="blog"
      title={blog.title}
      description={blog.excerpt}
      href={`/blogs/${blog.slug}`}
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
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {blog.authorAvatar ? (
                <Image src={blog.authorAvatar} alt={blog.authorName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold">
                  {initial}
                </div>
              )}
            </div>
            {authorLink ? (
              <Link href={authorLink} className="font-semibold text-blue-600 truncate hover:text-blue-700 transition-colors">
                {blog.authorName}
              </Link>
            ) : (
              <span className="font-semibold text-blue-600 truncate">{blog.authorName}</span>
            )}
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
