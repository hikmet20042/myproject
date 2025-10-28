'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import BlogCard from '../../components/BlogCard'
import { Button, SearchBar } from '@/components/ui'

interface CommunityBlog {
  id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  status: string;
  type: 'community-blog';
}

const generateExcerpt = (content: any): string => {
  let textContent = '';
  
  if (typeof content === 'string') {
    textContent = content;
  } else if (Array.isArray(content)) {
    // Handle BlockNote content array
    textContent = content
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .map((item: any) => item.text || '')
            .join('');
        }
        return '';
      })
      .join(' ')
      .trim();
  }
  
  const words = textContent.split(' ');
  if (words.length <= 30) {
    return textContent;
  }
  return words.slice(0, 30).join(' ') + '...';
}

export default function CommunityBlogs() {
  const { data: session } = useSession()
  const [allBlogs, setAllBlogs] = useState<CommunityBlog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Load all blogs once
  const loadAllBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100'
      });
      
      const response = await fetch(`/api/blogs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Map MongoDB blogs to CommunityBlog interface
        const publishedBlogs = (data.results || []).filter((blog: any) => blog.status === 'approved');
        setAllBlogs(publishedBlogs.map((blog: any) => ({
          id: blog._id || blog.id,
          title: blog.title,
          authorName: blog.authorName,
          date: blog.createdAt || blog.submittedAt || blog.date || new Date().toISOString(),
          excerpt: blog.excerpt || generateExcerpt(blog.content),
          content: blog.content,
          status: blog.status,
          type: 'community-blog'
        })));
      } else {
        setAllBlogs([]);
      }
    } catch (error) {
      console.error('Failed to load community blogs:', error);
      setAllBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all blogs on component mount
  useEffect(() => {
    loadAllBlogs();
  }, [loadAllBlogs]);

  // Client-side filtering based on search only
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const filteredBlogs = allBlogs.filter(blog => {
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof blog.content === 'string' && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - match Resources page styling */}
      <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Community Blogs
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Personal experiences, struggles, and victories from our community members. 
              Real blogs that inspire change and foster understanding.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Sharing Blogs - always visible */}
      <section className="py-8 bg-gray-50 border-b border-gray-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Share Your Blog
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Your personal experiences matter. Share your journey, struggles, and victories to inspire others and create meaningful change in our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/submit/blog/step1">
                  <Button size="lg">
                    Submit Your Blog
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Blogs Source Info */}
            {allBlogs.length > 0 && (
              <div className="mb-8">
                {allBlogs.some(blog => blog.status === 'pending') ? (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">Showing Your Blogs</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are personal blogs you've submitted. They are stored locally in your browser.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">Community Blogs</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are personal blogs from our community members.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter Section */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary mb-4 sm:mb-0">Community Blogs</h2>
                <Button
                  onClick={() => loadAllBlogs()}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Blogs
                    </>
                  )}
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="mb-6">
                <SearchBar
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  placeholder="Search blogs by title, content, or abstract..."
                  value={searchQuery}
                  storageKey="blogs-search"
                />
              </div>
            </div>

            {/* Blogs Grid */}
            {filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No blogs found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? `No blogs found for "${searchQuery}".`
                    : "No community blogs available at the moment."
                  }
                </p>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                  >
                    View All Blogs
                  </Button>
                )}
              </div>
            )}

            {/* Call to Action removed to avoid duplicate 'Submit Your Blog' button */}
          </div>
        </div>
      </section>
    </div>
  )
}
