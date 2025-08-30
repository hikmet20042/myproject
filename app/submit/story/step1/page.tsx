'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Select from 'react-select'
import { STORY_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'
import { Input, Button } from '@/components/ui'

function StoryStep1() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStoryForEditing = useCallback(async (storyId: string) => {
    if (!session || status !== 'authenticated') return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/stories?id=${storyId}`)
      if (response.ok) {
        const data = await response.json()
        const story = data.story
        
        if (story) {
          setTitle(story.title || '')
          setTags(story.tags || [])
          setIsAnonymous(story.authorName === 'Anonymous')
          setAuthorName(story.authorName || session.user.name || '')
          
          // Save to localStorage for consistency
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
          localStorage.setItem('draftStory', JSON.stringify(storyData))
        }
      }
    } catch (error) {
      console.error('Error loading story for editing:', error)
    } finally {
      setLoading(false)
    }
  }, [session, status]);

  useEffect(() => {
    const editIdFromUrl = searchParams.get('edit')
    setEditId(editIdFromUrl)
    
    if (editIdFromUrl) {
      // Clear any existing draft data when editing
      localStorage.removeItem('draftStory')
      localStorage.setItem('currentStoryEditId', editIdFromUrl)
      loadStoryForEditing(editIdFromUrl)
    } else {
      // Load from localStorage for new stories
      const saved = localStorage.getItem('draftStory')
      if (saved) {
        try {
          const d = JSON.parse(saved)
          if (d.title) setTitle(d.title)
          if (d.tags) setTags(Array.isArray(d.tags) ? d.tags : typeof d.tags === 'string' ? d.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) : [])
          if (typeof d.isAnonymous === 'boolean') setIsAnonymous(d.isAnonymous)
          if (typeof d.authorName === 'string') setAuthorName(d.authorName)
        } catch {}
      }
    }
    
    // Check session for user name
    if (session?.user?.name) {
      setUserName(session.user.name)
      setIsLoggedIn(true)
      if (!editIdFromUrl && !authorName) {
        setAuthorName(session.user.name)
      }
    }
  }, [searchParams, session, authorName, loadStoryForEditing])
  
  const next = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (!isAnonymous && (!authorName || !authorName.trim())) {
      setNameError('Please enter your name or select anonymous submission.')
      return
    }
    const saved = localStorage.getItem('draftStory')
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
      ...(editId && { editId })
    }
    localStorage.setItem('draftStory', JSON.stringify(storyData))
    
    const nextUrl = editId ? `/submit/story/step2?edit=${editId}` : '/submit/story/step2'
    router.push(nextUrl)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading story data...</div>
      </div>
    )
  }
  
  return (
    <div>
      {editId && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Editing Story</h2>
          <p className="text-blue-600">You are editing an existing story. Any changes will update the original story.</p>
        </div>
      )}
      <form onSubmit={next} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Story Title *</label>
        <Input value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="Give your story a compelling title..." />
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
        <Input
          type="text"
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
        <Input id="anon" type="checkbox" checked={isAnonymous} onChange={(e)=>setIsAnonymous(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded" />
        <label htmlFor="anon" className="ml-2 text-sm text-gray-700">Submit anonymously</label>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary">Continue to writing →</Button>
      </div>
    </form>
    </div>
  )
}

export default function StoryStep1Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
      <StoryStep1 />
    </Suspense>
  )
}


