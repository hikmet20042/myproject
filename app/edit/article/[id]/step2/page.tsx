'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BlocknoteEditor from '@/components/BlocknoteEditor'
import { ArrowLeft, Save, Send, Eye, EyeOff } from 'lucide-react'
import { BlockNoteEditor } from '@blocknote/core'



export default function EditArticleStep2() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<BlockNoteEditor | null>(null)

  // Cleanup function to clear localStorage when leaving the article editing flow
  const cleanupLocalStorage = () => {
    localStorage.removeItem('editArticle')
    localStorage.removeItem('currentEditId')
  }

  // Step 1 fields - initialize with empty values, will be populated from localStorage
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState('');
  const [references, setReferences] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [originalStatus, setOriginalStatus] = useState('');

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Cleanup localStorage when component unmounts (user navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only cleanup if not navigating within the article flow
      const preserveData = sessionStorage.getItem('preserveEditData')
      if (!preserveData) {
        cleanupLocalStorage()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save current state before potentially leaving
        const currentData = {
          title,
          abstract,
          tags,
          references,
          isAnonymous,
          content,
          characterCount,
          lastEdited: new Date().toISOString()
        }
        localStorage.setItem('editArticle', JSON.stringify(currentData))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Clear the preserve flag when component unmounts
      sessionStorage.removeItem('preserveEditData')
    }
  }, [title, abstract, tags, references, isAnonymous, content, characterCount])

  // Load article data and step 1 data
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    loadArticleData()
  }, [session, status, articleId])

  const loadArticleData = async () => {
    try {
      setLoading(true)
      
      // First, try to load from localStorage (step 1 data)
      const editData = localStorage.getItem('editArticle')
      const currentEditId = localStorage.getItem('currentEditId')
      
      if (!currentEditId || currentEditId !== articleId) {
        // If no localStorage data or wrong article, load from API
        await loadFromAPI()
      } else if (editData) {
        // Load from localStorage
        const data = JSON.parse(editData)
        setTitle(data.title || '')
        setAbstract(data.abstract || '')
        setTags(data.tags || [])
        setReferences(data.references || '')
        setIsAnonymous(data.isAnonymous || false)
        setContent(data.content || null)
        setCharacterCount(data.characterCount || 0)
        
        // Still need to load original article for content if not in localStorage
        if (!data.content) {
          await loadContentFromAPI()
        }
      } else {
        // No localStorage data, load from API
        await loadFromAPI()
      }
    } catch (error) {
      console.error('Error loading article data:', error)
      setError('Failed to load article data')
    } finally {
      setLoading(false)
    }
  }

  const loadFromAPI = async () => {
    const response = await fetch(`/api/articles/${articleId}`)
    
    if (!response.ok) {
      throw new Error('Failed to load article')
    }
    
    const data = await response.json()
    const article = data.article
    
    // Check permissions
    const articleUserId = article.userId?.toString() || article.userId
    if (articleUserId !== session?.user?.id && article.author !== session?.user?.name) {
      setError('You do not have permission to edit this article')
      return
    }
    
    if (article.status === 'approved') {
      setError('Approved articles cannot be edited. Contact an administrator if changes are needed.')
      return
    }
    
    // Populate form
    setTitle(article.title || '')
    setAbstract(article.abstract || '')
    setTags(article.tags || [])
    setReferences(article.references?.join('\n') || '')
    setIsAnonymous(article.anonymous || false)
    setContent(article.content || null)
    setOriginalStatus(article.status)
    
    // Update localStorage
    const editData = {
      title: article.title || '',
      abstract: article.abstract || '',
      tags: article.tags || [],
      references: article.references?.join('\n') || '',
      isAnonymous: article.anonymous || false,
      content: article.content || null,
      characterCount: 0,
      lastEdited: new Date().toISOString()
    }
    localStorage.setItem('editArticle', JSON.stringify(editData))
    localStorage.setItem('currentEditId', articleId)
  }

  const loadContentFromAPI = async () => {
    const response = await fetch(`/api/articles/${articleId}`)
    if (response.ok) {
      const data = await response.json()
      setContent(data.article.content || null)
      setOriginalStatus(data.article.status)
    }
  }







  const handleSaveDraft = async () => {
    if (!session || !articleId) return

    try {
      setIsSavingDraft(true)
      setError('')

      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId,
          title: title.trim(),
          abstract: abstract.trim(),
          content,
          tags: Array.isArray(tags) ? tags : [],
          references: references.split('\n').filter(ref => ref.trim()),
          isAnonymous,
          status: 'draft'
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        
        // Update localStorage
        const currentData = {
          title,
          abstract,
          tags,
          references,
          isAnonymous,
          content,
          characterCount,
          lastEdited: new Date().toISOString()
        }
        localStorage.setItem('editArticle', JSON.stringify(currentData))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Save draft error:', error)
      setError('Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!session || !articleId) return

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content) {
      setError('Content is required')
      return
    }

    try {
      setIsSubmittingForReview(true)
      setError('')

      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId,
          title: title.trim(),
          abstract: abstract.trim(),
          content,
          tags: Array.isArray(tags) ? tags : [],
          references: references.split('\n').filter(ref => ref.trim()),
          isAnonymous,
          status: 'pending' // Submit for review
        }),
      })

      if (response.ok) {
        setSuccess(true)
        cleanupLocalStorage()
        
        // Redirect after success
        setTimeout(() => {
          router.push('/profile?tab=articles')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit article')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('Failed to submit article')
    } finally {
      setIsSubmittingForReview(false)
    }
  }

  const handleBack = async () => {
    try {
      // Save draft to database first
      await handleSaveDraft()
      
      // Save current data before going back
      const currentData = {
        title,
        abstract,
        tags,
        references,
        isAnonymous,
        content,
        characterCount,
        lastEdited: new Date().toISOString()
      }
      localStorage.setItem('editArticle', JSON.stringify(currentData))
      
      // Set preserve flag
      sessionStorage.setItem('preserveEditData', 'true')
      
      router.push(`/edit/article/${articleId}/step1`)
    } catch (error) {
      console.error('Error saving draft before navigation:', error)
      // Still allow navigation even if save fails
      router.push(`/edit/article/${articleId}/step1`)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Article Updated Successfully!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your article has been updated and submitted for review.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Your Article</h1>
                <p className="mt-2 text-gray-600">
                  Update your research, analysis, or academic insights
                </p>
              </div>
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </div>
            
            {/* Manual save warning */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Manual Save Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Auto-save has been disabled. Please use the "Save Draft" button to save your changes manually. 
                    Your progress will be saved automatically when navigating between steps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article Details</h2>

            {/* Show helpful message if some required fields are missing */}
            {(!title.trim() || !abstract.trim() || tags.length === 0) && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Some article details are missing
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You can still edit your article content below. You can go back to{' '}
                        <button
                          onClick={() => router.push(`/edit/article/${articleId}/step1`)}
                          className="font-medium underline hover:text-blue-600"
                        >
                          Step 1
                        </button>
                        {' '}anytime to complete the missing information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">
                  {title.trim() || <span className="text-gray-400 italic">No title provided</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <p className="mt-1 text-sm text-gray-900">
                  {isAnonymous ? 'Anonymous' : session?.user?.name}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Abstract</label>
                <p className="mt-1 text-sm text-gray-900">
                  {abstract.trim() || <span className="text-gray-400 italic">No abstract provided</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags && Array.isArray(tags) && tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {tag.label || tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No tags provided</span>
                  )}
                </div>
              </div>
              {references && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">References</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {references && typeof references === 'string' ? (
                      references.split('\n').map((ref, index) => (
                        <p key={index} className="mb-1">{ref.trim()}</p>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No references provided</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Article Content</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {characterCount} characters
                  </span>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {showPreview ? (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: editorRef.current?.domElement?.innerHTML || '' }} />
                  </div>
                ) : (
                <BlocknoteEditor
                  key={title || 'empty'}
                  initialJSON={content}
                  onChange={(newContent, html, text) => {
                    setContent(newContent)
                    
                    // Calculate character count from actual text content
                    setCharacterCount(text.length)
                    
                    // Get the editor instance from the DOM for preview
                    const editorElement = document.querySelector('.bn-container')
                    if (editorElement) {
                      editorRef.current = {
                        domElement: editorElement as HTMLElement
                      } as BlockNoteEditor
                    }
                  }}
                  context="edit"
                />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual save warning */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm">
              <span className="inline-flex items-center text-amber-600">
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Remember to save your draft manually before leaving this page
              </span>
              {lastSaved && (
                <span className="inline-flex items-center text-green-600 ml-4">
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-saved at {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || !content}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isSubmittingForReview || !title.trim() || !content}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmittingForReview ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>

          {/* Guidelines */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Article Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share research, analysis, or academic insights about social justice and equality</li>
              <li>• Include proper citations and references</li>
              <li>• Minimum 500 characters required</li>
              <li>• Your article will be reviewed before publication</li>
              <li>• You can choose to remain anonymous</li>
              <li>• Maintain academic standards and objectivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}