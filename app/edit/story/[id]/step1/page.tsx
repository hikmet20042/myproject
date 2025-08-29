'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Select from 'react-select'
import { STORY_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'
import { Input, Button } from '@/components/ui'

export default function EditStoryStep1() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const storyId = params.id as string

  // Cleanup function to clear localStorage when leaving the story editing flow
  const cleanupLocalStorage = () => {
    localStorage.removeItem('editStoryData')
    localStorage.removeItem('currentStoryEditId')
  }

  // Load story data - prioritize localStorage over API when navigating within flow
  useEffect(() => {
    const loadStoryData = async () => {
      if (!storyId || status === 'loading') return
      
      if (status !== 'authenticated') {
        setError('Please log in to edit stories.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // First, check if we have valid localStorage data
        const saved = localStorage.getItem('editStoryData')
        const inEditFlow = sessionStorage.getItem('inStoryEditFlow') === 'true'
        
        if (saved && inEditFlow) {
          try {
            const localData = JSON.parse(saved)
            if (localData.editId === storyId) {
              // Use localStorage data when navigating within the editing flow
              setTitle(localData.title || '')
              setTags(localData.tags || [])
              setIsAnonymous(localData.isAnonymous || false)
              setAuthorName(localData.authorName || '')
              setLoading(false)
              return
            }
          } catch (e) {
            console.error('Error parsing localStorage data:', e)
          }
        }
        
        // If no valid localStorage data, fetch from API
        const response = await fetch(`/api/stories?id=${storyId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const story = data.story

          if (story) {
            // Check if user can edit this story
            const storyAuthorId = story.author?.toString() || story.author
            if (storyAuthorId !== session?.user?.id && story.authorName !== session?.user?.name) {
              setError('You do not have permission to edit this story')
              setLoading(false)
              return
            }

            // Set form fields
            setTitle(story.title || '')
            setTags(story.tags || [])
            setIsAnonymous(story.isAnonymous || false)
            setAuthorName(story.isAnonymous ? 'Anonymous' : (story.authorName || session.user.name || ''))

            // Save complete story data to localStorage
            const storyData = {
              title: story.title || '',
              tags: story.tags || [],
              isAnonymous: story.isAnonymous || false,
              authorName: story.isAnonymous ? 'Anonymous' : (story.authorName || session.user.name || ''),
              content: story.content || null,
              contentHtml: story.contentHtml || '',
              characterCount: 0,
              editId: storyId
            }
            
            // Clear any existing story edit data first
            localStorage.removeItem('editStoryData')
            localStorage.removeItem('draftStory')
            localStorage.removeItem('currentStoryDraftId')
            localStorage.removeItem('currentStoryEditId')
            localStorage.removeItem('storyStep1Data')
            localStorage.removeItem('storyStep2Data')
            
            // Save new data
            localStorage.setItem('editStoryData', JSON.stringify(storyData))
            localStorage.setItem('currentStoryEditId', storyId)
          } else {
            setError('Story not found.')
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to fetch story data:', response.status, response.statusText, errorText)
          setError(`Failed to load story: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching story data:', error)
        setError('Failed to load story data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadStoryData()
  }, [storyId, status, session])

  // Update localStorage whenever form data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storyId && !loading) {
      const saved = localStorage.getItem('editStoryData')
      if (saved) {
        try {
          const base = JSON.parse(saved)
          const updatedData = {
            ...base,
            title,
            tags,
            isAnonymous,
            authorName,
            editId: storyId
          }
          localStorage.setItem('editStoryData', JSON.stringify(updatedData))
        } catch (e) {
          console.error('Error updating localStorage:', e)
        }
      }
    }
  }, [title, tags, isAnonymous, authorName, storyId, loading])

  // Cleanup localStorage when component unmounts (user navigates away)
  useEffect(() => {
    // Set a flag that we're currently in the story editing flow
    sessionStorage.setItem('inStoryEditFlow', 'true')
    
    // Cleanup on component unmount
    return () => {
      const isNavigatingWithinFlow = sessionStorage.getItem('navigatingWithinStoryFlow') === 'true'
      
      if (!isNavigatingWithinFlow) {
        // Not navigating within the flow - cleanup localStorage
        cleanupLocalStorage()
        sessionStorage.removeItem('inStoryEditFlow')
      }
      // Don't remove navigatingWithinStoryFlow flag here - let destination component handle it
    }
  }, [])

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    
    if (!isAnonymous && (!authorName || !authorName.trim())) {
      setNameError('Please enter your name or select anonymous submission.')
      return
    }
    
    // Update localStorage with current form data before navigation
    const saved = localStorage.getItem('editStoryData')
    const base = saved ? JSON.parse(saved) : {}
    const storyData = { 
      ...base, 
      title, 
      tags, 
      isAnonymous, 
      authorName,
      editId: storyId
    }
    localStorage.setItem('editStoryData', JSON.stringify(storyData))
    
    // Set flag to preserve data during navigation within the flow
    sessionStorage.setItem('navigatingWithinStoryFlow', 'true')
    
    router.push(`/edit/story/${storyId}/step2`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading story data...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800">{error}</div>
        <button 
          onClick={() => {
            cleanupLocalStorage()
            sessionStorage.removeItem('inStoryEditFlow')
            router.push('/profile')
          }} 
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          ← Back to Profile
        </button>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Editing Story</h2>
        <p className="text-blue-600">You are editing an existing story. Any changes will update the original story.</p>
      </div>
      <form onSubmit={next} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Story Title *</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder="Give your story a compelling title..." 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <Select
            isMulti
            name="tags"
            options={STORY_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
            value={STORY_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })).filter(opt => tags.includes(opt.value))}
            onChange={selected => setTags(selected ? selected.map((opt: any) => opt.value) : [])}
            classNamePrefix="react-select"
            placeholder="Select tags..."
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">{tag}</span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
          <Input
            type="text"
            placeholder="Enter your name"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            disabled={isAnonymous || (session?.user?.name ? true : false)}
          />
          {nameError && !isAnonymous && (
            <p className="text-xs text-red-600 mt-1">{nameError}</p>
          )}
          {session?.user?.name && !isAnonymous && (
            <p className="text-xs text-gray-500 mt-1">This is your profile name. You cannot change it.</p>
          )}
          {isAnonymous && (
            <p className="text-xs text-gray-500 mt-1">Name is hidden when submitting anonymously.</p>
          )}
        </div>
        <div className="flex items-center">
          <input 
            id="anon" 
            type="checkbox" 
            checked={isAnonymous} 
            onChange={(e) => setIsAnonymous(e.target.checked)} 
            className="h-4 w-4 text-primary border-gray-300 rounded" 
          />
          <label htmlFor="anon" className="ml-2 text-sm text-gray-700">Submit anonymously</label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">Continue to writing →</Button>
        </div>
      </form>
    </div>
  )
}