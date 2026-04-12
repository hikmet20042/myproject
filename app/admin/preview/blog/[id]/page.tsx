'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, User, Calendar, FileText, Heart, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, ErrorState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import AdminListLayout from '@/components/admin/AdminListLayout'

const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })

type Blog = { _id: string
  title: string
  content: any
  contentHtml?: string
  abstract?: string
  author?: string | { _id: string; name?: string; email?: string } // Can be string (ID) or populated object
  authorName?: string
  isAnonymous?: boolean
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  createdAt: string
  updatedAt?: string
  publishedAt?: string
  submittedAt?: string
  views?: number
  likes?: number
  category?: string }

const REJECTION_TEMPLATES = [
  'Məzmun keyfiyyəti yetərli deyil. Daha konkret faktlar və daha aydın struktur əlavə edin.',
  'Platforma qaydalarına uyğunluq problemi var. Zəhmət olmasa həssas məlumatları çıxarın.',
  'Formatlama problemi var. Başlıq/mətn axını və oxunaqlılığı yaxşılaşdırın.',
]

export default function AdminStoryPreview({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showError, showSuccess } = useGlobalFeedback()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const localePath = useLocalizedPath()
  const [isProcessing, setIsProcessing] = useState(false)

  const loadStory = useCallback(async () => { try { setLoading(true)
      const response = await fetch(`/api/admin/blogs/${params.id}`)
      
      if (!response.ok) { throw new Error('Bloqu yükləmək mümkün olmadı') }
      
      const data = await response.json()
      setBlog(data?.data?.blog || null) } catch (error) { console.error('Error loading blog:', error)
      setError('Bloqu yükləmək mümkün olmadı') } finally { setLoading(false) } }, [params.id])

  useEffect(() => { loadStory() }, [loadStory])

  const getStatusBadge = (status: string) => { switch (status) { case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {'Təsdiqlənib'}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {'Rədd edilib'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {'Gözləmədə'}
          </span>
        ) } }

  if (loading) { return <LoadingState text={'Bloq önizləməsi yüklənir...'} /> }

  if (error || !blog) { return (
      <ErrorState 
        title={'Bloq tapılmadı'}
        message={error || 'Axtardığınız bloq mövcud deyil.'}
        retryText={'Adminə Qayıt'}
          onRetry={() => router.push(localePath("/admin/blogs"))}
      />
    ) }

  const handleAction = (type: 'approve' | 'reject') => { setActionType(type)
    setAdminComment(blog?.adminComment || '')
    setShowModal(true) }

  const handleSubmitAction = async () => { if (!blog || !actionType) return
    
    if (actionType === 'reject' && !adminComment.trim()) { showError('Rədd səbəbini qeyd edin')
      return }
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blog._id}`, { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType === 'approve' ? 'approved' : 'rejected',
          adminComment: adminComment.trim() || null }) })

      const data = await response.json()

      if (response.ok) { setBlog(data?.data?.blog || null)
        setShowModal(false)
        setActionType(null)
        setAdminComment('')
        showSuccess(actionType === 'approve' 
          ? 'Bloq uğurla təsdiqləndi!'
          : 'Bloq uğurla rədd edildi!'
        ) } else { console.error('API Error:', data)
        showError('Bloqu yeniləmək alınmadı') } } catch (error) { console.error('Error updating blog:', error)
      showError('Bloqu yeniləyərkən xəta baş verdi') } finally { setIsProcessing(false) } }

  const publishedDate = blog.publishedAt || blog.submittedAt || blog.createdAt
  
  // Handle author display - author is now populated with name, email, and _id
  const authorObject = typeof blog.author === 'object' ? blog.author : null
  const authorDisplay = blog.isAnonymous 
    ? 'Anonim'
    : (authorObject?.name || authorObject?.email || blog.authorName || 'Naməlum müəllif')
  
  const authorId = authorObject?._id || null

  return (
    <AdminListLayout title="Bloq Önizləmə" description="Moderasiya üçün bloq önizləməsi." className="space-y-0">
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      {/* Header */}
      <div className="relative z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={localePath("/admin/blogs")} 
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {'Adminə Qayıt'}
            </Link>
            <div className="flex items-center space-x-3">
              {getStatusBadge(blog.status)}
              <span className="text-sm text-gray-500">{'Önizləmə rejimi'}</span>
              {/* Admin Actions */}
              {blog.status === 'pending' && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAction('approve')}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center text-xs"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {'Təsdiqlə'}
                  </Button>
                  <Button
                    onClick={() => handleAction('reject')}
                    variant="danger"
                    size="sm"
                    className="inline-flex items-center text-xs"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {'Rədd Et'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Story Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {blog.title}
            </h1>
            
            {/* blog Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {blog.isAnonymous ? (
                  authorDisplay
                ) : authorId ? (
                  <Link 
                    href={`/profile/${authorId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    target="_blank"
                  >
                    {authorDisplay}
                  </Link>
                ) : (
                  authorDisplay
                )}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(publishedDate).toLocaleDateString('az-AZ', { year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' })}
              </div>
              {blog.views !== undefined && (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {blog.views} {'baxış'}
                </div>
              )}
              {blog.likes !== undefined && (
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {blog.likes} {'bəyənmə'}
                </div>
              )}
            </div>

            {/* Category */}
            {blog.category && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {blog.category}
                </span>
              </div>
            )}



            {/* Abstract */}
            {blog.abstract && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {'Xülasə'}
                </h3>
                <p className="text-gray-700 leading-relaxed">{blog.abstract}</p>
              </div>
            )}

            {/* Admin Comment */}
            {blog.adminComment && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">{'İdarəçi şərhi'}</h3>
                <p className="text-red-700">{blog.adminComment}</p>
              </div>
            )}
          </div>

          {/* blog Content */}
          <div className="px-6 py-8">
                <div className="prose max-w-none">
              {blog.content && typeof blog.content === 'object' ? (
                <BlocknoteReadOnly initialJSON={blog.content} />
              ) : blog.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.contentHtml) }} />
              ) : blog.content && typeof blog.content === 'string' ? (
                <div className="whitespace-pre-wrap leading-relaxed">{blog.content}</div>
              ) : (
                <p className="text-gray-500 italic">{'Məzmun mövcud deyil.'}</p>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* Admin Action Modal */}
      <Dialog.Root
        open={showModal}
        onOpenChange={(open) => { if (!open) setShowModal(false) }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-600/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-5 shadow-lg">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  {actionType === 'approve' ? 'Məzmunu Təsdiq Et' : 'Məzmunu Rədd Et'}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </Dialog.Close>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Şərh' + ' (' + 'ixtiyari' + ')' : 'Rədd etmə səbəbi...'}
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {REJECTION_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      type="button"
                      className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] text-gray-600 hover:border-red-300 hover:text-red-700"
                      onClick={() => setAdminComment(template)}
                    >
                      {'Şablon'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={actionType === 'approve' ? 'Şərh əlavə edin...' : 'Rədd etmə səbəbi...'}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Dialog.Close asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isProcessing}
                  >
                    {'Ləğv Et'}
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleSubmitAction}
                  disabled={isProcessing}
                  variant={actionType === 'approve' ? 'primary' : 'danger'}
                  size="sm"
                >
                  {isProcessing ? 'Emal olunur...' : (actionType === 'approve' ? 'Təsdiq Et' : 'Rədd Et')}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
    </AdminListLayout>
  ) }
