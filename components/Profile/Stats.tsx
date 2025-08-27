interface ProfileStats {
  totalDrafts: number
  totalArticles: number
  totalStories: number
  totalViews: number
  totalLikes: number
  joinedDate: string
  lastActive: string
  writingStreak: number
  completedDrafts: number
  avgWordsPerDraft: number
}

interface StatsProps {
  profileStats: ProfileStats
}

export default function Stats ({profileStats}: StatsProps){

    return (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profileStats.totalDrafts}</div>
                  <div className="text-sm text-gray-500">Drafts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profileStats.totalArticles}</div>
                  <div className="text-sm text-gray-500">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{profileStats.totalStories}</div>
                  <div className="text-sm text-gray-500">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{profileStats.totalViews}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{profileStats.totalLikes}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
              </div>
    )
}