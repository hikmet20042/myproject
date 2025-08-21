'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import Select from 'react-select'
import { ARTICLE_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'
import { Save, ArrowRight } from 'lucide-react'

interface DraftData {
  title: string
  abstract: string
  tags: string[]
  references: string
  isAnonymous: boolean
  content: any
  characterCount: number
  lastEdited: string
}

interface SelectOption {
  value: string
  label: string
}



export default function EditArticleStep1() {
  // Hooks
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  
  // URL parameters
  const articleId = params.id as string
  
  // State
  const [title, setTitle] = useState<string>('')
  const [abstract, setAbstract] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [references, setReferences] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false)
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [originalStatus, setOriginalStatus] = useState<string>('')


  // Load article data
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    loadArticle()
  }, [session, status, articleId])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load article')
      }
      
      const data = await response.json()
      const article = data.article
      
      // Check if user can edit this article
      const articleUserId = article.userId?.toString() || article.userId
      if (articleUserId !== session?.user?.id && article.author !== session?.user?.name) {
        setError('You do not have permission to edit this article')
        return
      }
      
      // Check if article can be edited
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
      setOriginalStatus(article.status)
      
      // Store in localStorage for step navigation
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
      
    } catch (error) {
      console.error('Error loading article:', error)
      setError('Failed to load article')
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }







  const handleSaveDraft = async () => {
    if (!session || !articleId) return

    try {
      setIsSavingDraft(true)
      setError('')

      // Get existing data from localStorage to include step2 content
      const existingData = localStorage.getItem('editArticle')
      let step2Data = { content: null, characterCount: 0 }
      
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData)
          step2Data = {
            content: parsed.content || null,
            characterCount: parsed.characterCount || 0
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error)
        }
      }

      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId,
          title: title.trim(),
          abstract: abstract.trim(),
          tags,
          references: references.split('\n').filter(ref => ref.trim()),
          isAnonymous,
          content: step2Data.content,
          status: 'draft'
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        
        // Update localStorage with all data including step2 content
        const currentData = {
          title,
          abstract,
          tags,
          references,
          isAnonymous,
          content: step2Data.content,
          characterCount: step2Data.characterCount,
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

  const handleNext = async () => {
    // Validate required fields
    if (!title.trim()) {
      setShowValidationErrors(true)
      setError('Title is required')
      return
    }

    try {
      // Get existing data from localStorage to include step2 content
      const existingData = localStorage.getItem('editArticle')
      let step2Data = { content: null, characterCount: 0 }
      
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData)
          step2Data = {
            content: parsed.content || null,
            characterCount: parsed.characterCount || 0
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error)
        }
      }

      // Save draft before navigation
      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId,
          title: title.trim(),
          abstract: abstract.trim(),
          tags,
          references: references.split('\n').filter(ref => ref.trim()),
          isAnonymous,
          content: step2Data.content,
          status: 'draft'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      // Save current data to localStorage with step2 content preserved
      const currentData = {
        title,
        abstract,
        tags,
        references,
        isAnonymous,
        content: step2Data.content,
        characterCount: step2Data.characterCount,
        lastEdited: new Date().toISOString()
      }
      localStorage.setItem('editArticle', JSON.stringify(currentData))
      
      // Navigate to step 2
      router.push(`/edit/article/${articleId}/step2`)
    } catch (error) {
      console.error('Error saving draft:', error)
      setError('Failed to save draft before proceeding')
    }
  }

  const tagOptions: SelectOption[] = ARTICLE_TAGS.map(tag => ({
    value: tag,
    label: tag
  }))

  const selectedTagOptions = tags.map(tag => ({
    value: tag,
    label: tag
  }))

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Article</h3>
                <p className="text-sm text-gray-500">Please wait while we load your article...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleNext()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Article</h1>
              <p className="text-gray-600">Update your article details and content</p>
              
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Article Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg ${
                    showValidationErrors && !(title || '').trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter the title of your article..."
                />
                {showValidationErrors && !(title || '').trim() && (
                  <p className="mt-1 text-sm text-red-600">Title is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Abstract *</label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  required
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    showValidationErrors && !(abstract || '').trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Provide a concise summary..."
                />
                {showValidationErrors && !(abstract || '').trim() && (
                  <p className="mt-1 text-sm text-red-600">Abstract is required</p>
                )}
                <p className="text-xs text-gray-500 mt-2">150-250 words recommended.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags *</label>
                <Select
                  isMulti
                  name="tags"
                  options={ARTICLE_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
                  value={ARTICLE_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })).filter(opt => tags.includes(opt.value))}
                  onChange={selected => setTags(selected ? selected.map((opt: any) => opt.value) : [])}
                  classNamePrefix="react-select"
                  placeholder="Select tags..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: showValidationErrors && tags.length === 0 ? '#fca5a5' : '#d1d5db',
                      backgroundColor: showValidationErrors && tags.length === 0 ? '#fef2f2' : 'white',
                    })
                  }}
                />
                {showValidationErrors && tags.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">Please select at least one tag</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
                <textarea value={references} onChange={(e) => setReferences(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="One per line..." />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  id="anon"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
                />
                <label htmlFor="anon" className="text-sm text-gray-700 select-none cursor-pointer">
                  Submit anonymously
                </label>
              </div>
              
              <div className="flex justify-between items-center">
                {/* Last saved indicator */}
                <div className="text-sm">
                  {lastSaved && (
                    <span className="inline-flex items-center text-green-600">
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Last saved at {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={
                      isSavingDraft ||
                      (!(title || '').trim() && !(abstract || '').trim() && (tags || []).length === 0 && !(references || '').trim())
                    }
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingDraft ? 'Saving...' : 'Save Draft'}
                  </button>

                  <button
                    type="submit"
                    disabled={showValidationErrors && (!(title || '').trim() || !(abstract || '').trim() || (tags || []).length === 0)}
                    className={`inline-flex items-center px-6 py-3 rounded-md shadow-sm text-sm font-medium ${
                      showValidationErrors && (!(title || '').trim() || !(abstract || '').trim() || (tags || []).length === 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }`}
                  >
                    Continue to writing →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}