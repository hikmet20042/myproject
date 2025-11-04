import { useLanguage } from '@/contexts/LanguageContext'

interface ProfileStats {
  totalBlogs: number
  joinedDate: string
  lastActive: string
  writingStreak: number
}

interface StatsProps {
  profileStats: ProfileStats
}

export default function Stats ({profileStats}: StatsProps){
    const { t } = useLanguage()

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{profileStats.totalBlogs}</div>
                  <div className="text-sm text-gray-500">{t('profile.stats.blogs')}</div>
                </div>

              </div>
    )
}