'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { blogQueryKeys, dislikeBlog, fetchBlogReactions, likeBlog } from '@/lib/blogQueries'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

interface BlogReactionsContainerProps { blogSlug: string
  initialLikes?: number
  initialDislikes?: number
  className?: string }

export default function BlogReactionsContainer({ blogSlug,
  initialLikes = 0,
  initialDislikes = 0,
  className = '' }: BlogReactionsContainerProps) { const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const queryClient = useQueryClient()
  const isOrgAccount = session?.user?.accountType === 'organization'
  const isRegularUser = session?.user?.accountType === 'user'

  const defaultReactionState = useMemo(() => ({
    likes: initialLikes,
    dislikes: initialDislikes,
    hasLiked: false,
    hasDisliked: false
  }), [initialLikes, initialDislikes])

  const reactionsQuery = useQuery({
    queryKey: blogQueryKeys.reactions(blogSlug),
    queryFn: () => fetchBlogReactions(blogSlug),
    enabled: !!session?.user?.id && isRegularUser,
    initialData: defaultReactionState
  })

  const requireAuth = useRequireAuth()

  const likeMutation = useMutation({
    mutationFn: () => likeBlog(blogSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.reactions(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all })
    }
  })

  const dislikeMutation = useMutation({
    mutationFn: () => dislikeBlog(blogSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.reactions(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all })
    }
  })

  const reactionState = reactionsQuery.data || defaultReactionState
  const isLoading = likeMutation.isPending || dislikeMutation.isPending

  const handleLike = () => {
    if (!requireAuth()) return
    if (!isRegularUser) { showError('Yalnız fərdi hesablar reaksiya verə bilər')
      return }
    likeMutation.mutate() }

  const handleDislike = () => {
    if (!requireAuth()) return
    if (!isRegularUser) { showError('Yalnız fərdi hesablar reaksiya verə bilər')
      return }
    dislikeMutation.mutate() }

  if (status !== 'loading' && isOrgAccount) { return null }

  if (status === 'loading') { return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Loading variant="pulse" size="md" className="rounded-xl border border-blue-100" />
      </div>
    ) }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Like Button */}
      <Button
        variant="ghost"
        className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${reactionState.hasLiked ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]' : 'bg-white border-2 border-blue-100 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleLike}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loading size="md" variant="spinner" color="current" />
        ) : (
          <ThumbsUp className={`w-5 h-5 transition-transform duration-200 ${reactionState.hasLiked ? 'fill-current' : 'group-hover:scale-110'}`} />
        )}
        <span className="text-sm font-bold min-w-[20px] text-center">{reactionState.likes}</span>
        {reactionState.hasLiked && !isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-bounce"></div>
        )}
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${reactionState.hasDisliked ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-[1.02]' : 'bg-white border-2 border-blue-100 text-gray-700 hover:border-red-500 hover:text-red-600 hover:shadow-md hover:-translate-y-0.5'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleDislike}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loading size="md" variant="spinner" color="current" />
        ) : (
          <ThumbsDown className={`w-5 h-5 transition-transform duration-200 ${reactionState.hasDisliked ? 'fill-current' : 'group-hover:scale-110'}`} />
        )}
        <span className="text-sm font-bold min-w-[20px] text-center">{reactionState.dislikes}</span>
        {reactionState.hasDisliked && !isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-bounce"></div>
        )}
      </Button>
    </div>
  ) }
