'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'

import { useSession } from 'next-auth/react'
import { Input, Button } from '@/components/ui'

function BlogStep1() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')

  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadBlogForEditing = useCallback(async (blogId: string) => {
    if (!session || status !== 'authenticated') return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/blogs?id=${blogId}`)
      if (response.ok) {
        const data = await response.json()
        const blog = data.blog
        
        if (blog) {
          setTitle(blog.title || '')

          setIsAnonymous(blog.authorName === 'Anonymous')
          setAuthorName(blog.authorName || session.user.name || '')
          
          // Save to localStorage for consistency
          const storyData = {
            title: blog.title || '',
            isAnonymous: blog.authorName === 'Anonymous',
            authorName: blog.authorName || session.user.name || '',
            content: blog.content || null,
            contentHtml: blog.contentHtml || '',
            characterCount: 0,
            editId: blogId
          }
          localStorage.setItem('draftBlog', JSON.stringify(storyData))
        }
      }
    } catch (error) {
      console.error('Error loading blog for editing:', error)
    } finally {
      setLoading(false)
    }
  }, [session, status]);

  useEffect(() => {
    const editIdFromUrl = searchParams.get('edit')
    setEditId(editIdFromUrl)
    
    if (editIdFromUrl) {
      // Clear any existing draft data when editing
      localStorage.removeItem('draftBlog')
      localStorage.setItem('currentBlogEditId', editIdFromUrl)
      loadBlogForEditing(editIdFromUrl)
    } else {
      // Load from localStorage for new blogs
      const saved = localStorage.getItem('draftBlog')
      if (saved) {
        try {
          const d = JSON.parse(saved)
          if (d.title) setTitle(d.title)

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
  }, [searchParams, session, authorName, loadBlogForEditing])
  
  const next = (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (!isAnonymous && (!authorName || !authorName.trim())) {
      setNameError('Please enter your name or select anonymous submission.')
      return
    }
    const saved = localStorage.getItem('draftBlog')
    const base = saved ? JSON.parse(saved) : {}
    // Preserve all existing data including content from step2
    const storyData = { 
      ...base, 
      title, 
      isAnonymous, 
      authorName,
      // Preserve content, contentHtml, and characterCount if they exist
      content: base.content || null,
      contentHtml: base.contentHtml || '',
      characterCount: base.characterCount || 0,
      ...(editId && { editId })
    }
    localStorage.setItem('draftBlog', JSON.stringify(storyData))
    
    const nextUrl = editId ? `/submit/blog/step2?edit=${editId}` : '/submit/blog/step2'
    router.push(nextUrl)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading blog data...</div>
      </div>
    )
  }
  
  return (
    <div>
      {editId && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Editing Blog</h2>
          <p className="text-blue-600">You are editing an existing blog. Any changes will update the original blog.</p>
        </div>
      )}
      <form onSubmit={next} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Blog Title *</label>
        <Input value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="Give your blog a compelling title..." />
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
          <p className="text-xs text-blue-600 mt-1">{nameError}</p>
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

export default function BlogStep1Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
      <BlogStep1 />
    </Suspense>
  )
}


