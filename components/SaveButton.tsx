'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { Bookmark } from 'lucide-react'
import { Button } from './ui/Button'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

interface SaveButtonProps {
  itemId: string
  itemType: 'event' | 'vacancy' | 'blog'
  itemTitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const keyFor = (itemType: string, itemId: string) => ['saved-item', itemType, itemId]

export default function SaveButton({
  itemId,
  itemType,
  itemTitle = '',
  className = '',
  size = 'sm',
  showText = true,
}: SaveButtonProps) {
  const { data: session, status } = useSession()
  const { showSuccess, showError, showInfo } = useGlobalFeedback()
  const queryClient = useQueryClient()
  const isAuthLoading = status === 'loading'
  const itemTypeLabel = itemType === 'event' ? 'tədbiri' : itemType === 'vacancy' ? 'vakansiyanı' : 'bloqu'

  const saveStatusQuery = useQuery({
    queryKey: keyFor(itemType, itemId),
    enabled: Boolean(itemId && itemType),
    queryFn: async () => {
      const response = await fetch(`/api/content/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}/save`)
      if (!response.ok) return { hasSaved: false, totalSaves: 0 }
      const data = await response.json()
      return {
        hasSaved: Boolean(data?.data?.saved),
        totalSaves: Number(data?.data?.totalSaves || 0),
      }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/content/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}/save`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Save action failed')
      return data?.data || {}
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: keyFor(itemType, itemId) })
      const previous = queryClient.getQueryData<{ hasSaved?: boolean; totalSaves?: number }>(keyFor(itemType, itemId))
      const nextSaved = !previous?.hasSaved
      const prevCount = Number(previous?.totalSaves || 0)
      queryClient.setQueryData(keyFor(itemType, itemId), {
        hasSaved: nextSaved,
        totalSaves: Math.max(0, prevCount + (nextSaved ? 1 : -1)),
      })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(keyFor(itemType, itemId), context.previous)
      showError(`${itemTypeLabel} saxlamaq alınmadı. Yenidən cəhd edin.`)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(keyFor(itemType, itemId), {
        hasSaved: Boolean(data?.saved),
        totalSaves: Number(data?.totalSaves || 0),
      })
      queryClient.invalidateQueries({ queryKey: ['saved-list'] })
      if (data?.action === 'saved') {
        showSuccess('Yadda saxlanıldı')
      } else {
        showSuccess('Saxlanmışlardan silindi')
      }
    },
  })

  const hasSaved = Boolean(saveStatusQuery.data?.hasSaved)
  const totalSaves = Number(saveStatusQuery.data?.totalSaves || 0)
  const loadingState = toggleMutation.isPending

  const handleSave = async () => {
    if (!session?.user?.id) {
      showInfo(`${itemTypeLabel} yadda saxlamaq üçün daxil olun`)
      return
    }
    if (loadingState) return
    try {
      await toggleMutation.mutateAsync()
    } catch {
      return
    }
  }

  if (isAuthLoading) {
    return (
      <Button variant="outline" size={size} disabled className={`inline-flex items-center gap-2 animate-pulse ${className}`}>
        <Bookmark className="w-4 h-4" />
        {showText && <span className="font-medium">{'Yüklənir'}</span>}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleSave}
      variant={hasSaved ? 'primary' : 'outline'}
      size={size}
      disabled={loadingState}
      className={`inline-flex items-center gap-2 transition-all ${hasSaved ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'} ${className}`}
      title={
        !session?.user?.id
          ? `${itemTypeLabel} saxlamaq üçün daxil olun`
          : hasSaved
            ? `Saxlanmış ${itemTypeLabel} siyahısından çıxar`
            : `Bu ${itemTypeLabel} saxla`
      }
      aria-label={itemTitle ? `${itemTitle} saxla` : 'Saxla'}
    >
      <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
      {showText && <span className="font-medium">{hasSaved ? 'Saxlanıldı' : 'Saxla'} {totalSaves > 0 ? `(${totalSaves})` : ''}</span>}
      {!showText && totalSaves > 0 && <span className="text-xs font-semibold">({totalSaves})</span>}
    </Button>
  )
}
