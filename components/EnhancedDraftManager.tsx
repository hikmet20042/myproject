'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  FolderPlus,
  Star,
  Clock,
  FileText,
  MoreVertical,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Trash2,
  Edit,
  Eye,
  History,
  Tag,
  Bookmark,
  BarChart3,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react'

interface Draft {
  _id: string
  title: string
  abstract?: string
  tags: string[]
  category: string
  updatedAt: string
  createdAt: string
  draftMetadata?: {
    folder?: string
    priority?: 'low' | 'medium' | 'high'
    completionPercentage?: number
    estimatedReadTime?: number
    wordCount?: number
    isTemplate?: boolean
    templateName?: string
    notes?: string
    lastActivity?: string
    isMarkedForDeletion?: boolean
    scheduledDeletionDate?: string
    inactivityWarningsSent?: number
  }
  // Deletion status fields
  status?: 'active' | 'warning' | 'final_warning' | 'marked_for_deletion'
  daysInactive?: number
  daysUntilDeletion?: number
  scheduledDeletionDate?: string
  canRecover?: boolean

}

interface EnhancedDraftManagerProps {
  initialDrafts: Draft[]
  onDraftSelect?: (draft: Draft) => void
  onDraftEdit?: (draftId: string) => void
  onDraftDelete?: (draftId: string) => void
  onBulkDelete?: (draftIds: string[]) => Promise<void>
}

export default function EnhancedDraftManager({
  initialDrafts,
  onDraftSelect,
  onDraftEdit,
  onDraftDelete,
  onBulkDelete
}: EnhancedDraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts)
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>(initialDrafts)
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'priority'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sync internal state when initialDrafts prop changes (parent fetches asynchronously)
  useEffect(() => {
    setDrafts(initialDrafts || [])
    // Reconcile selections to only include still-present drafts
    setSelectedDrafts(prev => (initialDrafts || []).length
      ? prev.filter(id => (initialDrafts || []).some(d => d._id === id))
      : [])
  }, [initialDrafts])

  // Get unique folders and priorities for filters
  const folders = Array.from(new Set(drafts.map(d => d.draftMetadata?.folder).filter(Boolean)))
  const priorities = ['low', 'medium', 'high']

  // Filter and sort drafts
  useEffect(() => {
    let filtered = [...drafts]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(draft => 
        draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.abstract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        draft.draftMetadata?.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Folder filter
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(draft => draft.draftMetadata?.folder === selectedFolder)
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(draft => draft.draftMetadata?.priority === selectedPriority)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.draftMetadata?.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.draftMetadata?.priority as keyof typeof priorityOrder] || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredDrafts(filtered)
  }, [drafts, searchQuery, selectedFolder, selectedPriority, sortBy, sortOrder])

  const handleSelectDraft = (draftId: string) => {
    setSelectedDrafts(prev => 
      prev.includes(draftId) 
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDrafts.length === filteredDrafts.length) {
      setSelectedDrafts([])
    } else {
      setSelectedDrafts(filteredDrafts.map(d => d._id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDrafts.length === 0) return

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedDrafts.length} draft${selectedDrafts.length !== 1 ? 's' : ''}? This action cannot be undone.`)
    if (!confirmed) return

    setLoading(true)
    try {
      if (onBulkDelete) {
        // Use the bulk delete function if provided
        await onBulkDelete(selectedDrafts)
      } else if (onDraftDelete) {
        // Fallback to individual deletes
        for (const draftId of selectedDrafts) {
          await onDraftDelete(draftId)
        }
      }

      // Remove deleted drafts from local state
      setDrafts(prev => prev.filter(draft => !selectedDrafts.includes(draft._id)))
      setSelectedDrafts([])
    } catch (error) {
      console.error('Error deleting drafts:', error)
      alert('Failed to delete some drafts. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Select All Button */}
          {filteredDrafts.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {selectedDrafts.length === filteredDrafts.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Controls */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border border-gray-300 rounded-lg ${showFilters ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedFolder('all')
                  setSelectedPriority('all')
                  setSearchQuery('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection and Bulk Actions */}
      {selectedDrafts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedDrafts.length} draft{selectedDrafts.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="px-3 py-1 text-sm bg-white border border-red-300 rounded text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete
              </button>
              <button
                onClick={() => setSelectedDrafts([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts Display */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
        {filteredDrafts.map((draft) => (
          <DraftCard
            key={draft._id}
            draft={draft}
            viewMode={viewMode}
            isSelected={selectedDrafts.includes(draft._id)}
            onSelect={() => handleSelectDraft(draft._id)}
            onEdit={() => onDraftEdit?.(draft._id)}
            onDelete={() => onDraftDelete?.(draft._id)}
            getPriorityColor={getPriorityColor}
            formatDate={formatDate}
          />
        ))}
      </div>

      {filteredDrafts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedFolder !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start writing to create your first draft'
            }
          </p>
        </div>
      )}
    </div>
  )
}

// Separate component for individual draft cards
function DraftCard({
  draft,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getPriorityColor,
  formatDate
}: any) {
  const [showMenu, setShowMenu] = useState(false)

  if (viewMode === 'list') {
    return (
      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="h-4 w-4 text-blue-600 rounded"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {draft.title || '(Untitled Draft)'}
                </h3>
                {draft.draftMetadata?.isTemplate && (
                  <Bookmark className="h-4 w-4 text-blue-500" />
                )}
              </div>

              {/* Deletion Warning */}
              <DeletionWarning draft={draft} />

              <p className="text-sm text-gray-500 truncate">
                {draft.abstract || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(draft.draftMetadata?.priority)}`}>
              {draft.draftMetadata?.priority || 'medium'}
            </span>
            
            <div className="text-xs text-gray-500">
              {formatDate(draft.updatedAt)}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    View Versions
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 text-blue-600 rounded"
        />
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onEdit(); setShowMenu(false) }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center">
                <History className="h-4 w-4 mr-2" />
                View Versions
              </button>
              <button
                onClick={() => { onDelete(); setShowMenu(false) }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 truncate flex-1">
            {draft.title || '(Untitled Draft)'}
          </h3>
          {draft.draftMetadata?.isTemplate && (
            <Bookmark className="h-4 w-4 text-blue-500" />
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {draft.abstract || 'No description available'}
        </p>



        {/* Tags */}
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {draft.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {draft.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{draft.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(draft.draftMetadata?.priority)}`}>
            {draft.draftMetadata?.priority || 'medium'}
          </span>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {draft.draftMetadata?.wordCount && (
              <span>{draft.draftMetadata.wordCount} words</span>
            )}
            <span>•</span>
            <span>{formatDate(draft.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Deletion Warning Component
function DeletionWarning({ draft }: { draft: Draft }) {
  const [isRecovering, setIsRecovering] = useState(false)

  if (!draft.status || draft.status === 'active') {
    return null
  }

  const handleRecover = async () => {
    if (!draft.canRecover) return

    setIsRecovering(true)
    try {
      const response = await fetch('/api/drafts/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recover_from_deletion',
          draftId: draft._id
        })
      })

      if (response.ok) {
        // Refresh the page or update the draft list
        window.location.reload()
      } else {
        console.error('Failed to recover draft')
      }
    } catch (error) {
      console.error('Error recovering draft:', error)
    } finally {
      setIsRecovering(false)
    }
  }

  const getWarningStyle = () => {
    switch (draft.status) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'final_warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'marked_for_deletion':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getWarningIcon = () => {
    switch (draft.status) {
      case 'warning':
        return <Clock className="h-4 w-4" />
      case 'final_warning':
        return <Target className="h-4 w-4" />
      case 'marked_for_deletion':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getWarningMessage = () => {
    const daysInactive = draft.daysInactive || 0
    const daysUntilDeletion = draft.daysUntilDeletion || 0

    switch (draft.status) {
      case 'warning':
        return `Inactive for ${daysInactive} days. Will be deleted in ${daysUntilDeletion} days.`
      case 'final_warning':
        return `FINAL WARNING: Inactive for ${daysInactive} days. Will be deleted in ${daysUntilDeletion} days.`
      case 'marked_for_deletion':
        const deletionDate = draft.scheduledDeletionDate ? new Date(draft.scheduledDeletionDate) : null
        return deletionDate
          ? `Scheduled for deletion on ${deletionDate.toLocaleDateString()}`
          : 'Marked for deletion'
      default:
        return 'Draft status unknown'
    }
  }

  return (
    <div className={`mt-2 p-2 rounded-md border text-xs ${getWarningStyle()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getWarningIcon()}
          <span className="font-medium">{getWarningMessage()}</span>
        </div>

        {draft.canRecover && draft.status === 'marked_for_deletion' && (
          <button
            onClick={handleRecover}
            disabled={isRecovering}
            className="ml-2 px-2 py-1 bg-white border border-current rounded text-xs hover:bg-gray-50 disabled:opacity-50"
          >
            {isRecovering ? 'Recovering...' : 'Recover'}
          </button>
        )}
      </div>

      {draft.status !== 'marked_for_deletion' && (
        <div className="mt-1 text-xs opacity-75">
          Edit this draft to reset the deletion timer.
        </div>
      )}
    </div>
  )
}
