'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Select from 'react-select'
import { STORY_TAGS } from '@/lib/tagOptions'

export default function StoryStep1() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
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
    // Check session for user name
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data && data.user && data.user.name) {
          setUserName(data.user.name)
          setIsLoggedIn(true)
          setAuthorName(data.user.name)
        }
      })
      .catch(() => {})
  }, [])

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (!isAnonymous && (!authorName || !authorName.trim())) {
      setNameError('Please enter your name or select anonymous submission.')
      return
    }
    const saved = localStorage.getItem('draftStory')
    const base = saved ? JSON.parse(saved) : {}
    localStorage.setItem('draftStory', JSON.stringify({ ...base, title, tags, isAnonymous, authorName }))
    router.push('/submit/story/step2')
  }

  return (
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
  )
}


