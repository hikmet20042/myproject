'use client'

import { useEffect, useState } from 'react'
import Select from 'react-select'
import { RESEARCH_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'


export default function SubmitArticlePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    content: '',
    contentBlocksJson: '',
    contentHtml: '',
    tags: [], // now array
    references: '',
    isAnonymous: false
  })

  const tagOptions = RESEARCH_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))

  // Autosave draft
  useEffect(() => {
    const saved = localStorage.getItem('draftArticle')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData((prev) => ({ ...prev, ...parsed, tags: Array.isArray(parsed.tags) ? parsed.tags : [] }))
      } catch {}
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const { title, abstract, content, contentHtml, contentBlocksJson, tags, references, isAnonymous } = formData
      localStorage.setItem('draftArticle', JSON.stringify({ title, abstract, content, contentHtml, contentBlocksJson, tags, references, isAnonymous }))
    }, 400)
    return () => clearTimeout(timeout)
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Client-side validation
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' })
      setLoading(false)
      return
    }

    if (!formData.abstract.trim()) {
      setMessage({ type: 'error', text: 'Abstract is required for research articles' })
      setLoading(false)
      return
    }

    if (!formData.content.trim()) {
      setMessage({ type: 'error', text: 'Article content is required' })
      setLoading(false)
      return
    }

    if (formData.content.trim().length < 200) {
      setMessage({ type: 'error', text: 'Research articles should be at least 200 characters long' })
      setLoading(false)
      return
    }

    try {
      // Store in localStorage for now (since we don't have a backend for articles yet)
      const articleData = {
        id: Date.now(),
        title: formData.title.trim(),
        abstract: formData.abstract.trim(),
        content: formData.content.trim(),
        contentBlocksJson: formData.contentBlocksJson || '',
        contentHtml: formData.contentHtml || '',
        author: formData.isAnonymous ? 'Anonymous Researcher' : (session?.user?.name || 'Researcher'),
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        references: formData.references ? formData.references.split('\n').filter(ref => ref.trim()) : [],
        status: 'submitted',
        type: 'research-article',
        submittedAt: new Date().toISOString()
      }

      // Get existing articles from localStorage
      const existingArticles = localStorage.getItem('submittedArticles')
      const articles = existingArticles ? JSON.parse(existingArticles) : []
      
      // Add new article
      articles.push(articleData)
      localStorage.setItem('submittedArticles', JSON.stringify(articles))

      setMessage({ type: 'success', text: 'Your research article has been submitted successfully! Thank you for contributing to the academic discourse.' })
      setFormData({
        title: '',
        abstract: '',
        content: '',
        contentBlocksJson: '',
        contentHtml: '',
        tags: [],
        references: '',
        isAnonymous: false
      })
      localStorage.removeItem('draftArticle')
      
      setTimeout(() => {
        router.push('/articles')
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit your article. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  // Tag select handler
  const handleTagChange = (selected: any) => {
    setFormData(prev => ({ ...prev, tags: selected ? selected.map((opt: any) => opt.value) : [] }))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to submit research articles. This helps us maintain academic integrity.
            </p>
            <div className="space-y-3">
              <a
                href="/auth/signin"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-block"
              >
                Sign In
              </a>
              <a
                href="/auth/register"
                className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-block"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (status === 'authenticated') {
    router.replace('/submit/article/step1')
    return null
  }

  // --- Tag Multi-Select UI ---
  // Place this in your form where tags are selected:
  // <label>Tags</label>
  // <Select ... />

  // Example usage in your form:
  // ...existing form fields...
  // <div className="mb-4">
  //   <label className="block font-medium mb-1">Tags</label>
  //   <Select
  //     isMulti
  //     name="tags"
  //     options={tagOptions}
  //     value={tagOptions.filter(opt => formData.tags.includes(opt.value))}
  //     onChange={handleTagChange}
  //     classNamePrefix="react-select"
  //     placeholder="Select tags..."
  //   />
  //   <div className="mt-2 flex flex-wrap gap-2">
  //     {formData.tags.map((tag: string) => (
  //       <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
  //     ))}
  //   </div>
  // </div>
  // ...existing form fields...
}
