'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  FileText,
  Clock,
  Zap,
  Award,
  PieChart,
  Activity
} from 'lucide-react'

interface DraftStats {
  totalDrafts: number
  avgWordCount: number
  avgCompletionPercentage: number
  totalWordCount: number
  folderDistribution: string[]
}

interface FolderStats {
  _id: string
  count: number
  avgCompletion: number
}

interface DraftAnalyticsProps {
  userId?: string
}

export default function DraftAnalytics({ userId }: DraftAnalyticsProps) {
  const [stats, setStats] = useState<DraftStats | null>(null)
  const [folderStats, setFolderStats] = useState<FolderStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/drafts/bulk')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setFolderStats(data.folderStats || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <BarChart3 className="mx-auto h-12 w-12 mb-2" />
          <p>No analytics data available</p>
        </div>
      </div>
    )
  }



  const getProductivityScore = () => {
    const completionScore = stats.avgCompletionPercentage || 0
    const activityScore = Math.min((stats.totalDrafts / 10) * 100, 100)
    const consistencyScore = folderStats.length > 0 ? 
      (folderStats.reduce((sum, folder) => sum + folder.avgCompletion, 0) / folderStats.length) : 0
    
    return Math.round((completionScore + activityScore + consistencyScore) / 3)
  }

  const productivityScore = getProductivityScore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Draft Analytics</h2>
          <p className="text-gray-600">Insights into your writing productivity</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDrafts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.avgCompletionPercentage || 0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Words</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.avgWordCount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productivity</p>
              <p className="text-2xl font-bold text-gray-900">{productivityScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6">


        {/* Folder Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Folder Performance</h3>
          <div className="space-y-3">
            {folderStats.slice(0, 5).map((folder, index) => (
              <div key={folder._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 
                    index === 2 ? 'bg-yellow-500' : 
                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 truncate max-w-24">
                    {folder._id || 'Uncategorized'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{folder.count} drafts</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(folder.avgCompletion)}%
                  </span>
                </div>
              </div>
            ))}
            {folderStats.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No folder data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Writing Velocity</h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(stats.totalWordCount / Math.max(stats.totalDrafts, 1))}
            </p>
            <p className="text-xs text-gray-500">words per draft</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Completion Rate</h4>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(stats.avgCompletionPercentage || 0)}%
            </p>
            <p className="text-xs text-gray-500">average completion</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Organization</h4>
            <p className="text-2xl font-bold text-purple-600">{folderStats.length}</p>
            <p className="text-xs text-gray-500">active folders</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Recommendations</h3>
        <div className="space-y-2">
          {stats.avgCompletionPercentage < 50 && (
            <p className="text-sm text-gray-700">
              • Consider breaking down large drafts into smaller, manageable sections
            </p>
          )}

          {folderStats.length < 3 && stats.totalDrafts > 5 && (
            <p className="text-sm text-gray-700">
              • Organize your drafts into folders for better management
            </p>
          )}
          {stats.avgWordCount < 100 && (
            <p className="text-sm text-gray-700">
              • Try setting daily word count goals to increase your writing output
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
