'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
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

  const likeMutation = useMutation({
    mutationFn: () => likeBlog(blogSlug),
    onMutate: async () => {
      const queryKey = blogQueryKeys.reactions(blogSlug)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<typeof defaultReactionState>(queryKey) || defaultReactionState
      const next = previous.hasLiked
        ? {
            ...previous,
            likes: Math.max(0, previous.likes - 1),
            hasLiked: false
          }
        : {
            ...previous,
            likes: previous.likes + 1,
            dislikes: previous.hasDisliked ? Math.max(0, previous.dislikes - 1) : previous.dislikes,
            hasLiked: true,
            hasDisliked: false
          }
      queryClient.setQueryData(queryKey, next)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(blogQueryKeys.reactions(blogSlug), context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(blogQueryKeys.reactions(blogSlug), {
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        hasLiked: !!data.hasLiked,
        hasDisliked: !!data.hasDisliked
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.reactions(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all })
    }
  })

  const dislikeMutation = useMutation({
    mutationFn: () => dislikeBlog(blogSlug),
    onMutate: async () => {
      const queryKey = blogQueryKeys.reactions(blogSlug)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<typeof defaultReactionState>(queryKey) || defaultReactionState
      const next = previous.hasDisliked
        ? {
            ...previous,
            dislikes: Math.max(0, previous.dislikes - 1),
            hasDisliked: false
          }
        : {
            ...previous,
            dislikes: previous.dislikes + 1,
            likes: previous.hasLiked ? Math.max(0, previous.likes - 1) : previous.likes,
            hasDisliked: true,
            hasLiked: false
          }
      queryClient.setQueryData(queryKey, next)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(blogQueryKeys.reactions(blogSlug), context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(blogQueryKeys.reactions(blogSlug), {
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        hasLiked: !!data.hasLiked,
        hasDisliked: !!data.hasDisliked
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.reactions(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(blogSlug) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all })
    }
  })

  const reactionState = reactionsQuery.data || defaultReactionState
  const isLoading = likeMutation.isPending || dislikeMutation.isPending

  const handleLike = () => { if (!session?.user?.id) { showError('Bəyənmək üçün daxil olun')
      router.push(localePath('/auth/signin'))
      return }
    if (!isRegularUser) { showError('Yalnız fərdi hesablar reaksiya verə bilər')
      return }
    likeMutation.mutate() }

  const handleDislike = () => { if (!session?.user?.id) { showError('Bəyənməmək üçün daxil olun')
      router.push(localePath('/auth/signin'))
      return }
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
