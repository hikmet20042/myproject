'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input, Select, TextArea, Button } from '@/components/ui'

export default function SubmitPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isAnonymous: false
  })

  const categories = [
    'gender-violence',
    'discrimination', 
    'workplace-equality',
    'education',
    'healthcare',
    'legal-rights',
    'other'
  ]

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

    if (!formData.content.trim()) {
      setMessage({ type: 'error', text: 'Content is required' })
      setLoading(false)
      return
    }

    if (!formData.category) {
      setMessage({ type: 'error', text: 'Please select a category' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isAnonymous: formData.isAnonymous,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setFormData({
          title: '',
          content: '',
          category: '',
          tags: '',
          isAnonymous: false
        })
        setTimeout(() => {
          router.push('/blogs')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit blog' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
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

  if (status === 'loading') {
    return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/submit')
    return null
  }

  return (
  <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Submit Your Blog
            </h1>
            <p className="text-gray-600">
              Share your experience or knowledge about social justice and equality in Azerbaijan. 
              Your submission will be reviewed before publication.
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-500'
                : 'bg-blue-100 text-blue-700 border border-blue-500'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <Select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories.map(cat => ({
                    value: cat,
                    label: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  }))
                ]}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <TextArea
                id="content"
                name="content"
                required
                rows={12}
                value={formData.content}
                onChange={handleChange}
                placeholder="Share your story, experience, or insights..."
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <Input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas (e.g., workplace, discrimination, education)"
              />
            </div>

            <div className="flex items-center">
              <Input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                Submit anonymously (your email will not be displayed)
              </label>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Review Process
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your submission will be reviewed by our team</li>
                  <li>• We typically review submissions within 24-48 hours</li>
                  <li>• Approved blogs will be published in the blogs section</li>
                  <li>• You will be notified about the status via email</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
                fullWidth
              >
                Submit Blog
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
