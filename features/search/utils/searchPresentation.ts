import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  type LucideIcon,
} from 'lucide-react'
import type { GlobalSearchType } from '@/features/search/types/search.types'

export const SEARCH_TYPE_LABELS: Record<GlobalSearchType, string> = {
  event: 'Tədbir',
  vacancy: 'Vakansiya',
  blog: 'Bloq',
  organization: 'Təşkilat',
}

export const getSearchTypeIcon = (type: GlobalSearchType): LucideIcon => {
  if (type === 'event') return Calendar
  if (type === 'vacancy') return Briefcase
  if (type === 'organization') return Building2
  return BookOpen
}

export const formatSearchResultDate = (value: string | null): string => {
  if (!value) return 'Tarix qeyd olunmayıb'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tarix qeyd olunmayıb'

  return date.toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
