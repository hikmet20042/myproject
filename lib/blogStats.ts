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
    console.log(`[getBlogStats] Fetching stats: blogId="${blogId}", userId="${userId || 'anonymous'}"`)
    
    const { data, error } = await supabase.rpc('get_blog_stats_v2', {
      p_blog_id: blogId,
      p_user_id: userId || null,
    })

    if (error) {
      console.warn('blogStats: RPC failed', { blogId, error })
      return {
        views: 0,
        likes: 0,
        dislikes: 0,
        uniqueViews: 0,
        engagementScore: 0,
        userReaction: null,
      }
    }

    console.log('[getBlogStats] RPC success:', data)
    return {
      views: Number(data.views),
      likes: Number(data.likes),
      dislikes: Number(data.dislikes),
      uniqueViews: Number(data.unique_views),
      engagementScore: Number(data.engagement_score),
      userReaction: data.user_reaction || null,
    }
  } catch (error) {
    console.warn('blogStats: unexpected error', { blogId, error })
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

