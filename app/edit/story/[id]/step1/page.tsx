'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Select from 'react-select'
import { STORY_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'

export default function EditStoryStep1() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const storyId = params.id as string

  // Save to localStorage whenever form data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storyId) {
      const saved = localStorage.getItem('editStoryData')
      const base = saved ? JSON.parse(saved) : {}
      const updatedData = {
        ...base,
        title,
        tags,
        isAnonymous,
        authorName,
        editId: storyId
      }
      localStorage.setItem('editStoryData', JSON.stringify(updatedData))
    }
  }, [title, tags, isAnonymous, authorName, storyId])

  // Separate useEffect for localStorage loading to avoid race conditions
  useEffect(() => {
    // Check if we have localStorage data for this story first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editStoryData')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          if (data.editId === storyId) {
            // Load data from localStorage
            setTitle(data.title || '')
            setTags(data.tags || [])
            setIsAnonymous(data.isAnonymous || false)
            setAuthorName(data.authorName || '')
            return // Exit early if localStorage data is loaded
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e)
        }
      }
    }
  }, [storyId])

  // Separate useEffect for API loading and session handling
  useEffect(() => {
    // Only proceed if session is loaded
    if (status === 'loading') return
    
    // Check if we already have localStorage data to avoid API call
    let hasLocalStorageData = false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editStoryData')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          if (data.editId === storyId) {
            hasLocalStorageData = true
          }
        } catch (e) {}
      }
    }
    
    // Only load from API if we don't have localStorage data and session is authenticated
    if (!hasLocalStorageData && status === 'authenticated') {
      loadStoryForEditing(storyId)
    }
    
    // Check session for user name
    if (session?.user?.name) {
      setUserName(session.user.name)
      setIsLoggedIn(true)
      if (!authorName && !hasLocalStorageData) {
        setAuthorName(session.user.name)
      }
    }
  }, [session, storyId, status, authorName])
  
  const loadStoryForEditing = async (storyId: string) => {
    if (!session || status !== 'authenticated') {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/stories?id=${storyId}`)
      if (response.ok) {
        const data = await response.json()
        const story = data.story
        
        if (story) {
          // Check if user can edit this story
          const storyAuthorId = story.author?.toString() || story.author
          if (storyAuthorId !== session?.user?.id && story.authorName !== session?.user?.name) {
            setError('You do not have permission to edit this story')
            return
          }
          
          setTitle(story.title || '')
          setTags(story.tags || [])
          setIsAnonymous(story.authorName === 'Anonymous')
          setAuthorName(story.authorName || session.user.name || '')
          
          // Save to localStorage for future edits
          const storyData = {
            title: story.title || '',
            tags: story.tags || [],
            isAnonymous: story.authorName === 'Anonymous',
            authorName: story.authorName || session.user.name || '',
            content: story.content || null,
            contentHtml: story.contentHtml || '',
            characterCount: 0,
            editId: storyId
          }
          localStorage.setItem('editStoryData', JSON.stringify(storyData))
        }
      } else {
        const errorData = await response.text()
        setError(`Failed to load story: ${response.status}`)
      }
    } catch (error) {
      console.error('Error loading story for editing:', error)
      setError('Failed to load story data')
    } finally {
      setLoading(false)
    }
  }

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (!isAnonymous && (!authorName || !authorName.trim())) {
      setNameError('Please enter your name or select anonymous submission.')
      return
    }
    const saved = localStorage.getItem('editStoryData')
    const base = saved ? JSON.parse(saved) : {}
    // Preserve all existing data including content from step2
    const storyData = { 
      ...base, 
      title, 
      tags, 
      isAnonymous, 
      authorName,
      // Preserve content, contentHtml, and characterCount if they exist
      content: base.content || null,
      contentHtml: base.contentHtml || '',
      characterCount: base.characterCount || 0,
      editId: storyId
    }
    localStorage.setItem('editStoryData', JSON.stringify(storyData))
    
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
        <input value={title} onChange={(e)=>setTitle(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Give your story a compelling title..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <Select
          isMulti
          name="tags"
          options={STORY_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
          value={STORY_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })).filter(opt => tags.includes(opt.value))}
          onChange={selected => setTags(selected ? selected.map((opt:any) => opt.value) : [])}
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
        <input
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          placeholder="Enter your name"
          value={authorName}
          onChange={e => setAuthorName(e.target.value)}
          disabled={isAnonymous || isLoggedIn}
        />
        {nameError && !isAnonymous && (
          <p className="text-xs text-red-600 mt-1">{nameError}</p>
        )}
        {isLoggedIn && !isAnonymous && (
          <p className="text-xs text-gray-500 mt-1">This is your profile name. You cannot change it.</p>
        )}
        {isAnonymous && (
          <p className="text-xs text-gray-500 mt-1">Name is hidden when submitting anonymously.</p>
        )}
      </div>
      <div className="flex items-center">
        <input id="anon" type="checkbox" checked={isAnonymous} onChange={(e)=>setIsAnonymous(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded" />
        <label htmlFor="anon" className="ml-2 text-sm text-gray-700">Submit anonymously</label>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">Continue to writing →</button>
      </div>
    </form>
    </div>
  )
}