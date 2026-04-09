type BlogStatsResult = {
  views: number
  likes: number
  dislikes: number
  userReaction: 'like' | 'dislike' | null
  uniqueViews: number
  engagementScore: number
}

export async function getBlogStats(
  supabase: any,
  blogId: string,
  userId?: string | null,
): Promise<BlogStatsResult> {
  try {
    const [viewsRes, likesRes, dislikesRes, userReactionRes, uniqueSessionRes] = await Promise.all([
      supabase
        .from('blog_views')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId),
      supabase
        .from('blog_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId)
        .eq('reaction_type', 'like'),
      supabase
        .from('blog_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId)
        .eq('reaction_type', 'dislike'),
      userId
        ? supabase
            .from('blog_reactions')
            .select('reaction_type')
            .eq('blog_id', blogId)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('blog_views')
        .select('session_id')
        .eq('blog_id', blogId),
    ])

    if (viewsRes.error || likesRes.error || dislikesRes.error || userReactionRes.error || uniqueSessionRes.error) {
      console.warn('blogStats fallback: failed to read from event tables', {
        blogId,
        viewsError: viewsRes.error?.message,
        likesError: likesRes.error?.message,
        dislikesError: dislikesRes.error?.message,
        reactionError: userReactionRes.error?.message,
        uniqueViewsError: uniqueSessionRes.error?.message,
      })
      return {
        views: 0,
        likes: 0,
        dislikes: 0,
        uniqueViews: 0,
        engagementScore: 0,
        userReaction: null,
      }
    }

    const views = viewsRes.count || 0
    const likes = likesRes.count || 0
    const dislikes = dislikesRes.count || 0
    const uniqueViews = new Set((uniqueSessionRes.data || []).map((row: any) => row.session_id)).size
    const engagementScore = Math.max(0, views + likes * 3 - dislikes)

    return {
      views,
      likes,
      dislikes,
      uniqueViews,
      engagementScore,
      userReaction: (userReactionRes.data?.reaction_type as 'like' | 'dislike' | null) || null,
    }
  } catch (error) {
    console.warn('blogStats fallback: unexpected error while reading event tables', { blogId, error })
    return {
      views: 0,
      likes: 0,
      dislikes: 0,
      uniqueViews: 0,
      engagementScore: 0,
      userReaction: null,
    }
  }
}
