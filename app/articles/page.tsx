
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'

interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: string;
  type: 'article';
  references?: string[];
  abstract?: string;
}

export default function Articles() {
  const { data: session } = useSession()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string>('')

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/articles?page=1&limit=100&status=approved');
      if (response.ok) {
        const data = await response.json();
        // Map MongoDB articles to Article interface, only approved
        const approvedArticles = (data.results || []).filter((article: any) => article.status === 'approved');
        setArticles(approvedArticles.map((article: any) => ({
          id: article._id?.toString() || article.id?.toString() || '',
          title: article.title,
          author: typeof article.author === 'object' && article.author?.name ? article.author.name : (article.author?.toString?.() || 'Anonymous'),
          date: article.publishedAt ? new Date(article.publishedAt).toISOString() : (article.date ? new Date(article.date).toISOString() : new Date().toISOString()),
          excerpt: typeof article.content === 'string' ? generateExcerpt(article.content) : '',
          content: typeof article.content === 'string' ? article.content : '',
          tags: Array.isArray(article.tags) ? article.tags : [],
          status: article.status,
          type: 'article',
          references: Array.isArray(article.references) ? article.references : [],
          abstract: article.abstract || ''
        })));
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const generateExcerpt = (content: string): string => {
    const words = content.split(' ')
    if (words.length <= 30) {
      return content
    }
    return words.slice(0, 30).join(' ') + '...'
  }

  const allTags = Array.from(new Set(articles.flatMap(article => article.tags)))
  const filteredArticles = selectedTag 
    ? articles.filter(article => article.tags.includes(selectedTag))
    : articles

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
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
              Articles
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Academic-style writing, opinion essays, and research studies on social justice and equality. 
              Evidence-based insights and policy analysis from experts and researchers.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Non-Logged-In Users */}
      {!session && (
        <section className="py-8 bg-gray-50 border-b border-gray-200">
          <div className="section-padding">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Submit Article
                </h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Share your article, analysis, or expert opinion on social justice and equality issues. 
                  Help advance knowledge and inform policy through evidence-based writing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="btn-secondary border-primary text-primary hover:bg-primary hover:text-white flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="btn-secondary border-gray-500 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Articles Source Info */}
            {articles.length > 0 && (
              <div className="mb-8">
                {articles.some(article => article.status === 'pending') ? (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">Showing Your Article</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are articles you've submitted. They are stored locally in your browser.</p>
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
                        <h3 className="text-sm font-medium text-gray-800">Published Articles</h3>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>These are published articles and academic papers.</p>
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
                <h2 className="text-2xl font-bold text-primary mb-4 sm:mb-0">Filter by Area</h2>
                <button
                  onClick={loadArticles}
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
                      Refresh Articles
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
                  All Articles ({articles.length})
                </button>
                {allTags.map((tag) => {
                  const count = articles.filter(article => article.tags.includes(tag)).length
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

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-6">
                  {selectedTag 
                    ? `No articles found with the tag "${selectedTag}".` 
                    : "No articles available at the moment."
                  }
                </p>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag('')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    View All Articles
                  </button>
                )}
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="card max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-primary mb-4">
                  Submit Article
                </h3>
                <p className="text-gray-700 mb-6">
                  Have research findings, policy analysis, or expert insights to share? 
                  Contribute to the academic discourse on social justice and equality.
                </p>
                <Link href="/submit/article" className="btn-primary inline-block">
                  Submit Article
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
