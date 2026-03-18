'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useSession } from '@/lib/auth/client'
import { Input, Button } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'

export default function EditBlogStep1() { const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')

  const [isAnonymous, setIsAnonymous] = useState(false)
  const [nameError, setNameError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const localePath = useLocalizedPath()
  const blogId = params?.id as string

  // Cleanup function to clear localStorage when leaving the blog editing flow
  const cleanupLocalStorage = () => { localStorage.removeItem('editBlogData')
    localStorage.removeItem('currentBlogEditId') }

  useEffect(() => { if (status === 'loading') return
    if (!session) { router.push(localePath('/auth/signin')) } }, [status, session, router, localePath])

  // Load blog data - prioritize localStorage over API when navigating within flow
  useEffect(() => { const loadBlogData = async () => { if (!blogId || status === 'loading') return
      
      if (status !== 'authenticated') { setError('Bloqları redaktə etmək üçün daxil olun.')
        setLoading(false)
        return }

      try { setLoading(true)
        
        // First, check if we have valid localStorage data
        const saved = localStorage.getItem('editBlogData')
        const inEditFlow = sessionStorage.getItem('inBlogEditFlow') === 'true'
        
        if (saved && inEditFlow) { try { const localData = JSON.parse(saved)
            if (localData.editId === blogId) { // Use localStorage data when navigating within the editing flow
              setTitle(localData.title || '')

              setIsAnonymous(localData.isAnonymous || false)
              setAuthorName(localData.authorName || '')
              setLoading(false)
              return } } catch (e) { console.error('Error parsing localStorage data:', e) } }
        
        // If no valid localStorage data, fetch from API
        const response = await fetch(`/api/blogs?id=${blogId}`, { method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', }, })

        if (response.ok) { const data = await response.json()
          const blog = data.blog

          if (blog) { // Check if user can edit this blog
            const storyAuthorId = blog.author?.toString() || blog.author
            if (storyAuthorId !== session?.user?.id && blog.authorName !== session?.user?.name) { setError('Bu bloqu redaktə etmək icazəniz yoxdur')
              setLoading(false)
              return }

            // Set form fields
            setTitle(blog.title || '')

            setIsAnonymous(blog.isAnonymous || false)
            setAuthorName(blog.isAnonymous ? 'Anonim' : (blog.authorName || session?.user?.name || ''))

            // Save complete blog data to localStorage
            const storyData = { title: blog.title || '',
              isAnonymous: blog.isAnonymous || false,
              authorName: blog.isAnonymous ? 'Anonim' : (blog.authorName || session?.user?.name || ''),
              content: blog.content || null,
              contentHtml: blog.contentHtml || '',
              characterCount: 0,
              editId: blogId }
            
            // Clear any existing blog edit data first
            localStorage.removeItem('editBlogData')
            localStorage.removeItem('draftBlog')
            localStorage.removeItem('currentBlogDraftId')
            localStorage.removeItem('currentBlogEditId')
            localStorage.removeItem('blogStep1Data')
            localStorage.removeItem('blogStep2Data')
            
            // Save new data
            localStorage.setItem('editBlogData', JSON.stringify(storyData))
            localStorage.setItem('currentBlogEditId', blogId) } else { setError('Bloq tapılmadı.') } } else { const errorText = await response.text()
          console.error('Bloq məlumatlarını almaq alınmadı:', response.status, response.statusText, errorText)
          setError(`Bloqu yükləmək alınmadı: ${response.status}`) } } catch (error) { console.error('Bloq məlumatlarını alma xətası:', error)
        setError('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.') } finally { setLoading(false) } }

    loadBlogData() }, [blogId, status, session])

  // Update localStorage whenever form data changes
  useEffect(() => { if (typeof window !== 'undefined' && blogId && !loading) { const saved = localStorage.getItem('editBlogData')
      if (saved) { try { const base = JSON.parse(saved)
          const updatedData = { ...base,
            title,

            isAnonymous,
            authorName,
            editId: blogId }
          localStorage.setItem('editBlogData', JSON.stringify(updatedData)) } catch (e) { console.error('Error updating localStorage:', e) } } } }, [title, isAnonymous, authorName, blogId, loading])

  // Cleanup localStorage when component unmounts (user navigates away)
  useEffect(() => { // Set a flag that we're currently in the blog editing flow
    sessionStorage.setItem('inBlogEditFlow', 'true')
    
    // Cleanup on component unmount
    return () => { const isNavigatingWithinFlow = sessionStorage.getItem('navigatingWithinBlogFlow') === 'true'
      
      if (!isNavigatingWithinFlow) { // Not navigating within the flow - cleanup localStorage
        cleanupLocalStorage()
        sessionStorage.removeItem('inBlogEditFlow') }
      // Don't remove navigatingWithinBlogFlow flag here - let destination component handle it
    }
  }, [])

  if (status === 'loading') { return <LoadingState text={'Yüklənir'} /> }

  const next = (e: React.FormEvent) => { e.preventDefault()
    setNameError('')
    
    // Validation: If not anonymous and no name provided, check if session name exists
    if (!isAnonymous && !authorName?.trim() && !session?.user?.name) { setNameError('Zəhmət olmasa adınızı daxil edin və ya anonim göndərişi seçin.')
      return }
    
    // Update localStorage with current form data before navigation
    const saved = localStorage.getItem('editBlogData')
    const base = saved ? JSON.parse(saved) : {}
    const storyData = { ...base, 
      title, 
       
      isAnonymous, 
      authorName: authorName || session?.user?.name, // Use custom name or fall back to session name
      editId: blogId }
    localStorage.setItem('editBlogData', JSON.stringify(storyData))
    
    // Set flag to preserve data during navigation within the flow
    sessionStorage.setItem('navigatingWithinBlogFlow', 'true')
    
    router.push(localePath(`/edit/blog/${blogId}/step2`)) }

  if (loading) { return <LoadingState text="Bloq məlumatları yüklənir..." /> }
  
  if (error) { return (
      <ErrorState 
        title="Bloq yüklənərkən xəta"
        message={error}
        retryText="Profilə qayıt"
        onRetry={() => { cleanupLocalStorage()
          sessionStorage.removeItem('inBlogEditFlow')
          router.push(localePath("/profile")) }}
      />
    ) }
  
  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Bloq redaktəsi</h2>
        <p className="text-blue-600">Mövcud bloqu redaktə edirsiniz. Dəyişikliklər orijinal bloqu yeniləyəcək.</p>
      </div>
      <form onSubmit={next} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bloq başlığı *</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder={'Bloqunuza cəlbedici başlıq verin...'} 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sənin adın</label>
          <Input
            type="text"
            placeholder={'Adınızı daxil edin (və ya profil adınızdan istifadə etmək üçün boş buraxın)'}
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            disabled={isAnonymous}
          />
          {nameError && !isAnonymous && (
            <p className="text-xs text-red-600 mt-1">{nameError}</p>
          )}
          {!isAnonymous && (
            <p className="text-xs text-gray-500 mt-1">
              {authorName && authorName !== session?.user?.name
                ? 'Bloqda fərdi adın göstəriləcək' 
                : session?.user?.name 
                  ? `Boş buraxsan profil adın "${session.user.name}" istifadə olunacaq`
                  : 'Bloqda görünməsini istədiyin adı daxil et'}
            </p>
          )}
          {isAnonymous && (
            <p className="text-xs text-gray-500 mt-1">Anonim göndərdikdə ad gizlədilir.</p>
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
          <label htmlFor="anon" className="ml-2 text-sm text-gray-700">Anonim göndər</label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">Yazı mərhələsinə keç →</Button>
        </div>
      </form>
    </div>
  ) }