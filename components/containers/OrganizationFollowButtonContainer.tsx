'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { trackOrganizationFollow } from '@/lib/analytics'
import { fetchOrganizationFollowState, toggleOrganizationFollow } from '@/lib/organizationQueries'

type OrganizationFollowButtonContainerProps = {
  organizationId: string
  organizationName?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showFollowerCount?: boolean
  className?: string
}

const getFollowQueryKey = (organizationId: string, userId?: string | null) =>
  ['organization-follow', organizationId, userId || 'guest'] as const

export default function OrganizationFollowButtonContainer({
  organizationId,
  organizationName,
  size = 'sm',
  showFollowerCount = true,
  className = '',
}: OrganizationFollowButtonContainerProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()
  const { showError, showSuccess, showInfo } = useGlobalFeedback()

  const isOrgAccount = session?.user?.accountType === 'organization'
  const userId = session?.user?.id
  const isRegularUser = session?.user?.accountType === 'user'
  const shouldFetchFollowState =
    Boolean(organizationId) &&
    status !== 'loading' &&
    (showFollowerCount || Boolean(userId)) &&
    !isOrgAccount

  const followQuery = useQuery({
    queryKey: getFollowQueryKey(organizationId, userId),
    queryFn: () => fetchOrganizationFollowState(organizationId),
    enabled: shouldFetchFollowState,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const mutation = useMutation({
    mutationFn: (action: 'follow' | 'unfollow' | 'toggle') =>
      toggleOrganizationFollow(organizationId, action),
    onMutate: async (action) => {
      const key = getFollowQueryKey(organizationId, userId)
      await queryClient.cancelQueries({ queryKey: key })

      const previous = queryClient.getQueryData<{
        organizationId: string
        isFollowing: boolean
        followerCount: number
      }>(key)

      if (previous) {
        const nextIsFollowing = action === 'toggle' ? !previous.isFollowing : action === 'follow'
        const delta = nextIsFollowing ? 1 : -1
        queryClient.setQueryData(key, {
          ...previous,
          isFollowing: nextIsFollowing,
          followerCount: Math.max(0, Number(previous.followerCount || 0) + delta),
        })
      }

      return { previous }
    },
    onError: (error: any, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(getFollowQueryKey(organizationId, userId), context.previous)
      }
      showError(error?.message || 'İzləmə əməliyyatı alınmadı')
    },
    onSuccess: (data) => {
      queryClient.setQueryData(getFollowQueryKey(organizationId, userId), data)
      queryClient.invalidateQueries({ queryKey: ['followed-organizations'] })
      queryClient.invalidateQueries({ queryKey: ['my-organization'] })

      const actionType = data.isFollowing ? 'follow' : 'unfollow'
      trackOrganizationFollow(organizationName || 'Organization', actionType)

      if (data.isFollowing) {
        showSuccess('Təşkilat izləməyə alındı')
      } else {
        showInfo('Təşkilat izləmədən çıxarıldı')
      }
    },
  })

  const isFollowing = Boolean(followQuery.data?.isFollowing)
  const followerCount = Number(followQuery.data?.followerCount || 0)

  const followerLabel = useMemo(() => {
    if (!showFollowerCount) return ''
    return `${followerCount.toLocaleString('az-AZ')} izləyici`
  }, [followerCount, showFollowerCount])

  const requireAuth = useRequireAuth()

  const handleToggle = () => {
    if (status === 'loading') return

    if (!requireAuth()) return

    if (!isRegularUser) {
      showInfo('Yalnız fərdi hesablar təşkilatları izləyə bilər')
      return
    }

    mutation.mutate('toggle')
  }

  if (status !== 'loading' && isOrgAccount) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={isFollowing ? 'primary' : 'outline'}
        size={size}
        loading={mutation.isPending}
        onClick={handleToggle}
        icon={Users}
        iconPosition="left"
        hoverEffect="scale"
      >
        {isFollowing ? 'İzləyirsən' : 'İzlə'}
      </Button>
      {showFollowerCount && (
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {followerLabel}
        </span>
      )}
    </div>
  )
}
