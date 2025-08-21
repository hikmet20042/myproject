'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import StoryCard from '../../components/StoryCard'

interface CommunityStory {
  id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: string;
  type: 'community-story';
}

export default function CommunityStories() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<CommunityStory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string>('')

  const loadStories = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stories?page=1&limit=100');
      if (response.ok) {
        const data = await response.json();
        // Map MongoDB stories to CommunityStory interface
        const publishedStories = (data.results || []).filter((story: any) => story.status === 'approved');
        setStories(publishedStories.map((story: any) => ({
          id: story._id || story.id,
          title: story.title,
          authorName: story.authorName,
          date: story.submittedAt || story.date || new Date().toISOString(),
          excerpt: story.excerpt || generateExcerpt(story.content),
          content: story.content,
          tags: story.tags || [],
          status: story.status,
          type: 'community-story'
        })));
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error('Failed to load community stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories()
  }, [loadStories])

  const generateExcerpt = (content: string): string => {
    const words = content.split(' ')
    if (words.length <= 30) {
      return content
    }
    return words.slice(0, 30).join(' ') + '...'
  }

  const allTags = Array.from(new Set(stories.flatMap(story => story.tags)))
  const filteredStories = selectedTag 
    ? stories.filter(story => story.tags.includes(selectedTag))
    : stories

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community stories...</p>
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
              Community Stories
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Personal experiences, struggles, and victories from our community members. 
              Real stories that inspire change and foster understanding.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Sharing Stories - always visible */}
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
                Share Your Story
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Your personal experiences matter. Share your journey, struggles, and victories to inspire others and create meaningful change in our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/submit/story"
                  className="btn-primary inline-block"
                >
                  Submit Your Story
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
            {/* Stories Source Info */}
            {stories.length > 0 && (
              <div className="mb-8">
                {stories.some(story => story.status === 'pending') ? (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">Showing Your Stories</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are personal stories you've submitted. They are stored locally in your browser.</p>
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
                        <h3 className="text-sm font-medium text-gray-800">Community Stories</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are personal stories from our community members.</p>
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
                <h2 className="text-2xl font-bold text-primary mb-4 sm:mb-0">Filter by Experience Type</h2>
                <button
                  onClick={loadStories}
                  disabled={loading}
                  className="btn-secondary text-sm flex items-center border-gray-400 text-gray-700 hover:bg-gray-100"
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
                      Refresh Stories
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                    selectedTag === '' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  All Stories ({stories.length})
                </button>
                {allTags.map((tag) => {
                  const count = stories.filter(story => story.tags.includes(tag)).length
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                        selectedTag === tag 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      #{tag} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stories Grid */}
            {filteredStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No stories found</h3>
                <p className="text-gray-500 mb-6">
                  {selectedTag 
                    ? `No stories found with the tag "${selectedTag}".` 
                    : "No community stories available at the moment."
                  }
                </p>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag('')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    View All Stories
                  </button>
                )}
              </div>
            )}

            {/* Call to Action removed to avoid duplicate 'Submit Your Story' button */}
          </div>
        </div>
      </section>
    </div>
  )
}
