'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { Input, Button, ButtonLink } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { FileText, User, ChevronRight, Edit3, Sparkles } from 'lucide-react'
import { AnimatedBackground, ProgressIndicator, GradientHero, LoadingState } from '@/components/shared'

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
  const { t } = useLanguage()
  const localePath = useLocalizedPath()

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
    const editIdFromUrl = searchParams?.get('edit') || null
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
    // Validation: If not anonymous and no name provided, use session name
    // Only show error if they're trying to submit without any name available
    if (!isAnonymous && !authorName?.trim() && !userName) {
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
      authorName: authorName || userName, // Use custom name or fall back to username
      // Preserve content, contentHtml, and characterCount if they exist
      content: base.content || null,
      contentHtml: base.contentHtml || '',
      characterCount: base.characterCount || 0,
      ...(editId && { editId })
    }
    localStorage.setItem('draftBlog', JSON.stringify(storyData))
    
    const nextUrl = editId ? `/submit/blog/step2?edit=${editId}` : '/submit/blog/step2'
    router.push(localePath(nextUrl))
  }

  if (loading) {
    return (
      <LoadingState
        text={t('submitBlog.loadingBlogData')}
        gradientFrom="from-pink-50"
        gradientVia="via-purple-50"
        gradientTo="to-indigo-50"
        spinnerColor="border-pink-500"
      />
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-8 sm:py-12">
      {/* Animated Background */}
      <AnimatedBackground
        colors={{
          blob1: 'bg-blue-300',
          blob2: 'bg-indigo-300',
          blob3: 'bg-purple-300'
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={1} totalSteps={2} percentage={50} />

        {/* Edit Mode Banner */}
        {editId && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl border-2 border-blue-300 animate-slide-in-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{t('submitBlog.editingBlogTitle')}</h2>
                <p className="text-blue-100 text-sm sm:text-base">{t('submitBlog.editingBlogDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden animate-scale-in">
          {/* Hero Header */}
          <div className="relative">
          <GradientHero
            icon={FileText}
            badge={{ icon: Sparkles, text: t('submitBlog.shareYourStory') || "Share Your Story" }}
            title={editId ? (t('submitBlog.editYourBlogPost') || 'Edit Your Blog Post') : (t('submitBlog.step1Title') || 'Blog Details')}
            subtitle={t('submitBlog.step1Description') || 'Let\'s start with the basics. Tell us about your blog post.'}
              gradientFrom="from-blue-600"
              gradientVia="via-indigo-600"
              gradientTo="to-purple-700"
              showWave={false}
            />
          </div>

          {/* Form */}
          <form onSubmit={next} className="px-6 sm:px-8 py-8 space-y-8">
            {/* Title Field */}
            <div className="space-y-3 animate-fade-in">
              <label className="flex items-center gap-2 text-base font-bold text-gray-900">
                <FileText className="w-5 h-5 text-blue-600" />
                {t('submitBlog.titleLabel')}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  value={title} 
                  onChange={(e)=>setTitle(e.target.value)} 
                  required 
                  placeholder={t('submitBlog.titlePlaceholder')}
                  className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {title.length}/100
                </div>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>{t('submitBlog.titleHint') || "Choose a compelling title that captures your story's essence"}</span>
              </p>
            </div>

            {/* Author Name Field */}
            <div className="space-y-3 animate-fade-in animation-delay-200">
              <label className="flex items-center gap-2 text-base font-bold text-gray-900">
                <User className="w-5 h-5 text-indigo-600" />
                {t('submitBlog.yourName')}
              </label>
              <Input
                type="text"
                placeholder={t('submitBlog.yourNamePlaceholder')}
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                disabled={isAnonymous}
                className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {nameError && !isAnonymous && (
                <p className="text-sm text-red-600 flex items-center gap-2 animate-shake">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {nameError}
                </p>
              )}
              {!isAnonymous && (
                <p className="text-sm text-gray-600 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  {authorName && authorName !== userName 
                    ? t('submitBlog.customNameWillBeDisplayed') 
                    : userName 
                      ? t('submitBlog.profileNameWillBeUsed', { name: userName })
                      : t('submitBlog.enterNameHint')}
                </p>
              )}
              {isAnonymous && (
                <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {t('submitBlog.anonymousNameHidden')}
                </p>
              )}
            </div>

            {/* Anonymous Checkbox */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-300 animate-fade-in animation-delay-400">
              <div className="flex items-start gap-4">
                <div className="flex items-center h-6">
                  <Input 
                    id="anon" 
                    type="checkbox" 
                    checked={isAnonymous} 
                    onChange={(e)=>setIsAnonymous(e.target.checked)} 
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="anon" className="text-base font-semibold text-gray-900 cursor-pointer">
                    {t('submitBlog.submitAnonymously')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('submitBlog.anonymousDescription') || 'Your identity will be protected. Only "Anonymous" will be shown.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 animate-fade-in animation-delay-600">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                {t('submitBlog.nextWriteContent') || 'Next: Write your content'}
              </div>
              <Button 
                type="submit" 
                variant="gradient-blue"
                size="lg"
                icon={ChevronRight}
                iconPosition="right"
                shadow="lg"
                hoverEffect="scale"
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {t('submitBlog.continueToWriting')}
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600 animate-fade-in animation-delay-800">
          <p>
            {t('submitBlog.needHelp') || 'Need help?'}{' '}
            <a href={localePath('/resources')} className="text-blue-600 hover:text-blue-700 font-semibold underline">
              {t('submitBlog.visitResources') || 'Visit our resources'}
            </a>
          </p>
        </div>
      </div>
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


