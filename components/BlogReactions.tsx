'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { ButtonLink } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

interface BlogReactionsProps {
  blogId: string
  initialLikes?: number
  initialDislikes?: number
  className?: string
}

export default function BlogReactions({
  blogId,
  initialLikes = 0,
  initialDislikes = 0,
  className = ''
}: BlogReactionsProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const localePath = useLocalizedPath()
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasDisliked, setHasDisliked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current user's reaction status
  const dataFetchedRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.id) return
    if (dataFetchedRef.current) return
    dataFetchedRef.current = true

    const fetchReactionStatus = async () => {
      try {
        const [likeRes, dislikeRes] = await Promise.all([
          fetch(`/api/blogs/${blogId}/like`),
          fetch(`/api/blogs/${blogId}/dislike`)
        ])

        if (likeRes.ok) {
          const likeData = await likeRes.json()
          setHasLiked(likeData.hasLiked)
          setLikes(likeData.likes)
        }

        if (dislikeRes.ok) {
          const dislikeData = await dislikeRes.json()
          setHasDisliked(dislikeData.hasDisliked)
          setDislikes(dislikeData.dislikes)
        }
      } catch (error) {
        console.error('Error fetching reaction status:', error)
      }
    }

    fetchReactionStatus()
  }, [blogId, session])

  const handleLike = async () => {
    if (!session?.user?.id) {
      alert(t('reactions.pleaseSignInToLike'))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/blogs/${blogId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setDislikes(data.dislikes)
        setHasLiked(data.hasLiked)
        setHasDisliked(data.hasDisliked)
      }
    } catch (error) {
      console.error('Error liking blog:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDislike = async () => {
    if (!session?.user?.id) {
      alert(t('reactions.pleaseSignInToDislike'))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/blogs/${blogId}/dislike`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setDislikes(data.dislikes)
        setHasLiked(data.hasLiked)
        setHasDisliked(data.hasDisliked)
      }
    } catch (error) {
      console.error('Error disliking blog:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user?.id) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-4 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-gray-400">
            <ThumbsUp className="w-5 h-5" />
            <span className="text-sm font-semibold">{likes}</span>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-gray-400">
            <ThumbsDown className="w-5 h-5" />
            <span className="text-sm font-semibold">{dislikes}</span>
          </div>
        </div>
        <ButtonLink
          href={localePath('/auth/signin')}
          variant="gradient-indigo"
          size="sm"
          shadow="md"
          hoverEffect="lift"
        >
          Sign in to react
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${hasLiked
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ThumbsUp
            className={`w-5 h-5 transition-transform duration-200 ${hasLiked ? 'fill-current' : 'group-hover:scale-110'
              }`}
          />
        )}
        <span className="text-sm font-bold min-w-[20px] text-center">
          {likes}
        </span>
        {hasLiked && !isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-bounce"></div>
        )}
      </button>

      {/* Dislike Button */}
      <button
        onClick={handleDislike}
        disabled={isLoading}
        className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${hasDisliked
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-600 hover:shadow-md hover:-translate-y-0.5'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ThumbsDown
            className={`w-5 h-5 transition-transform duration-200 ${hasDisliked ? 'fill-current' : 'group-hover:scale-110'
              }`}
          />
        )}
        <span className="text-sm font-bold min-w-[20px] text-center">
          {dislikes}
        </span>
        {hasDisliked && !isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-bounce"></div>
        )}
      </button>
    </div>
  )
}
