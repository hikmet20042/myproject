'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })


type Article = {
  _id: string
  title: string
  content: string
  contentHtml: string
  tags: string[]
  abstract?: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  author?: string
  isAnonymous?: boolean
  createdAt: string
}

type Story = {
  _id: string
  title: string
  content: string
  contentHtml: string
  tags: string[]
  abstract?: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  author?: string
  isAnonymous?: boolean
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('articles')
  const [articles, setArticles] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Article | Story | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'admin') {
      router.push('/')
      return
    }

    loadSubmissions()
  }, [status, session, router])

  const loadSubmissions = async () => {
    try {
      const [articlesRes, storiesRes] = await Promise.all([
        fetch('/api/admin/articles'),
        fetch('/api/admin/stories'),
      ]);
      if (articlesRes.ok && storiesRes.ok) {
        const articlesData = await articlesRes.json();
        const storiesData = await storiesRes.json();
        setArticles(articlesData.results || []);
        setStories(storiesData.results || []);
      }
    } catch (error) {
      console.error('Error loading articles/stories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleReview = (item: Article | Story) => {
    setSelectedItem(item)
    setAdminComment(item.adminComment || '')
    setShowModal(true)
  }

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const endpoint = activeTab === 'articles' ? '/api/admin/articles' : '/api/admin/stories';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem._id,
          status: 'approved',
          adminComment: adminComment.trim() || null
        })
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment('');
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setIsProcessing(false);
    }
  } 

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!adminComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      const endpoint = activeTab === 'articles' ? '/api/admin/articles' : '/api/admin/stories';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem._id,
          status: 'rejected',
          adminComment: adminComment.trim()
        })
      });
      if (response.ok) {
        setShowModal(false);
        setSelectedItem(null);
        setAdminComment('');
        loadSubmissions();
      }
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setIsProcessing(false);
    }
  } 

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getByStatus = (arr: any[], status: string) => arr.filter(s => s.status === status)

  if (loading) {
    return (
  <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('articles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'articles'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Articles
                {getByStatus(articles, 'pending').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {getByStatus(articles, 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stories'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Stories
                {getByStatus(stories, 'pending').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {getByStatus(stories, 'pending').length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              {/* Pending Articles */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pending Review <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(articles, 'pending').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(articles, 'pending').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No pending articles
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(articles, 'pending').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Article
                              </span>
                              <span className="text-sm text-gray-500">
                                by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {submission.title}
                            </h3>
                            {submission.abstract && (
                              <p className="text-sm text-gray-600 mb-2">
                                {submission.abstract}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {submission.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <button
                              onClick={() => handleReview(submission)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Approved Articles */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Approved <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(articles, 'approved').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(articles, 'approved').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No approved articles
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(articles, 'approved').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>{getStatusIcon(submission.status)}<span className="ml-1 capitalize">{submission.status}</span></span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Article
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {submission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected Articles */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Rejected <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(articles, 'rejected').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(articles, 'rejected').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No rejected articles
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(articles, 'rejected').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>{getStatusIcon(submission.status)}<span className="ml-1 capitalize">{submission.status}</span></span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Article
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {submission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                            </p>
                            {submission.adminComment && (
                              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Reason:</strong> {submission.adminComment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              {/* Pending Stories */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pending Review <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(stories, 'pending').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(stories, 'pending').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No pending stories
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(stories, 'pending').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Story
                              </span>
                              <span className="text-sm text-gray-500">
                                by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {submission.title}
                            </h3>
                            {submission.abstract && (
                              <p className="text-sm text-gray-600 mb-2">
                                {submission.abstract}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {submission.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <button
                              onClick={() => handleReview(submission)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Approved Stories */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Approved <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(stories, 'approved').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(stories, 'approved').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No approved stories
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(stories, 'approved').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>{getStatusIcon(submission.status)}<span className="ml-1 capitalize">{submission.status}</span></span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Story
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {submission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected Stories */}
              <div className="bg-white shadow-lg rounded-2xl mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Rejected <span className="ml-2 text-base font-normal text-gray-500">({getByStatus(stories, 'rejected').length})</span>
                  </h2>
                </div>
                <div className="px-6 py-6">
                  {getByStatus(stories, 'rejected').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No rejected stories
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getByStatus(stories, 'rejected').map((submission) => (
                        <div key={submission._id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>{getStatusIcon(submission.status)}<span className="ml-1 capitalize">{submission.status}</span></span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wide">
                                Story
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {submission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              by {submission.isAnonymous ? 'Anonymous' : (submission.author?.name || submission.author || 'Unknown')}
                            </p>
                            {submission.adminComment && (
                              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Reason:</strong> {submission.adminComment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative w-full max-w-lg mx-auto p-6 border shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedItem.title}
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activeTab.slice(0, -1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    by {selectedItem.isAnonymous ? 'Anonymous' : selectedItem.author || 'Unknown'}
                  </span>
                </div>
                {selectedItem.abstract && (
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedItem.abstract}
                  </p>
                )}
                <div className="prose max-w-none max-h-96 overflow-y-auto">
                  {selectedItem.content && typeof selectedItem.content === 'object' ? (
                    <BlocknoteReadOnly content={selectedItem.content} />
                  ) : selectedItem.contentHtml && selectedItem.contentHtml.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedItem.contentHtml }} />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-sm bg-gray-100 p-2 rounded">
                      {typeof selectedItem.content === 'string'
                        ? selectedItem.content
                        : JSON.stringify(selectedItem.content, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Comment (optional for approval, required for rejection)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Provide feedback or reason for rejection..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
