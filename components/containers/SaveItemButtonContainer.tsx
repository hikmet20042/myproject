'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { SaveItemButton } from '@/components/ui/SaveItemButton'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

interface SaveItemButtonContainerProps {
  itemId: string
  itemType: 'event' | 'vacancy' | 'blog'
  itemTitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const keyFor = (itemType: string, itemId: string) => ['saved-item', itemType, itemId]

export default function SaveItemButtonContainer({
  itemId,
  itemType,
  itemTitle = '',
  className = '',
  size = 'sm',
  showText = true,
}: SaveItemButtonContainerProps) {
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

  return (
    <SaveItemButton
      isSaved={hasSaved}
      totalSaves={totalSaves}
      isLoading={loadingState}
      isAuthLoading={isAuthLoading}
      isAuthenticated={Boolean(session?.user?.id)}
      itemTypeLabel={itemTypeLabel}
      itemTitle={itemTitle}
      className={className}
      size={size}
      showText={showText}
      onToggle={handleSave}
    />
  )
}
