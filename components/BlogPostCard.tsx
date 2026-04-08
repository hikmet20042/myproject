"use client"

import { Calendar, User } from 'lucide-react'
import { ResourceCard } from '@/components/shared'
import SaveButton from '@/components/SaveButton'

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
    <ResourceCard
      type="blog"
      title={blog.title}
      description={blog.excerpt}
      href={`/blogs/${blog.id}`}
      badges={[{ label: 'Şəxsi bloq', variant: 'danger' }]}
      topRight={<SaveButton itemId={String(blog.id)} itemType="blog" itemTitle={blog.title} size="sm" showText={false} />}
      metadata={
        <>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formattedDate}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <User className="w-4 h-4 mr-1" />
            {'tərəfindən'} {blog.authorName}
          </div>
        </>
      }
      actionText={'Bloqu Oxu'}
      className="border-blue-100 hover:border-blue-300"
    />
  ) }
